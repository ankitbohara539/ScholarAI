from collections.abc import Sequence

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from app.models.student_profile import StudentProfile, VerificationStatus
from app.models.user import User


class StudentProfileRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_user_id(self, user_id: int) -> StudentProfile | None:
        return self.db.scalar(select(StudentProfile).where(StudentProfile.user_id == user_id))

    def get_or_create(self, user_id: int) -> StudentProfile:
        profile = self.get_by_user_id(user_id)
        if profile is None:
            profile = StudentProfile(user_id=user_id)
            self.db.add(profile)
            self.db.flush()
        return profile

    def update(self, profile: StudentProfile, values: dict[str, object]) -> StudentProfile:
        for field, value in values.items():
            setattr(profile, field, value)
        self.db.flush()
        return profile

    def count_by_status(self, status: VerificationStatus) -> int:
        return self.db.scalar(
            select(func.count(StudentProfile.id))
            .join(User, User.id == StudentProfile.user_id)
            .where(StudentProfile.verification_status == status, User.deleted_at.is_(None))
        ) or 0

    def filter_user_ids_by_status(self, status: VerificationStatus) -> Select[tuple[int]]:
        return select(StudentProfile.user_id).where(StudentProfile.verification_status == status)
