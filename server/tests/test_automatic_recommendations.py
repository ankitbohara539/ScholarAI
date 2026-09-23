from decimal import Decimal

import pytest
from pydantic import ValidationError
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.ml.predictor import Prediction
from app.models.recommendation import Recommendation
from app.models.student_profile import StudentProfile
from app.models.university import University
from app.models.user import User, UserRole
from app.schemas.student_profile import AcademicProfileUpdate
from app.schemas.university import UniversityCreate
from app.services.recommendation_service import RecommendationService
from ml_engine.persistence import PickleModelError, load_model, save_model


class DeterministicPredictor:
    def predict(self, profile: StudentProfile, universities: list[University], top_k: int):
        return [Prediction(universities[0].id, float(profile.gpa) / 4, "target")], "test-v1"


def complete_profile(user_id: int) -> StudentProfile:
    return StudentProfile(
        user_id=user_id,
        gpa=Decimal("3.5"),
        gre_score=315,
        toefl_score=105,
        sop_rating=Decimal("4.0"),
        lor_rating=Decimal("4.0"),
        has_research=True,
        academic_field="Computer Science",
        academic_reputation_preference=4,
        minimum_gpa_preference=Decimal("1.0"),
        maximum_gpa_preference=Decimal("4.0"),
        preferred_country="Nepal",
        preferred_region="Asia",
        preferred_degree_level="Masters",
        profile_completion_percentage=100,
    )


def test_gpa_preference_range_validation() -> None:
    with pytest.raises(ValidationError, match="Minimum GPA cannot be greater"):
        AcademicProfileUpdate(
            gpa=3.5, gre_score=315, toefl_score=105, sop_rating=4, lor_rating=4,
            has_research=True, academic_field="Computer Science",
            academic_reputation_preference=4, minimum_gpa_preference=3.8,
            maximum_gpa_preference=3.2,
        )


def test_generation_is_idempotent_per_profile_version_and_regenerates_after_change(db: Session) -> None:
    user = User(full_name="Auto Student", email="auto@example.com", password_hash="unused", role=UserRole.STUDENT)
    db.add(user); db.flush()
    profile = complete_profile(user.id)
    university = University(
        name="Auto University", country="Nepal", region="Asia", ranking=10,
        academic_reputation_score=Decimal("95"), minimum_gpa=Decimal("3.0"),
        degree_levels=["Masters"],
    )
    db.add_all([profile, university]); db.commit()
    service = RecommendationService(db, predictor=DeterministicPredictor())

    first, _ = service.generate(user.id, 10)
    second, notification = service.generate(user.id, 10)
    assert second.generation_id == first.generation_id
    assert notification is None
    assert db.scalar(select(func.count(Recommendation.id))) == 1

    profile.gpa = Decimal("3.8")
    profile.recommendation_status = "pending"
    db.commit()
    regenerated, _ = service.generate(user.id, 10)
    assert regenerated.generation_id != first.generation_id
    assert db.scalar(select(func.count(Recommendation.id))) == 2


def test_pickle_round_trip_missing_and_corrupt_files(tmp_path) -> None:
    path = tmp_path / "models" / "admission.pkl"
    save_model({"input_size": 7, "metadata": {"feature_columns": []}}, path)
    assert load_model(path)["input_size"] == 7
    with pytest.raises(PickleModelError, match="does not exist"):
        load_model(tmp_path / "missing.pkl")
    corrupt = tmp_path / "corrupt.pkl"
    corrupt.write_bytes(b"not a pickle")
    with pytest.raises(PickleModelError, match="corrupt or incompatible"):
        load_model(corrupt)


def test_comparison_metrics_validate_missing_and_available_data() -> None:
    sparse = UniversityCreate(name="Sparse U", country="Nepal", region="Asia", ranking=2, academic_reputation_score=90)
    assert sparse.graduation_rate is None and sparse.student_population is None
    rich = UniversityCreate(
        name="Rich U", country="Nepal", region="Asia", ranking=1,
        academic_reputation_score=95, graduation_rate=88.5, student_population=12000,
    )
    assert rich.graduation_rate == Decimal("88.5") and rich.student_population == 12000
