from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_roles
from app.db.database import get_db
from app.models.user import User, UserRole
from app.schemas.university import UniversityCreate, UniversityPage, UniversityResponse, UniversityUpdate
from app.services.university_service import UniversityService

router = APIRouter(prefix="/admin/universities", tags=["admin-universities"])
AdminUser = Annotated[User, Depends(require_roles(UserRole.ADMIN))]


@router.get("", response_model=UniversityPage)
def list_universities(
    _: AdminUser,
    db: Annotated[Session, Depends(get_db)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    search: str | None = None,
    country: str | None = None,
    region: str | None = None,
    university_type: str | None = None,
    is_active: bool | None = None,
) -> UniversityPage:
    return UniversityService(db).list(admin=True, page=page, page_size=page_size, search=search, country=country, region=region, university_type=university_type, is_active=is_active)


@router.post("", response_model=UniversityResponse, status_code=status.HTTP_201_CREATED)
def create_university(data: UniversityCreate, _: AdminUser, db: Annotated[Session, Depends(get_db)]) -> UniversityResponse:
    return UniversityResponse.model_validate(UniversityService(db).create(data))


@router.get("/{university_id}", response_model=UniversityResponse)
def get_university(university_id: int, _: AdminUser, db: Annotated[Session, Depends(get_db)]) -> UniversityResponse:
    return UniversityResponse.model_validate(UniversityService(db).get(university_id, admin=True))


@router.patch("/{university_id}", response_model=UniversityResponse)
def update_university(university_id: int, data: UniversityUpdate, _: AdminUser, db: Annotated[Session, Depends(get_db)]) -> UniversityResponse:
    return UniversityResponse.model_validate(UniversityService(db).update(university_id, data))


@router.delete("/{university_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_university(university_id: int, _: AdminUser, db: Annotated[Session, Depends(get_db)]) -> Response:
    UniversityService(db).delete(university_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
