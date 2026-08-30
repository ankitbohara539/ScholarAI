from datetime import timedelta

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password
from app.models.user import UserRole
from app.repositories.user_repository import UserRepository

STUDENT = {
    "full_name": "Test Student",
    "email": "student@example.com",
    "password": "StrongPass123!",
}


def register(client: TestClient) -> dict[str, object]:
    response = client.post("/api/auth/register", json=STUDENT)
    assert response.status_code == 201
    return response.json()


def login(client: TestClient, password: str = STUDENT["password"]) -> dict[str, object]:
    response = client.post(
        "/api/auth/login",
        json={"email": STUDENT["email"], "password": password},
    )
    assert response.status_code == 200
    return response.json()


def bearer(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_student_registration_succeeds_and_cannot_choose_admin(client: TestClient) -> None:
    user = register(client)
    assert user["role"] == "student"
    assert "password" not in user
    assert "password_hash" not in user

    attempted_admin = {**STUDENT, "email": "other@example.com", "role": "admin"}
    assert client.post("/api/auth/register", json=attempted_admin).status_code == 422


def test_duplicate_email_fails(client: TestClient) -> None:
    register(client)
    assert client.post("/api/auth/register", json=STUDENT).status_code == 409


def test_password_is_hashed(client: TestClient, db: Session) -> None:
    register(client)
    user = UserRepository(db).get_by_email(STUDENT["email"])
    assert user is not None
    assert user.password_hash != STUDENT["password"]
    assert STUDENT["password"] not in user.password_hash


def test_valid_login_and_me(client: TestClient) -> None:
    register(client)
    auth = login(client)
    response = client.get("/api/auth/me", headers=bearer(str(auth["access_token"])))
    assert response.status_code == 200
    assert response.json()["email"] == STUDENT["email"]


def test_invalid_password_fails(client: TestClient) -> None:
    register(client)
    response = client.post(
        "/api/auth/login",
        json={"email": STUDENT["email"], "password": "incorrect-password"},
    )
    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid email or password"}


def test_me_requires_authentication(client: TestClient) -> None:
    assert client.get("/api/auth/me").status_code == 401


def test_student_rbac(client: TestClient) -> None:
    register(client)
    auth = login(client)
    headers = bearer(str(auth["access_token"]))
    assert client.get("/api/student/dashboard", headers=headers).status_code == 200
    assert client.get("/api/admin/dashboard", headers=headers).status_code == 403


def test_admin_can_access_admin_dashboard(client: TestClient, db: Session) -> None:
    admin = UserRepository(db).create(
        full_name="System Admin",
        email="admin@example.com",
        password_hash=hash_password("AdminPass123!"),
        role=UserRole.ADMIN,
    )
    token = create_access_token(admin.id, admin.role)
    response = client.get("/api/admin/dashboard", headers=bearer(token))
    assert response.status_code == 200
    assert response.json()["active_users"] == 1


def test_invalid_and_expired_jwts_are_rejected(client: TestClient, db: Session) -> None:
    assert client.get("/api/auth/me", headers=bearer("not-a-jwt")).status_code == 401

    user = UserRepository(db).create(
        full_name="Expired User",
        email="expired@example.com",
        password_hash=hash_password("StrongPass123!"),
    )
    expired = create_access_token(user.id, user.role, expires_delta=timedelta(seconds=-1))
    assert client.get("/api/auth/me", headers=bearer(expired)).status_code == 401
