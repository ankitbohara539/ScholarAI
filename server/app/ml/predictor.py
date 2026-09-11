from dataclasses import dataclass

import numpy as np

from app.ml.model_loader import load_model_artifacts
from app.ml.preprocessing import prepare_candidates
from app.ml.scoring import RecommendationClassifier, score_candidates
from app.models.student_profile import StudentProfile
from app.models.university import University


@dataclass(frozen=True)
class Prediction:
    university_id: int
    score: float
    category: str
    ml_score: float | None = None


class RecommendationPredictor:
    def predict(self, profile: StudentProfile, universities: list[University], top_k: int) -> tuple[list[Prediction], str]:
        artifacts = load_model_artifacts()
        prepared = prepare_candidates(profile, universities)
        if not prepared.universities:
            return [], artifacts.version
        scores = score_candidates(
            artifacts,
            prepared.raw_features,
            prepared.content_scores,
            np.asarray([item.ranking for item in prepared.universities], dtype=np.float32),
        )
        order = np.argsort(-scores.hybrid)[:top_k]
        return [
            Prediction(
                university_id=prepared.universities[index].id,
                score=float(np.clip(scores.hybrid[index], 0, 1)),
                ml_score=float(np.clip(scores.ml[index], 0, 1)),
                category=RecommendationClassifier.classify(float(scores.fit[index])),
            )
            for index in order
        ], artifacts.version
