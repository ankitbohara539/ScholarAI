from typing import Annotated

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_roles
from app.db.database import get_db
from app.models.user import User, UserRole
from app.schemas.scholarship import ScholarshipCreate, ScholarshipResponse, ScholarshipUpdate
from app.services.scholarship_service import ScholarshipService

router = APIRouter(prefix="/admin/universities/{university_id}/scholarships", tags=["admin-scholarships"])
AdminUser = Annotated[User, Depends(require_roles(UserRole.ADMIN))]


@router.get("", response_model=list[ScholarshipResponse])
def list_scholarships(university_id: int, _: AdminUser, db: Annotated[Session, Depends(get_db)]):
    return ScholarshipService(db).list(university_id)


@router.post("", response_model=ScholarshipResponse, status_code=status.HTTP_201_CREATED)
def create_scholarship(university_id: int, data: ScholarshipCreate, _: AdminUser, db: Annotated[Session, Depends(get_db)]):
    return ScholarshipService(db).create(university_id, data)


@router.patch("/{scholarship_id}", response_model=ScholarshipResponse)
def update_scholarship(university_id: int, scholarship_id: int, data: ScholarshipUpdate, _: AdminUser, db: Annotated[Session, Depends(get_db)]):
    return ScholarshipService(db).update(university_id, scholarship_id, data)


@router.delete("/{scholarship_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_scholarship(university_id: int, scholarship_id: int, _: AdminUser, db: Annotated[Session, Depends(get_db)]) -> Response:
    ScholarshipService(db).delete(university_id, scholarship_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
