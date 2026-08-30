import logging

from sqlalchemy.orm import Session

from app.core.exceptions import DuplicateEmailException, InvalidCredentialsException
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User, UserRole
from app.repositories.user_repository import UserRepository
from app.schemas.auth import AuthResponse, LoginRequest
from app.schemas.user import UserRegister

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self, db: Session) -> None:
        self.users = UserRepository(db)

    def register_student(self, data: UserRegister) -> User:
        email = str(data.email).lower()
        if self.users.get_by_email(email) is not None:
            raise DuplicateEmailException()
        return self.users.create(
            full_name=data.full_name,
            email=email,
            password_hash=hash_password(data.password),
            role=UserRole.STUDENT,
        )

    def login(self, data: LoginRequest) -> AuthResponse:
        email = str(data.email).lower()
        user = self.users.get_by_email(email)
        if user is None or not user.is_active or not verify_password(data.password, user.password_hash):
            logger.warning("Authentication failed for email=%s", email)
            raise InvalidCredentialsException()

        token = create_access_token(user.id, user.role)
        return AuthResponse(access_token=token, user=user)
