from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.models.student_profile import VerificationStatus
from app.schemas.student_profile import StudentProfileResponse


class AdminStudentSummary(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    profile_completion_percentage: int
    verification_status: VerificationStatus
    account_status: str
    created_at: datetime


class AdminStudentPage(BaseModel):
    items: list[AdminStudentSummary]
    page: int
    page_size: int
    total: int
    pages: int


class AdminStudentDetail(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    account_status: str
    created_at: datetime
    profile: StudentProfileResponse | None


class RejectionRequest(BaseModel):
    reason: str = Field(min_length=5, max_length=1000)
