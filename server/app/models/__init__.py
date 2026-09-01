from app.models.notification import Notification, NotificationType
from app.models.recommendation import Recommendation
from app.models.student_profile import StudentProfile, VerificationStatus
from app.models.university import University
from app.models.user import User, UserRole

__all__ = [
    "Notification",
    "NotificationType",
    "Recommendation",
    "StudentProfile",
    "University",
    "User",
    "UserRole",
    "VerificationStatus",
]
