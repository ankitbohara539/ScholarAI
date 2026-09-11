from dataclasses import asdict, dataclass
from pathlib import Path

import numpy as np
import pandas as pd

from app.ml.model_loader import load_model_artifacts
from app.ml.scoring import RecommendationClassifier, score_candidates
from .config import QS_DATA
from .data import load_universities


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
    """Deprecated CSV/CLI adapter over the application's canonical scoring engine."""

    def __init__(
        self,
        university_path: Path = QS_DATA,
    ):
        self.artifacts = load_model_artifacts()
        self.universities = load_universities(university_path)

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

    def recommend(
        self,
        profile: StudentProfile,
        top_k: int = 10,
        strategy: str = "balanced",
    ) -> list[dict]:
        profile.validate()
        if top_k < 1:
            raise ValueError("top_k must be at least 1")
        if strategy not in {"balanced", "reach", "target", "safety", "all"}:
            raise ValueError("strategy must be balanced, reach, target, safety, or all")

        raw = self._feature_matrix(profile)
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
        scores = score_candidates(
            self.artifacts,
            raw,
            content.astype(np.float32),
            self.universities["rank_numeric"].to_numpy(dtype=np.float32),
        )

        result = self.universities.copy()
        result["ann_probability"] = scores.ml
        result["cohort_probability"] = scores.cohort
        result["estimated_fit_score"] = scores.fit
        result["content_score"] = content
        result["hybrid_score"] = scores.hybrid
        result["category"] = result["estimated_fit_score"].map(RecommendationClassifier.classify)
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
