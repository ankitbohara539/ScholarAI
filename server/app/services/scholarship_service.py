from collections.abc import Sequence

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.models.scholarship import Scholarship
from app.repositories.scholarship_repository import ScholarshipRepository
from app.schemas.scholarship import ScholarshipCreate, ScholarshipUpdate
from app.services.university_service import UniversityService


class ScholarshipService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.rows = ScholarshipRepository(db)
        self.universities = UniversityService(db)

    def list(self, university_id: int) -> Sequence[Scholarship]:
        self.universities.get(university_id, admin=True)
        return self.rows.list_for_university(university_id)

    def create(self, university_id: int, data: ScholarshipCreate) -> Scholarship:
        self.universities.get(university_id, admin=True)
        row = self.rows.create(university_id, data.model_dump())
        self.db.commit()
        self.db.refresh(row)
        return row

    def update(self, university_id: int, scholarship_id: int, data: ScholarshipUpdate) -> Scholarship:
        row = self.rows.get(scholarship_id, university_id)
        if row is None:
            raise NotFoundException("Scholarship not found")
        self.rows.update(row, data.model_dump(exclude_unset=True))
        self.db.commit()
        self.db.refresh(row)
        return row

    def delete(self, university_id: int, scholarship_id: int) -> None:
        row = self.rows.get(scholarship_id, university_id)
        if row is None:
            raise NotFoundException("Scholarship not found")
        self.rows.delete(row)
        self.db.commit()
