from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.university import UniversityResponse


class MatchCriterionResponse(BaseModel):
    score: float
    weight: float
    reason: str


class MatchResultResponse(BaseModel):
    match_score: float
    breakdown: dict[str, MatchCriterionResponse]


class CostEstimateResponse(BaseModel):
    tuition: float | None
    living_cost: float | None
    application_fee: float | None
    potential_aid: float | None
    estimated_total: float | None
    currency: str | None
    missing_fields: list[str]


class RecommendationItem(BaseModel):
    university: UniversityResponse
    score: float
    ml_score: float
    match: MatchResultResponse
    cost: CostEstimateResponse
    rank: int
    category: str


class RecommendationList(BaseModel):
    generation_id: str | None
    model_version: str | None
    generated_at: datetime | None
    recommendations: list[RecommendationItem]


class SimulationRequest(BaseModel):
    gpa: float | None = Field(default=None, ge=0, le=4)
    gre_score: int | None = Field(default=None, ge=260, le=340)
    budget: float | None = Field(default=None, ge=0)
    top_k: int = Field(default=10, ge=1, le=25)

    model_config = {"extra": "forbid"}
