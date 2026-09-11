from dataclasses import dataclass

import numpy as np
import torch

from app.ml.model_loader import ModelArtifacts


@dataclass(frozen=True)
class CandidateScores:
    hybrid: np.ndarray
    ml: np.ndarray
    cohort: np.ndarray
    fit: np.ndarray


class RecommendationClassifier:
    """Deterministic Reach/Target/Safety classification for recommendation fit."""

    @staticmethod
    def classify(score: float) -> str:
        if score >= 0.70:
            return "safety"
        if score >= 0.45:
            return "target"
        return "reach"


def score_candidates(
    artifacts: ModelArtifacts,
    raw_features: np.ndarray,
    content_scores: np.ndarray,
    rankings: np.ndarray,
) -> CandidateScores:
    """Apply the canonical model, cohort, selectivity, and hybrid-score calculation."""
    scaled = (raw_features - artifacts.mean) / artifacts.scale
    with torch.no_grad():
        ann = artifacts.model(torch.tensor(scaled, dtype=torch.float32)).numpy()

    cohort_scaled = (artifacts.cohort_features - artifacts.mean) / artifacts.scale
    cohort = np.empty(len(raw_features), dtype=np.float32)
    cache: dict[int, float] = {}
    for index, row in enumerate(raw_features):
        rating = int(row[2])
        if rating not in cache:
            distances = np.linalg.norm(cohort_scaled - scaled[index], axis=1)
            count = min(25, len(distances))
            nearest = np.argpartition(distances, count - 1)[:count]
            weights = 1.0 / (distances[nearest] + 1e-6)
            cache[rating] = float(np.average(artifacts.cohort_targets[nearest], weights=weights))
        cohort[index] = cache[rating]

    rank_fraction = np.clip(rankings / 1400.0, 0, 1)
    selectivity = 0.35 + 0.65 * rank_fraction
    adjusted_ann = ann * selectivity
    adjusted_cohort = cohort * selectivity
    fit = (0.50 * adjusted_ann + 0.25 * adjusted_cohort) / 0.75
    hybrid = 0.50 * adjusted_ann + 0.25 * adjusted_cohort + 0.25 * content_scores
    return CandidateScores(hybrid=hybrid, ml=adjusted_ann, cohort=adjusted_cohort, fit=fit)
