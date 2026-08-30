from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import DuplicateEmailException
from app.models.user import User, UserRole


class UserRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, user_id: int) -> User | None:
        return self.db.get(User, user_id)

    def get_by_email(self, email: str) -> User | None:
        statement = select(User).where(User.email == email.lower().strip())
        return self.db.scalar(statement)

    def create(
        self,
        *,
        full_name: str,
        email: str,
        password_hash: str,
        role: UserRole = UserRole.STUDENT,
    ) -> User:
        user = User(
            full_name=full_name,
            email=email.lower().strip(),
            password_hash=password_hash,
            role=role,
        )
        self.db.add(user)
        try:
            self.db.commit()
        except IntegrityError as exc:
            self.db.rollback()
            raise DuplicateEmailException() from exc
        self.db.refresh(user)
        return user

    def count_by_role(self, role: UserRole) -> int:
        return self.db.scalar(select(func.count(User.id)).where(User.role == role)) or 0

    def count_active(self) -> int:
        return self.db.scalar(select(func.count(User.id)).where(User.is_active.is_(True))) or 0
