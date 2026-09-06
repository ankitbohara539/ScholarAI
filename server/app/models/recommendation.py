from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Recommendation(Base):
    __tablename__ = "recommendations"
    __table_args__ = (UniqueConstraint("generation_id", "rank", name="uq_recommendation_generation_rank"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    university_id: Mapped[int] = mapped_column(ForeignKey("universities.id"), nullable=False, index=True)
    generation_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    score: Mapped[Decimal] = mapped_column(Numeric(7, 6), nullable=False)
    ml_score: Mapped[Decimal | None] = mapped_column(Numeric(7, 6), nullable=True)
    rank: Mapped[int] = mapped_column(Integer, nullable=False)
    category: Mapped[str] = mapped_column(String(20), nullable=False)
    model_version: Mapped[str | None] = mapped_column(String(80), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
