from datetime import datetime, timezone
from collections.abc import Sequence

from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import DuplicateEmailException
from app.models.user import User, UserRole


class UserRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, user_id: int) -> User | None:
        return self.db.scalar(select(User).where(User.id == user_id, User.deleted_at.is_(None)))

    def get_by_email(self, email: str) -> User | None:
        statement = select(User).where(User.email == email.lower().strip(), User.deleted_at.is_(None))
        return self.db.scalar(statement)

    def get_student(self, user_id: int, *, include_deleted: bool = False) -> User | None:
        statement = select(User).where(User.id == user_id, User.role == UserRole.STUDENT)
        if not include_deleted:
            statement = statement.where(User.deleted_at.is_(None))
        return self.db.scalar(statement)

    def list_students(
        self,
        *,
        page: int,
        page_size: int,
        search: str | None = None,
        is_active: bool | None = None,
    ) -> tuple[Sequence[User], int]:
        statement = select(User).where(User.role == UserRole.STUDENT, User.deleted_at.is_(None))
        if search:
            value = f"%{search.strip()}%"
            statement = statement.where(or_(User.full_name.ilike(value), User.email.ilike(value)))
        if is_active is not None:
            statement = statement.where(User.is_active.is_(is_active))
        total = self.db.scalar(select(func.count()).select_from(statement.order_by(None).subquery())) or 0
        items = self.db.scalars(statement.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)).all()
        return items, total

    def set_active(self, user: User, active: bool) -> None:
        user.is_active = active
        self.db.flush()

    def soft_delete(self, user: User) -> None:
        user.is_active = False
        user.deleted_at = datetime.now(timezone.utc)
        self.db.flush()

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
        return self.db.scalar(select(func.count(User.id)).where(User.role == role, User.deleted_at.is_(None))) or 0

    def count_active(self) -> int:
        return self.db.scalar(select(func.count(User.id)).where(User.is_active.is_(True), User.deleted_at.is_(None))) or 0

    def count_students_by_active(self, active: bool) -> int:
        return self.db.scalar(
            select(func.count(User.id)).where(
                User.role == UserRole.STUDENT,
                User.is_active.is_(active),
                User.deleted_at.is_(None),
            )
        ) or 0
