from datetime import datetime
from decimal import Decimal
from enum import Enum

from sqlalchemy import Boolean, DateTime, Enum as SAEnum, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class VerificationStatus(str, Enum):
    DRAFT = "draft"
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False, index=True)
    gpa: Mapped[Decimal | None] = mapped_column(Numeric(4, 3), nullable=True)
    gre_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    toefl_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    sop_rating: Mapped[Decimal | None] = mapped_column(Numeric(2, 1), nullable=True)
    lor_rating: Mapped[Decimal | None] = mapped_column(Numeric(2, 1), nullable=True)
    has_research: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    academic_field: Mapped[str | None] = mapped_column(String(120), nullable=True)
    academic_reputation_preference: Mapped[int | None] = mapped_column(Integer, nullable=True)
    preferred_country: Mapped[str | None] = mapped_column(String(120), nullable=True)
    preferred_region: Mapped[str | None] = mapped_column(String(120), nullable=True)
    preferred_city: Mapped[str | None] = mapped_column(String(120), nullable=True)
    preferred_degree_level: Mapped[str | None] = mapped_column(String(80), nullable=True)
    max_tuition_budget: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    preferred_university_type: Mapped[str | None] = mapped_column(String(80), nullable=True)
    profile_completion_percentage: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    verification_status: Mapped[VerificationStatus] = mapped_column(
        SAEnum(VerificationStatus, name="verification_status", values_callable=lambda enum: [item.value for item in enum]),
        default=VerificationStatus.DRAFT,
        nullable=False,
        index=True,
    )
    submitted_for_verification_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    verified_by_admin_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
