from collections.abc import Callable, Generator
from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenException, InvalidTokenException
from app.core.security import decode_access_token
from app.db.database import get_db
from app.models.user import User, UserRole
from app.repositories.user_repository import UserRepository

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise InvalidTokenException("Authentication required")

    payload = decode_access_token(credentials.credentials)
    try:
        user_id = int(payload["sub"])
        token_role = UserRole(payload["role"])
    except (KeyError, TypeError, ValueError) as exc:
        raise InvalidTokenException() from exc

    user = UserRepository(db).get_by_id(user_id)
    if user is None or not user.is_active or user.role != token_role:
        raise InvalidTokenException()
    return user


def require_roles(*allowed_roles: UserRole) -> Callable[..., User]:
    def role_dependency(
        current_user: Annotated[User, Depends(get_current_user)],
    ) -> User:
        if current_user.role not in allowed_roles:
            raise ForbiddenException()
        return current_user

    return role_dependency


CurrentUser = Annotated[User, Depends(get_current_user)]
