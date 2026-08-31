from dataclasses import dataclass

import numpy as np
import torch

from app.ml.model_loader import load_model_artifacts
from app.ml.preprocessing import prepare_candidates
from app.models.student_profile import StudentProfile
from app.models.university import University


@dataclass(frozen=True)
class Prediction:
    university_id: int
    score: float
    category: str


class RecommendationPredictor:
    @staticmethod
    def _category(score: float) -> str:
        if score >= 0.70:
            return "safety"
        if score >= 0.45:
            return "target"
        return "reach"

    def predict(self, profile: StudentProfile, universities: list[University], top_k: int) -> tuple[list[Prediction], str]:
        artifacts = load_model_artifacts()
        prepared = prepare_candidates(profile, universities)
        if not prepared.universities:
            return [], artifacts.version
        scaled = (prepared.raw_features - artifacts.mean) / artifacts.scale
        with torch.no_grad():
            ann = artifacts.model(torch.tensor(scaled, dtype=torch.float32)).numpy()

        cohort_scaled = (artifacts.cohort_features - artifacts.mean) / artifacts.scale
        cohort = np.empty(len(prepared.raw_features), dtype=np.float32)
        cache: dict[int, float] = {}
        for index, row in enumerate(prepared.raw_features):
            rating = int(row[2])
            if rating not in cache:
                distances = np.linalg.norm(cohort_scaled - scaled[index], axis=1)
                count = min(25, len(distances))
                nearest = np.argpartition(distances, count - 1)[:count]
                weights = 1.0 / (distances[nearest] + 1e-6)
                cache[rating] = float(np.average(artifacts.cohort_targets[nearest], weights=weights))
            cohort[index] = cache[rating]

        rank_fraction = np.clip(np.asarray([item.ranking for item in prepared.universities]) / 1400.0, 0, 1)
        selectivity = 0.35 + 0.65 * rank_fraction
        adjusted_ann = ann * selectivity
        adjusted_cohort = cohort * selectivity
        fit = (0.50 * adjusted_ann + 0.25 * adjusted_cohort) / 0.75
        hybrid = 0.50 * adjusted_ann + 0.25 * adjusted_cohort + 0.25 * prepared.content_scores
        order = np.argsort(-hybrid)[:top_k]
        return [
            Prediction(
                university_id=prepared.universities[index].id,
                score=float(np.clip(hybrid[index], 0, 1)),
                category=self._category(float(fit[index])),
            )
            for index in order
        ], artifacts.version
