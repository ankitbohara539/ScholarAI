from decimal import Decimal
from io import BytesIO

import pytest
from fastapi.testclient import TestClient
from PIL import Image
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.ml.predictor import Prediction
from app.models.scholarship import Scholarship
from app.models.student_profile import StudentProfile, VerificationStatus
from app.models.university import University
from app.models.user import User, UserRole
from app.schemas.recommendation import SimulationRequest
from app.services.cost_estimator import CostEstimator
from app.services.match_service import MatchEvaluator, MatchWeights
from app.services.profile_storage_service import ProfileStorageService
from app.services.recommendation_service import RecommendationService


def register(client: TestClient, email: str) -> tuple[dict, dict[str, str]]:
    payload = {"full_name": "Test Student", "email": email, "password": "StrongPassword123!"}
    user = client.post("/api/auth/register", json=payload).json()
    token = client.post("/api/auth/login", json={"email": email, "password": payload["password"]}).json()["access_token"]
    return user, {"Authorization": f"Bearer {token}"}


def add_admin(db: Session, email: str = "admin.enhancement@example.com") -> User:
    admin = User(full_name="Test Admin", email=email, password_hash=hash_password("StrongPassword123!"), role=UserRole.ADMIN)
    db.add(admin); db.commit(); db.refresh(admin); return admin


def university(**overrides: object) -> University:
    values = {"name": "Test University", "country": "Nepal", "region": "Asia", "ranking": 100, "academic_reputation_score": Decimal("80"), "minimum_gpa": Decimal("3.0"), "minimum_gre_score": 300, "tuition_fee": Decimal("20000"), "estimated_living_cost": Decimal("8000"), "application_fee": Decimal("100"), "currency": "USD", "programs": ["Computer Science"]}
    values.update(overrides)
    return University(**values)


def profile(user_id: int = 1, **overrides: object) -> StudentProfile:
    values = {"user_id": user_id, "gpa": Decimal("3.5"), "gre_score": 315, "toefl_score": 105, "sop_rating": Decimal("4.0"), "lor_rating": Decimal("4.0"), "has_research": True, "academic_field": "Computer Science", "academic_reputation_preference": 4, "preferred_country": "Nepal", "preferred_region": "Asia", "preferred_degree_level": "Masters", "max_tuition_budget": Decimal("25000"), "budget_currency": "USD", "profile_completion_percentage": 100, "verification_status": VerificationStatus.VERIFIED}
    values.update(overrides)
    return StudentProfile(**values)


def test_user_updates_only_own_profile(client: TestClient) -> None:
    first, first_headers = register(client, "profile.one@example.com")
    second, second_headers = register(client, "profile.two@example.com")
    response = client.patch("/api/profile", json={"full_name": "Updated Student"}, headers=first_headers)
    assert response.status_code == 200 and response.json()["full_name"] == "Updated Student"
    assert client.get("/api/profile", headers=second_headers).json()["full_name"] == second["full_name"]
    assert response.json()["id"] == first["id"]


def test_avatar_validation_and_upload(client: TestClient, tmp_path) -> None:
    _, headers = register(client, "avatar@example.com")
    invalid = client.post("/api/profile/avatar", files={"avatar": ("payload.exe", b"not-image", "application/octet-stream")}, headers=headers)
    assert invalid.status_code == 400
    stream = BytesIO(); Image.new("RGB", (4, 4), "blue").save(stream, format="PNG")
    uploaded = client.post("/api/profile/avatar", files={"avatar": ("photo.png", stream.getvalue(), "image/png")}, headers=headers)
    assert uploaded.status_code == 200 and uploaded.json()["profile_picture_url"].startswith("/media/avatars/")
    assert client.delete("/api/profile/avatar", headers=headers).status_code == 200
    storage = ProfileStorageService(root=tmp_path, max_bytes=4)
    with pytest.raises(Exception):
        storage.save(b"12345", "image/png")


def test_submission_notifies_active_admin_and_student(client: TestClient, db: Session) -> None:
    student, headers = register(client, "submit.notice@example.com")
    admin = add_admin(db)
    academic = {"gpa": 3.5, "gre_score": 315, "toefl_score": 105, "sop_rating": 4, "lor_rating": 4, "has_research": True, "academic_field": "Computer Science", "academic_reputation_preference": 4}
    preferences = {"preferred_country": "Nepal", "preferred_region": "Asia", "preferred_city": None, "preferred_degree_level": "Masters", "max_tuition_budget": 25000, "preferred_university_type": None}
    client.patch("/api/student/profile/academic", json=academic, headers=headers)
    client.patch("/api/student/profile/preferences", json=preferences, headers=headers)
    assert client.post("/api/student/profile/submit-verification", headers=headers).status_code == 200
    db.expire_all()
    from app.models.notification import Notification
    rows = db.query(Notification).all()
    assert {row.user_id for row in rows} == {admin.id, student["id"]}
    assert any(row.title == "New Verification Request" for row in rows)


