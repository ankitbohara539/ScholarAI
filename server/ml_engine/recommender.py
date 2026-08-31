import json
from dataclasses import asdict, dataclass
from pathlib import Path

import numpy as np
import pandas as pd
import torch

from .config import FEATURE_COLUMNS, METADATA_PATH, MODEL_PATH, QS_DATA
from .data import load_universities
from .model import AdmissionMLP


@dataclass(frozen=True)
class StudentProfile:
    gre_score: float
    toefl_score: float
    sop: float
    lor: float
    gpa: float
    research: int
    desired_university_rating: int = 4
    preferred_regions: tuple[str, ...] = ()
    preferred_countries: tuple[str, ...] = ()

    def validate(self) -> None:
        ranges = {
            "gre_score": (self.gre_score, 260, 340),
            "toefl_score": (self.toefl_score, 0, 120),
            "sop": (self.sop, 1, 5),
            "lor": (self.lor, 1, 5),
            "gpa": (self.gpa, 0, 4),
            "research": (self.research, 0, 1),
            "desired_university_rating": (self.desired_university_rating, 1, 5),
        }
        errors = [f"{name} must be between {low} and {high}" for name, (value, low, high) in ranges.items() if not low <= value <= high]
        if errors:
            raise ValueError("; ".join(errors))


