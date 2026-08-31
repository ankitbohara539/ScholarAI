from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from .recommender import HybridUniversityRecommender, StudentProfile

app = FastAPI(title="ScholarAI Hybrid Recommender", version="1.0.0")
engine: HybridUniversityRecommender | None = None


class RecommendationRequest(BaseModel):
    gre_score: float = Field(ge=260, le=340)
    toefl_score: float = Field(ge=0, le=120)
    sop: float = Field(ge=1, le=5)
    lor: float = Field(ge=1, le=5)
    gpa: float = Field(ge=0, le=4)
    research: int = Field(ge=0, le=1)
    desired_university_rating: int = Field(default=4, ge=1, le=5)
    preferred_regions: list[str] = Field(default_factory=list)
    preferred_countries: list[str] = Field(default_factory=list)
    strategy: str = "balanced"
    top_k: int = Field(default=10, ge=1, le=100)


def get_engine() -> HybridUniversityRecommender:
    global engine
    if engine is None:
        engine = HybridUniversityRecommender()
    return engine


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/recommend")
def recommend(request: RecommendationRequest) -> dict:
    try:
        profile = StudentProfile(
            gre_score=request.gre_score,
            toefl_score=request.toefl_score,
            sop=request.sop,
            lor=request.lor,
            gpa=request.gpa,
            research=request.research,
            desired_university_rating=request.desired_university_rating,
            preferred_regions=tuple(request.preferred_regions),
            preferred_countries=tuple(request.preferred_countries),
        )
        results = get_engine().recommend(profile, request.top_k, request.strategy)
        return {"count": len(results), "recommendations": results}
    except (ValueError, FileNotFoundError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
