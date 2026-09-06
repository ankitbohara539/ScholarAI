from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.dependencies import require_roles
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User, UserRole
from app.schemas.student_profile import AcademicProfileUpdate, PreferenceProfileUpdate, StudentProfileResponse
from app.services.student_profile_service import StudentProfileService
from app.models.student_profile import VerificationStatus
from app.repositories.notification_repository import NotificationRepository
from app.repositories.recommendation_repository import RecommendationRepository
from app.repositories.student_profile_repository import StudentProfileRepository
from app.schemas.dashboard import StudentDashboardStats
from app.schemas.notification import NotificationResponse
from app.websocket.manager import connection_manager

router = APIRouter(prefix="/student", tags=["student"])
StudentUser = Annotated[User, Depends(require_roles(UserRole.STUDENT))]


@router.get("/dashboard", response_model=StudentDashboardStats)
def student_dashboard(
    current_user: StudentUser,
    db: Annotated[Session, Depends(get_db)],
) -> StudentDashboardStats:
    profile = StudentProfileRepository(db).get_by_user_id(current_user.id)
    return StudentDashboardStats(
        profile_completion_percentage=profile.profile_completion_percentage if profile else 0,
        verification_status=profile.verification_status if profile else VerificationStatus.DRAFT,
        recommendations_available=RecommendationRepository(db).latest_count(current_user.id),
        unread_notifications=NotificationRepository(db).unread_count(current_user.id),
    )


@router.get("/profile", response_model=StudentProfileResponse)
def get_profile(current_user: StudentUser, db: Annotated[Session, Depends(get_db)]) -> StudentProfileResponse:
    return StudentProfileResponse.model_validate(StudentProfileService(db).get(current_user.id))


@router.patch("/profile/academic", response_model=StudentProfileResponse)
def save_academic(
    data: AcademicProfileUpdate,
    current_user: StudentUser,
    db: Annotated[Session, Depends(get_db)],
) -> StudentProfileResponse:
    return StudentProfileResponse.model_validate(StudentProfileService(db).save_academic(current_user.id, data))


@router.patch("/profile/preferences", response_model=StudentProfileResponse)
def save_preferences(
    data: PreferenceProfileUpdate,
    current_user: StudentUser,
    db: Annotated[Session, Depends(get_db)],
) -> StudentProfileResponse:
    return StudentProfileResponse.model_validate(StudentProfileService(db).save_preferences(current_user.id, data))


@router.post("/profile/submit-verification", response_model=StudentProfileResponse)
async def submit_profile(current_user: StudentUser, db: Annotated[Session, Depends(get_db)]) -> StudentProfileResponse:
    profile, notifications = StudentProfileService(db).submit(current_user.id)
    for notification in notifications:
        response = NotificationResponse.model_validate(notification)
        await connection_manager.send_to_user(
            notification.user_id,
            {"event": "notification", "notification": response.model_dump(mode="json")},
        )
    return StudentProfileResponse.model_validate(profile)
