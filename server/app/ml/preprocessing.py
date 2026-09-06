from dataclasses import dataclass

import numpy as np

from app.ml.exceptions import ArtifactValidationError
from app.models.student_profile import StudentProfile
from app.models.university import University
from ml_engine.config import FEATURE_COLUMNS


@dataclass(frozen=True)
class PreparedCandidates:
    universities: list[University]
    raw_features: np.ndarray
    content_scores: np.ndarray


def rank_to_rating(rank: int) -> int:
    if rank <= 50:
        return 5
    if rank <= 200:
        return 4
    if rank <= 500:
        return 3
    if rank <= 1000:
        return 2
    return 1


def prepare_candidates(profile: StudentProfile, universities: list[University]) -> PreparedCandidates:
    profile_values = (
        profile.gre_score,
        profile.toefl_score,
        profile.sop_rating,
        profile.lor_rating,
        profile.gpa,
        profile.has_research,
        profile.academic_reputation_preference,
    )
    if any(value is None for value in profile_values):
        raise ArtifactValidationError("Verified profile is missing required model features")

    eligible = [
        university
        for university in universities
        if (university.minimum_gpa is None or profile.gpa >= university.minimum_gpa)
        and (university.minimum_gre_score is None or profile.gre_score >= university.minimum_gre_score)
        and (not university.degree_levels or profile.preferred_degree_level in university.degree_levels)
    ]
    if not eligible:
        return PreparedCandidates([], np.empty((0, len(FEATURE_COLUMNS)), dtype=np.float32), np.empty(0, dtype=np.float32))

    ratings = np.asarray([rank_to_rating(item.ranking) for item in eligible], dtype=np.float32)
    raw = np.column_stack(
        (
            np.full(len(eligible), profile.gre_score),
            np.full(len(eligible), profile.toefl_score),
            ratings,
            np.full(len(eligible), float(profile.sop_rating)),
            np.full(len(eligible), float(profile.lor_rating)),
            np.full(len(eligible), float(profile.gpa)),
            np.full(len(eligible), int(profile.has_research)),
        )
    ).astype(np.float32)
    if raw.shape[1] != len(FEATURE_COLUMNS):
        raise ArtifactValidationError("Prediction feature order is invalid")

    preferred_country = (profile.preferred_country or "").casefold()
    preferred_region = (profile.preferred_region or "").casefold()
    location = np.asarray(
        [1.0 if item.country.casefold() == preferred_country or item.region.casefold() == preferred_region else 0.10 for item in eligible]
    )
    rating_match = 1.0 - np.abs(ratings - profile.academic_reputation_preference) / 4.0
    reputation = np.asarray([float(item.academic_reputation_score) / 100.0 for item in eligible])
    content = 0.45 * location + 0.25 * rating_match + 0.30 * reputation
    return PreparedCandidates(eligible, raw, content.astype(np.float32))
