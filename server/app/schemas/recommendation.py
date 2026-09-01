from datetime import datetime

from pydantic import BaseModel

from app.schemas.university import UniversityResponse


class RecommendationItem(BaseModel):
    university: UniversityResponse
    score: float
    rank: int
    category: str


class RecommendationList(BaseModel):
    generation_id: str | None
    model_version: str | None
    generated_at: datetime | None
    recommendations: list[RecommendationItem]
