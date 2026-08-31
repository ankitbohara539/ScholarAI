from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import require_roles
from app.db.database import get_db
from app.models.user import User, UserRole
from app.schemas.university import UniversityPage, UniversityResponse
from app.services.university_service import UniversityService

router = APIRouter(prefix="/universities", tags=["universities"])


@router.get("", response_model=UniversityPage)
def list_universities(
    _: Annotated[User, Depends(require_roles(UserRole.STUDENT))],
    db: Annotated[Session, Depends(get_db)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    search: str | None = None,
    country: str | None = None,
    region: str | None = None,
    max_tuition: Annotated[float | None, Query(ge=0)] = None,
) -> UniversityPage:
    return UniversityService(db).list(page=page, page_size=page_size, search=search, country=country, region=region, max_tuition=max_tuition, is_active=True)


@router.get("/{university_id}", response_model=UniversityResponse)
def get_university(
    university_id: int,
    _: Annotated[User, Depends(require_roles(UserRole.STUDENT))],
    db: Annotated[Session, Depends(get_db)],
) -> UniversityResponse:
    return UniversityResponse.model_validate(UniversityService(db).get(university_id))