def test_match_criteria_are_bounded_weighted_and_explained() -> None:
    evaluator = MatchEvaluator()
    candidate = university()
    student = profile()
    result = evaluator.evaluate(student, candidate)
    assert 0 <= result.match_score <= 100
    assert evaluator.gpa(3.5, 3.0)[1] == 1 and evaluator.gpa(2.5, 3.0)[1] < 1
    assert evaluator.test(315, 300)[1] == 1 and evaluator.test(290, 300)[1] < 1
    assert evaluator.budget(25000, "USD", 20000, "USD")[1] == 1
    assert evaluator.budget(10000, "USD", 20000, "USD")[1] == .5
    assert evaluator.program("Computer Science", ["Computer Science"])[1] == 1
    assert evaluator.program("History", ["Computer Science"])[1] == 0
    assert "meets" in result.breakdown["gpa"].reason.lower()
    only_gpa = MatchEvaluator(MatchWeights(gpa=1, test=0, budget=0, program=0)).evaluate(student, candidate)
    assert only_gpa.match_score == 100


def test_match_missing_data_is_unknown_and_available_weights_are_normalized() -> None:
    result = MatchEvaluator().evaluate(profile(), university(minimum_gre_score=None))
    assert result.breakdown["test"].status == "unknown"
    assert result.breakdown["test"].score is None
    assert result.coverage == .8
    assert result.match_score == 100

    sparse = MatchEvaluator().evaluate(
        profile(max_tuition_budget=None, academic_field=None),
        university(minimum_gre_score=None, programs=None),
    )
    assert sparse.available_criteria == 1
    assert sparse.coverage == .3
    assert sparse.match_score == 100

    empty = MatchEvaluator().evaluate(
        profile(gpa=None, gre_score=None, max_tuition_budget=None, academic_field=None),
        university(minimum_gpa=None, minimum_gre_score=None, programs=None),
    )
    assert empty.match_score is None
    assert empty.coverage == 0


def test_budget_match_requires_compatible_currencies() -> None:
    evaluator = MatchEvaluator()
    assert evaluator.budget(25000, None, 20000, "USD")[:2] == ("unknown", None)
    assert evaluator.budget(25000, "NPR", 20000, "USD")[:2] == ("unknown", None)


def test_cost_formula_missing_values_and_scholarship_relationship(db: Session) -> None:
    student = profile()
    candidate = university()
    candidate.scholarships = [Scholarship(name="Merit Award", amount=Decimal("4000"), minimum_gpa=Decimal("3.2"))]
    db.add(candidate); db.commit(); db.refresh(candidate)
    estimate = CostEstimator.estimate(student, candidate)
    assert estimate.estimated_total == 24100
    assert estimate.potential_aid == 4000
    assert candidate.scholarships[0].university_id == candidate.id
    missing = CostEstimator.estimate(student, university(tuition_fee=None, estimated_living_cost=None, application_fee=None))
    assert missing.estimated_total is None and set(missing.missing_fields) == {"tuition", "living_cost", "application_fee"}


class ProfileAwarePredictor:
    def predict(self, current: StudentProfile, universities: list[University], top_k: int):
        score = float(current.gpa) / 4
        return [Prediction(universities[0].id, score, "target", score)], "test-model"


def test_simulator_changes_scores_without_persisting(db: Session) -> None:
    user = User(full_name="Simulator", email="simulator@example.com", password_hash="unused", role=UserRole.STUDENT)
    db.add(user); db.flush()
    saved = profile(user.id)
    candidate = university()
    db.add_all([saved, candidate]); db.commit()
    service = RecommendationService(db, predictor=ProfileAwarePredictor())
    before = service.simulate(user.id, SimulationRequest(gpa=3.0, gre_score=315, budget=25000, top_k=1))
    after = service.simulate(user.id, SimulationRequest(gpa=4.0, gre_score=315, budget=25000, top_k=1))
    db.refresh(saved)
    assert before.recommendations[0].ml_score != after.recommendations[0].ml_score
    assert saved.gpa == Decimal("3.5")


def test_simulator_requires_authentication(client: TestClient) -> None:
    assert client.post("/api/student/recommendations/simulate", json={"gpa": 3.5}).status_code == 401
