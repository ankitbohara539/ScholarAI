from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.university import UniversityPage, UniversityResponse
from app.services.university_service import UniversityService

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/universities", response_model=UniversityPage)
def list_public_universities(
    db: Annotated[Session, Depends(get_db)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=50)] = 12,
    search: str | None = None,
    country: str | None = None,
    region: str | None = None,
) -> UniversityPage:
    return UniversityService(db).list(
        page=page, page_size=page_size, search=search, country=country,
        region=region, is_active=True,
    )


@router.get("/universities/{university_id}", response_model=UniversityResponse)
def get_public_university(
    university_id: int,
    db: Annotated[Session, Depends(get_db)],
) -> UniversityResponse:
    return UniversityResponse.model_validate(UniversityService(db).get(university_id))
