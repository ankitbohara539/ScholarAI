from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Integer, JSON, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.scholarship import Scholarship


class University(Base):
    __tablename__ = "universities"
    __table_args__ = (UniqueConstraint("name", "country", name="uq_university_name_country"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    country: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    region: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    city: Mapped[str | None] = mapped_column(String(120), nullable=True)
    website_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    ranking: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    academic_reputation_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    minimum_gpa: Mapped[Decimal | None] = mapped_column(Numeric(4, 3), nullable=True)
    minimum_gre_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tuition_fee: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    estimated_living_cost: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    application_fee: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    currency: Mapped[str | None] = mapped_column(String(3), nullable=True)
    acceptance_rate: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    programs: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    university_type: Mapped[str | None] = mapped_column(String(80), nullable=True, index=True)
    degree_levels: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    scholarships: Mapped[list["Scholarship"]] = relationship(
        back_populates="university", cascade="all, delete-orphan", lazy="selectin"
    )