class HybridUniversityRecommender:
    """ANN + similar-applicant cohort + university-content recommender."""

    def __init__(
        self,
        model_path: Path = MODEL_PATH,
        metadata_path: Path = METADATA_PATH,
        university_path: Path = QS_DATA,
    ):
        if not model_path.exists() or not metadata_path.exists():
            raise FileNotFoundError("Model artifacts not found. Run: python -m ml_engine.train")
        checkpoint = torch.load(model_path, map_location="cpu", weights_only=True)
        self.model = AdmissionMLP(checkpoint["input_size"], tuple(checkpoint["hidden_sizes"]))
        self.model.load_state_dict(checkpoint["model_state"])
        self.model.eval()
        self.metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        self.mean = np.asarray(self.metadata["scaler_mean"], dtype=np.float32)
        self.scale = np.asarray(self.metadata["scaler_scale"], dtype=np.float32)
        self.cohort_x = np.asarray(self.metadata["cohort_features"], dtype=np.float32)
        self.cohort_y = np.asarray(self.metadata["cohort_targets"], dtype=np.float32)
        self.universities = load_universities(university_path)

    @staticmethod
    def _category(fit_score: float) -> str:
        if fit_score >= 0.70:
            return "safety"
        if fit_score >= 0.45:
            return "target"
        return "reach"

    def _feature_matrix(self, profile: StudentProfile) -> np.ndarray:
        count = len(self.universities)
        return np.column_stack(
            (
                np.full(count, profile.gre_score),
                np.full(count, profile.toefl_score),
                self.universities["university_rating"].to_numpy(),
                np.full(count, profile.sop),
                np.full(count, profile.lor),
                np.full(count, profile.gpa),
                np.full(count, profile.research),
            )
        ).astype(np.float32)

    def _cohort_scores(self, raw_features: np.ndarray, neighbors: int = 25) -> np.ndarray:
        scaled_candidates = (raw_features - self.mean) / self.scale
        scaled_cohort = (self.cohort_x - self.mean) / self.scale
        results = np.empty(len(raw_features), dtype=np.float32)
        # Only five university ratings exist, so cache the repeated applicant vectors.
        cache: dict[int, float] = {}
        for index, row in enumerate(raw_features):
            rating = int(row[2])
            if rating not in cache:
                distances = np.linalg.norm(scaled_cohort - scaled_candidates[index], axis=1)
                nearest = np.argpartition(distances, min(neighbors, len(distances)) - 1)[:neighbors]
                weights = 1.0 / (distances[nearest] + 1e-6)
                cache[rating] = float(np.average(self.cohort_y[nearest], weights=weights))
            results[index] = cache[rating]
        return results

    def recommend(
        self,
        profile: StudentProfile,
        top_k: int = 10,
        strategy: str = "balanced",
        ann_weight: float = 0.50,
        cohort_weight: float = 0.25,
        content_weight: float = 0.25,
    ) -> list[dict]:
        profile.validate()
        if top_k < 1:
            raise ValueError("top_k must be at least 1")
        if strategy not in {"balanced", "reach", "target", "safety", "all"}:
            raise ValueError("strategy must be balanced, reach, target, safety, or all")
        if not np.isclose(ann_weight + cohort_weight + content_weight, 1.0):
            raise ValueError("Hybrid weights must sum to 1.0")

        raw = self._feature_matrix(profile)
        scaled = (raw - self.mean) / self.scale
        with torch.no_grad():
            ann = self.model(torch.tensor(scaled, dtype=torch.float32)).numpy()
        cohort = self._cohort_scores(raw)

        preferred_regions = {value.casefold() for value in profile.preferred_regions}
        preferred_countries = {value.casefold() for value in profile.preferred_countries}
        has_location_preference = bool(preferred_regions or preferred_countries)
        location_match = np.array(
            [
                1.0
                if not has_location_preference
                or row.Region.casefold() in preferred_regions
                or row.Location.casefold() in preferred_countries
                else 0.10
                for row in self.universities.itertuples()
            ]
        )
        rating_match = 1.0 - (
            np.abs(self.universities["university_rating"].to_numpy() - profile.desired_university_rating) / 4.0
        )
        reputation = self.universities["reputation_normalized"].to_numpy()
        content = 0.45 * location_match + 0.25 * rating_match + 0.30 * reputation
        # The admission data has no university identity. Its rating field reflects
        # applicant selection as much as university difficulty, so calibrate the
        # model/cohort scores with QS rank instead of claiming raw probabilities.
        rank_fraction = np.clip(self.universities["rank_numeric"].to_numpy() / 1400.0, 0, 1)
        selectivity_factor = 0.35 + 0.65 * rank_fraction
        ann_adjusted = ann * selectivity_factor
        cohort_adjusted = cohort * selectivity_factor
        estimated_fit = (ann_weight * ann_adjusted + cohort_weight * cohort_adjusted) / (
            ann_weight + cohort_weight
        )
        score = ann_weight * ann_adjusted + cohort_weight * cohort_adjusted + content_weight * content

        result = self.universities.copy()
        result["ann_probability"] = ann
        result["cohort_probability"] = cohort
        result["estimated_fit_score"] = estimated_fit
        result["content_score"] = content
        result["hybrid_score"] = score
        result["category"] = result["estimated_fit_score"].map(self._category)
        result = result.sort_values(["hybrid_score", "rank_numeric"], ascending=[False, True])

        if strategy in {"reach", "target", "safety"}:
            result = result[result["category"] == strategy].head(top_k)
        elif strategy == "balanced":
            buckets = {name: result[result["category"] == name].copy() for name in ("reach", "target", "safety")}
            rows = []
            while len(rows) < top_k and any(not bucket.empty for bucket in buckets.values()):
                for name in ("reach", "target", "safety"):
                    if len(rows) < top_k and not buckets[name].empty:
                        rows.append(buckets[name].iloc[0])
                        buckets[name] = buckets[name].iloc[1:]
            result = pd.DataFrame(rows)
        else:
            result = result.head(top_k)

        output_columns = {
            "Institution_Name": "university",
            "Location": "country",
            "Region": "region",
            "RANK_2025": "qs_rank_2025",
            "Academic_Reputation_Score": "academic_reputation",
            "university_rating": "derived_rating",
            "ann_probability": "ann_model_score",
            "cohort_probability": "similar_applicant_score",
            "estimated_fit_score": "selectivity_adjusted_fit",
            "content_score": "content_match_score",
            "hybrid_score": "hybrid_score",
            "category": "category",
        }
        output = result[list(output_columns)].rename(columns=output_columns).copy()
        for column in ("ann_model_score", "similar_applicant_score", "selectivity_adjusted_fit", "content_match_score", "hybrid_score"):
            output[column] = output[column].astype(float).round(4)
        return output.to_dict(orient="records")


def profile_to_dict(profile: StudentProfile) -> dict:
    return asdict(profile)
