import math

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictException, NotFoundException
from app.models.university import University
from app.repositories.university_repository import UniversityRepository
from app.schemas.university import UniversityCreate, UniversityPage, UniversityResponse, UniversityUpdate


class UniversityService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.universities = UniversityRepository(db)

    def list(self, *, admin: bool = False, **filters: object) -> UniversityPage:
        items, total = self.universities.list_paginated(admin=admin, **filters)  # type: ignore[arg-type]
        page = int(filters["page"])
        page_size = int(filters["page_size"])
        return UniversityPage(
            items=[UniversityResponse.model_validate(item) for item in items],
            page=page,
            page_size=page_size,
            total=total,
            pages=math.ceil(total / page_size) if total else 0,
        )

    def get(self, university_id: int, *, admin: bool = False) -> University:
        university = self.universities.get(university_id, include_inactive=admin)
        if university is None:
            raise NotFoundException("University not found")
        return university

    def create(self, data: UniversityCreate) -> University:
        values = data.model_dump(mode="json")
        try:
            university = self.universities.create(values)
            self.db.commit()
        except IntegrityError as exc:
            self.db.rollback()
            raise ConflictException("A university with this name and country already exists") from exc
        self.db.refresh(university)
        return university

    def update(self, university_id: int, data: UniversityUpdate) -> University:
        university = self.get(university_id, admin=True)
        values = data.model_dump(exclude_unset=True, mode="json")
        try:
            self.universities.update(university, values)
            self.db.commit()
        except IntegrityError as exc:
            self.db.rollback()
            raise ConflictException("A university with this name and country already exists") from exc
        self.db.refresh(university)
        return university

    def delete(self, university_id: int) -> None:
        university = self.get(university_id, admin=True)
        self.universities.soft_delete(university)
        self.db.commit()
