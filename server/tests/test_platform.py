from datetime import timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session
from starlette.websockets import WebSocketDisconnect

from app.core.security import create_access_token, hash_password
from app.ml.exceptions import ArtifactValidationError
from app.ml.predictor import Prediction, RecommendationPredictor
from app.ml.preprocessing import prepare_candidates
from app.models.notification import Notification
from app.models.student_profile import StudentProfile, VerificationStatus
from app.models.university import University
from app.models.user import User, UserRole
from app.repositories.user_repository import UserRepository
from ml_engine.config import FEATURE_COLUMNS

STUDENT = {"full_name": "Platform Student", "email": "platform.student@example.com", "password": "StrongPass123!"}
ACADEMIC = {
    "gpa": 3.7,
    "gre_score": 325,
    "toefl_score": 110,
    "sop_rating": 4.0,
    "lor_rating": 4.5,
    "has_research": True,
    "academic_field": "Computer Science",
    "academic_reputation_preference": 4,
}
PREFERENCES = {
    "preferred_country": "United States",
    "preferred_region": "Americas",
    "preferred_city": None,
    "preferred_degree_level": "Masters",
    "max_tuition_budget": 50000,
    "preferred_university_type": "Private",
}
UNIVERSITY = {
    "name": "Test Institute of Technology",
    "country": "United States",
    "region": "Americas",
    "ranking": 25,
    "academic_reputation_score": 95.5,
    "minimum_gpa": 3.0,
    "minimum_gre_score": 300,
    "tuition_fee": 42000,
    "university_type": "Private",
    "degree_levels": ["Masters"],
}


