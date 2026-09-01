from pydantic import BaseModel

from app.models.student_profile import VerificationStatus


class AdminDashboardStats(BaseModel):
    total_students: int
    active_users: int
    pending_verification: int
    verified_students: int
    suspended_students: int
    total_universities: int
    active_universities: int


class StudentDashboardStats(BaseModel):
    profile_completion_percentage: int
    verification_status: VerificationStatus
    recommendations_available: int
    unread_notifications: int
