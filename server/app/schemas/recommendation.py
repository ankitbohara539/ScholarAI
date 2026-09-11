from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.schemas.university import UniversityResponse


class MatchCriterionResponse(BaseModel):
    status: Literal["available", "unknown", "not_applicable"]
    score: float | None
    weight: float
    reason: str


class MatchResultResponse(BaseModel):
    match_score: float | None
    coverage: float
    available_criteria: int
    total_criteria: int
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
    budget_currency: str | None = Field(default=None, min_length=3, max_length=3)
    top_k: int = Field(default=10, ge=1, le=25)

    model_config = {"extra": "forbid"}

    @field_validator("budget_currency")
    @classmethod
    def normalize_currency(cls, value: str | None) -> str | None:
        return value.upper() if value else None
