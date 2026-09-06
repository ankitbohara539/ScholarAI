from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.scholarship import Scholarship


class ScholarshipRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_for_university(self, university_id: int) -> Sequence[Scholarship]:
        return self.db.scalars(
            select(Scholarship)
            .where(Scholarship.university_id == university_id)
            .order_by(Scholarship.is_active.desc(), Scholarship.name)
        ).all()

    def get(self, scholarship_id: int, university_id: int) -> Scholarship | None:
        return self.db.scalar(
            select(Scholarship).where(
                Scholarship.id == scholarship_id,
                Scholarship.university_id == university_id,
            )
        )

    def create(self, university_id: int, values: dict[str, object]) -> Scholarship:
        row = Scholarship(university_id=university_id, **values)
        self.db.add(row)
        self.db.flush()
        return row

    def update(self, row: Scholarship, values: dict[str, object]) -> Scholarship:
        for key, value in values.items():
            setattr(row, key, value)
        self.db.flush()
        return row

    def delete(self, row: Scholarship) -> None:
        self.db.delete(row)
        self.db.flush()