def auth_header(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def create_student(client: TestClient) -> tuple[dict, dict[str, str]]:
    response = client.post("/api/auth/register", json=STUDENT)
    assert response.status_code == 201
    login = client.post("/api/auth/login", json={"email": STUDENT["email"], "password": STUDENT["password"]}).json()
    return response.json(), auth_header(login["access_token"])


def create_admin(db: Session) -> tuple[User, dict[str, str]]:
    admin = UserRepository(db).create(
        full_name="Platform Admin",
        email="platform.admin@example.com",
        password_hash=hash_password("AdminPass123!"),
        role=UserRole.ADMIN,
    )
    return admin, auth_header(create_access_token(admin.id, admin.role))


def complete_profile(client: TestClient, headers: dict[str, str]) -> dict:
    assert client.patch("/api/student/profile/academic", json=ACADEMIC, headers=headers).status_code == 200
    response = client.patch("/api/student/profile/preferences", json=PREFERENCES, headers=headers)
    assert response.status_code == 200
    return response.json()


def submit_profile(client: TestClient, headers: dict[str, str]) -> dict:
    complete_profile(client, headers)
    response = client.post("/api/student/profile/submit-verification", headers=headers)
    assert response.status_code == 200
    return response.json()


def test_progressive_profile_save_resume_and_submission_rules(client: TestClient) -> None:
    _, headers = create_student(client)
    academic = client.patch("/api/student/profile/academic", json=ACADEMIC, headers=headers)
    assert academic.status_code == 200
    assert 0 < academic.json()["profile_completion_percentage"] < 100
    assert client.post("/api/student/profile/submit-verification", headers=headers).status_code == 400

    profile = complete_profile(client, headers)
    assert profile["profile_completion_percentage"] == 100
    resumed = client.get("/api/student/profile", headers=headers).json()
    assert resumed["academic_field"] == ACADEMIC["academic_field"]
    submitted = client.post("/api/student/profile/submit-verification", headers=headers)
    assert submitted.status_code == 200
    assert submitted.json()["verification_status"] == "pending"
    assert client.patch("/api/student/profile/academic", json=ACADEMIC, headers=headers).status_code == 400


def test_admin_verification_rejection_and_student_rbac(client: TestClient, db: Session) -> None:
    student, student_headers = create_student(client)
    submit_profile(client, student_headers)
    admin, admin_headers = create_admin(db)

    assert client.post(f"/api/admin/students/{student['id']}/verify", headers=student_headers).status_code == 403
    verified = client.post(f"/api/admin/students/{student['id']}/verify", headers=admin_headers)
    assert verified.status_code == 200
    assert verified.json()["type"] == "profile_verified"
    notification = db.scalar(select(Notification).where(Notification.user_id == student["id"]))
    assert notification is not None

    other_payload = {**STUDENT, "email": "rejected@example.com"}
    other = client.post("/api/auth/register", json=other_payload).json()
    other_login = client.post("/api/auth/login", json={"email": other_payload["email"], "password": other_payload["password"]}).json()
    other_headers = auth_header(other_login["access_token"])
    submit_profile(client, other_headers)
    rejected = client.post(f"/api/admin/students/{other['id']}/reject", json={"reason": "Please correct the academic evidence."}, headers=admin_headers)
    assert rejected.status_code == 200
    detail = client.get(f"/api/admin/students/{other['id']}", headers=admin_headers).json()
    assert detail["profile"]["verification_status"] == "rejected"
    assert detail["profile"]["rejection_reason"]


def test_suspend_reactivate_soft_delete_and_login(client: TestClient, db: Session) -> None:
    student, student_headers = create_student(client)
    _, admin_headers = create_admin(db)
    assert client.post(f"/api/admin/students/{student['id']}/suspend", headers=admin_headers).status_code == 200
    assert client.get("/api/student/profile", headers=student_headers).status_code == 401
    assert client.post("/api/auth/login", json={"email": STUDENT["email"], "password": STUDENT["password"]}).status_code == 401
    assert client.post(f"/api/admin/students/{student['id']}/reactivate", headers=admin_headers).status_code == 200
    assert client.post("/api/auth/login", json={"email": STUDENT["email"], "password": STUDENT["password"]}).status_code == 200
    assert client.delete(f"/api/admin/students/{student['id']}", headers=admin_headers).status_code == 204
    assert db.get(User, student["id"]) is not None
    assert db.get(User, student["id"]).deleted_at is not None
    assert client.post("/api/auth/login", json={"email": STUDENT["email"], "password": STUDENT["password"]}).status_code == 401


def test_university_admin_crud_and_student_visibility(client: TestClient, db: Session) -> None:
    _, student_headers = create_student(client)
    _, admin_headers = create_admin(db)
    assert client.post("/api/admin/universities", json=UNIVERSITY, headers=student_headers).status_code == 403
    created = client.post("/api/admin/universities", json=UNIVERSITY, headers=admin_headers)
    assert created.status_code == 201
    university_id = created.json()["id"]
    visible = client.get("/api/universities", headers=student_headers).json()
    assert visible["total"] == 1
    updated = client.patch(f"/api/admin/universities/{university_id}", json={"ranking": 20}, headers=admin_headers)
    assert updated.status_code == 200 and updated.json()["ranking"] == 20
    assert client.patch(f"/api/admin/universities/{university_id}", json={"is_active": False}, headers=admin_headers).status_code == 200
    assert client.get("/api/universities", headers=student_headers).json()["total"] == 0
    assert client.patch(f"/api/admin/universities/{university_id}", json={"is_active": True}, headers=admin_headers).status_code == 200
    assert client.delete(f"/api/admin/universities/{university_id}", headers=admin_headers).status_code == 204
    assert db.get(University, university_id).deleted_at is not None
    assert client.get("/api/universities", headers=student_headers).json()["total"] == 0


def test_recommendation_eligibility_generation_and_model_failure(client: TestClient, db: Session, monkeypatch: pytest.MonkeyPatch) -> None:
    student, student_headers = create_student(client)
    _, admin_headers = create_admin(db)
    created = client.post("/api/admin/universities", json=UNIVERSITY, headers=admin_headers).json()
    assert client.post("/api/student/recommendations/generate", headers=student_headers).status_code == 400
    submit_profile(client, student_headers)
    assert client.post(f"/api/admin/students/{student['id']}/verify", headers=admin_headers).status_code == 200

    def fake_predict(self: RecommendationPredictor, profile: StudentProfile, universities: list[University], top_k: int):
        return [Prediction(universities[0].id, 0.91, "safety")], "test-model"

    monkeypatch.setattr(RecommendationPredictor, "predict", fake_predict)
    generated = client.post("/api/student/recommendations/generate?top_k=5", headers=student_headers)
    assert generated.status_code == 200
    assert generated.json()["recommendations"][0]["university"]["id"] == created["id"]
    assert client.get("/api/student/recommendations", headers=student_headers).json()["recommendations"]

    def failed_predict(self: RecommendationPredictor, profile: StudentProfile, universities: list[University], top_k: int):
        raise ArtifactValidationError("broken")

    monkeypatch.setattr(RecommendationPredictor, "predict", failed_predict)
    assert client.post("/api/student/recommendations/generate", headers=student_headers).status_code == 503


def test_preprocessing_enforces_exact_feature_schema(db: Session) -> None:
    profile = StudentProfile(user_id=1, **ACADEMIC, **PREFERENCES, profile_completion_percentage=100)
    university = University(**UNIVERSITY)
    university.id = 1
    prepared = prepare_candidates(profile, [university])
    assert prepared.raw_features.shape == (1, len(FEATURE_COLUMNS))
    profile.toefl_score = None
    with pytest.raises(ArtifactValidationError):
        prepare_candidates(profile, [university])


def test_notification_ownership_and_mark_read(client: TestClient, db: Session) -> None:
    student, student_headers = create_student(client)
    _, admin_headers = create_admin(db)
    submit_profile(client, student_headers)
    client.post(f"/api/admin/students/{student['id']}/verify", headers=admin_headers)
    page = client.get("/api/notifications", headers=student_headers).json()
    assert page["unread_count"] == 1
    notification_id = page["items"][0]["id"]

    other_payload = {**STUDENT, "email": "notification.other@example.com"}
    client.post("/api/auth/register", json=other_payload)
    other_token = client.post("/api/auth/login", json={"email": other_payload["email"], "password": other_payload["password"]}).json()["access_token"]
    assert client.patch(f"/api/notifications/{notification_id}/read", headers=auth_header(other_token)).status_code == 404
    marked = client.patch(f"/api/notifications/{notification_id}/read", headers=student_headers)
    assert marked.status_code == 200 and marked.json()["is_read"] is True


def test_websocket_authentication_and_delivery(client: TestClient, db: Session) -> None:
    student, student_headers = create_student(client)
    submit_profile(client, student_headers)
    admin, admin_headers = create_admin(db)
    student_token = student_headers["Authorization"].removeprefix("Bearer ")

    with client.websocket_connect("/ws/notifications") as websocket:
        websocket.send_json({"token": student_token})
        assert websocket.receive_json()["event"] == "connected"
        response = client.post(f"/api/admin/students/{student['id']}/verify", headers=admin_headers)
        assert response.status_code == 200
        event = websocket.receive_json()
        assert event["event"] == "notification"
        assert event["notification"]["type"] == "profile_verified"

    with pytest.raises(WebSocketDisconnect) as rejected:
        with client.websocket_connect("/ws/notifications") as websocket:
            websocket.send_json({"token": "invalid"})
            websocket.receive_json()
    assert rejected.value.code == 4401
