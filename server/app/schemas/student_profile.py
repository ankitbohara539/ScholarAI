from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.student_profile import VerificationStatus


class AcademicProfileUpdate(BaseModel):
    gpa: Decimal = Field(ge=0, le=4, decimal_places=3)
    gre_score: int = Field(ge=260, le=340)
    toefl_score: int = Field(ge=0, le=120)
    sop_rating: Decimal = Field(ge=1, le=5, decimal_places=1)
    lor_rating: Decimal = Field(ge=1, le=5, decimal_places=1)
    has_research: bool
    academic_field: str = Field(min_length=2, max_length=120)
    academic_reputation_preference: int = Field(ge=1, le=5)

    model_config = ConfigDict(extra="forbid")


class PreferenceProfileUpdate(BaseModel):
    preferred_country: str = Field(min_length=2, max_length=120)
    preferred_region: str = Field(min_length=2, max_length=120)
    preferred_city: str | None = Field(default=None, max_length=120)
    preferred_degree_level: str = Field(min_length=2, max_length=80)
    max_tuition_budget: Decimal | None = Field(default=None, ge=0)
    budget_currency: str | None = Field(default=None, min_length=3, max_length=3)
    preferred_university_type: str | None = Field(default=None, max_length=80)

    model_config = ConfigDict(extra="forbid")

    @field_validator("budget_currency")
    @classmethod
    def normalize_currency(cls, value: str | None) -> str | None:
        return value.upper() if value else None


class StudentProfileResponse(BaseModel):
    id: int
    user_id: int
    gpa: Decimal | None
    gre_score: int | None
    toefl_score: int | None
    sop_rating: Decimal | None
    lor_rating: Decimal | None
    has_research: bool | None
    academic_field: str | None
    academic_reputation_preference: int | None
    preferred_country: str | None
    preferred_region: str | None
    preferred_city: str | None
    preferred_degree_level: str | None
    max_tuition_budget: Decimal | None
    budget_currency: str | None
    preferred_university_type: str | None
    profile_completion_percentage: int
    verification_status: VerificationStatus
    submitted_for_verification_at: datetime | None
    verified_at: datetime | None
    verified_by_admin_id: int | None
    rejection_reason: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
