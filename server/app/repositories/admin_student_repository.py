from collections.abc import Sequence

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.student_profile import StudentProfile, VerificationStatus
from app.models.user import User, UserRole


class AdminStudentRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(
        self,
        *,
        page: int,
        page_size: int,
        search: str | None,
        verification_status: VerificationStatus | None,
        account_status: str | None,
    ) -> tuple[Sequence[tuple[User, StudentProfile | None]], int]:
        statement = (
            select(User, StudentProfile)
            .outerjoin(StudentProfile, StudentProfile.user_id == User.id)
            .where(User.role == UserRole.STUDENT, User.deleted_at.is_(None))
        )
        if search:
            value = f"%{search.strip()}%"
            statement = statement.where(or_(User.full_name.ilike(value), User.email.ilike(value)))
        if verification_status:
            if verification_status == VerificationStatus.DRAFT:
                statement = statement.where(
                    or_(StudentProfile.verification_status == verification_status, StudentProfile.id.is_(None))
                )
            else:
                statement = statement.where(StudentProfile.verification_status == verification_status)
        if account_status == "active":
            statement = statement.where(User.is_active.is_(True))
        elif account_status == "suspended":
            statement = statement.where(User.is_active.is_(False))
        total = self.db.scalar(select(func.count()).select_from(statement.order_by(None).subquery())) or 0
        rows = self.db.execute(statement.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)).all()
        return rows, total

    def get(self, student_id: int) -> tuple[User, StudentProfile | None] | None:
        return self.db.execute(
            select(User, StudentProfile)
            .outerjoin(StudentProfile, StudentProfile.user_id == User.id)
            .where(User.id == student_id, User.role == UserRole.STUDENT, User.deleted_at.is_(None))
        ).first()
