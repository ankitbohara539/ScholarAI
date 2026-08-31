from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import require_roles
from app.db.database import get_db
from app.models.user import User, UserRole
from app.repositories.user_repository import UserRepository
from app.repositories.student_profile_repository import StudentProfileRepository
from app.repositories.university_repository import UniversityRepository
from app.models.student_profile import VerificationStatus
from app.schemas.dashboard import AdminDashboardStats

router = APIRouter(prefix="/admin", tags=["admin"])


def _stats(db: Session) -> AdminDashboardStats:
    users = UserRepository(db)
    profiles = StudentProfileRepository(db)
    universities = UniversityRepository(db)
    return AdminDashboardStats(
        total_students=users.count_by_role(UserRole.STUDENT),
        active_users=users.count_active(),
        pending_verification=profiles.count_by_status(VerificationStatus.PENDING),
        verified_students=profiles.count_by_status(VerificationStatus.VERIFIED),
        suspended_students=users.count_students_by_active(False),
        total_universities=universities.count(),
        active_universities=universities.count(active=True),
    )


@router.get("/dashboard", response_model=AdminDashboardStats)
def admin_dashboard(
    _: Annotated[User, Depends(require_roles(UserRole.ADMIN))],
    db: Annotated[Session, Depends(get_db)],
) -> AdminDashboardStats:
    return _stats(db)


@router.get("/dashboard/stats", response_model=AdminDashboardStats)
def admin_dashboard_stats(
    _: Annotated[User, Depends(require_roles(UserRole.ADMIN))],
    db: Annotated[Session, Depends(get_db)],
) -> AdminDashboardStats:
    return _stats(db)
