import logging
import math
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.exceptions import BusinessRuleException, NotFoundException
from app.models.notification import Notification, NotificationType
from app.models.student_profile import StudentProfile, VerificationStatus
from app.models.user import User
from app.repositories.admin_student_repository import AdminStudentRepository
from app.repositories.notification_repository import NotificationRepository
from app.repositories.user_repository import UserRepository
from app.schemas.admin_student import AdminStudentDetail, AdminStudentPage, AdminStudentSummary
from app.schemas.student_profile import StudentProfileResponse

logger = logging.getLogger(__name__)


class AdminStudentService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.admin_students = AdminStudentRepository(db)
        self.users = UserRepository(db)
        self.notifications = NotificationRepository(db)

    @staticmethod
    def _summary(user: User, profile: StudentProfile | None) -> AdminStudentSummary:
        return AdminStudentSummary(
            id=user.id,
            full_name=user.full_name,
            email=user.email,
            profile_completion_percentage=profile.profile_completion_percentage if profile else 0,
            verification_status=profile.verification_status if profile else VerificationStatus.DRAFT,
            account_status="active" if user.is_active else "suspended",
            created_at=user.created_at,
        )

    def list(self, *, page: int, page_size: int, search: str | None, verification_status: VerificationStatus | None, account_status: str | None) -> AdminStudentPage:
        rows, total = self.admin_students.list(page=page, page_size=page_size, search=search, verification_status=verification_status, account_status=account_status)
        return AdminStudentPage(
            items=[self._summary(user, profile) for user, profile in rows],
            page=page,
            page_size=page_size,
            total=total,
            pages=math.ceil(total / page_size) if total else 0,
        )

    def get(self, student_id: int) -> tuple[User, StudentProfile | None]:
        row = self.admin_students.get(student_id)
        if row is None:
            raise NotFoundException("Student not found")
        return row

    def detail(self, student_id: int) -> AdminStudentDetail:
        user, profile = self.get(student_id)
        return AdminStudentDetail(
            id=user.id,
            full_name=user.full_name,
            email=user.email,
            account_status="active" if user.is_active else "suspended",
            created_at=user.created_at,
            profile=StudentProfileResponse.model_validate(profile) if profile else None,
        )

    def verify(self, student_id: int, admin_id: int) -> Notification:
        user, profile = self.get(student_id)
        if profile is None or profile.verification_status != VerificationStatus.PENDING:
            raise BusinessRuleException("Only pending profiles can be verified")
        now = datetime.now(timezone.utc)
        profile.verification_status = VerificationStatus.VERIFIED
        profile.verified_at = now
        profile.verified_by_admin_id = admin_id
        profile.rejection_reason = None
        notification = self.notifications.create(
            user_id=user.id,
            type=NotificationType.PROFILE_VERIFIED,
            title="Profile Verified",
            message="Your student profile has been verified by an administrator.",
        )
        self.db.commit()
        self.db.refresh(notification)
        logger.info("Student profile verified student_id=%s admin_id=%s", student_id, admin_id)
        return notification

    def reject(self, student_id: int, admin_id: int, reason: str) -> Notification:
        user, profile = self.get(student_id)
        if profile is None or profile.verification_status != VerificationStatus.PENDING:
            raise BusinessRuleException("Only pending profiles can be rejected")
        profile.verification_status = VerificationStatus.REJECTED
        profile.verified_at = None
        profile.verified_by_admin_id = admin_id
        profile.rejection_reason = reason.strip()
        notification = self.notifications.create(
            user_id=user.id,
            type=NotificationType.PROFILE_REJECTED,
            title="Profile Needs Changes",
            message="Your profile was rejected. Review the administrator feedback and resubmit.",
        )
        self.db.commit()
        self.db.refresh(notification)
        logger.info("Student profile rejected student_id=%s admin_id=%s", student_id, admin_id)
        return notification

    def set_suspended(self, student_id: int, suspended: bool) -> Notification:
        user, _ = self.get(student_id)
        if user.is_active == (not suspended):
            raise BusinessRuleException("Account is already in the requested state")
        self.users.set_active(user, not suspended)
        notification = self.notifications.create(
            user_id=user.id,
            type=NotificationType.ACCOUNT_SUSPENDED if suspended else NotificationType.ACCOUNT_REACTIVATED,
            title="Account Suspended" if suspended else "Account Reactivated",
            message="Your ScholarAI account has been suspended." if suspended else "Your ScholarAI account has been reactivated.",
        )
        self.db.commit()
        self.db.refresh(notification)
        return notification

    def soft_delete(self, student_id: int) -> None:
        user, _ = self.get(student_id)
        self.users.soft_delete(user)
        self.db.commit()
