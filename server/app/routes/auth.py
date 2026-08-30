from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import CurrentUser
from app.db.database import get_db
from app.schemas.auth import AuthResponse, LoginRequest
from app.schemas.user import UserRegister, UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(data: UserRegister, db: Annotated[Session, Depends(get_db)]) -> UserResponse:
    return UserResponse.model_validate(AuthService(db).register_student(data))


@router.post("/login", response_model=AuthResponse)
def login(data: LoginRequest, db: Annotated[Session, Depends(get_db)]) -> AuthResponse:
    return AuthService(db).login(data)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: CurrentUser) -> UserResponse:
    return UserResponse.model_validate(current_user)
