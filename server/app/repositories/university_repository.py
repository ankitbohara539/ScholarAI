from collections.abc import Sequence
from datetime import datetime, timezone

from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session

from app.models.university import University


class UniversityRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self, university_id: int, *, include_inactive: bool = False) -> University | None:
        statement = select(University).where(
            University.id == university_id,
            University.deleted_at.is_(None),
        )
        if not include_inactive:
            statement = statement.where(University.is_active.is_(True))
        return self.db.scalar(statement)

    def get_by_identity(self, name: str, country: str) -> University | None:
        return self.db.scalar(
            select(University).where(
                University.name == name.strip(),
                University.country == country.strip(),
            )
        )

    def list_paginated(
        self,
        *,
        page: int,
        page_size: int,
        search: str | None = None,
        country: str | None = None,
        region: str | None = None,
        university_type: str | None = None,
        is_active: bool | None = True,
        max_tuition: float | None = None,
        admin: bool = False,
    ) -> tuple[Sequence[University], int]:
        statement: Select[tuple[University]] = select(University).where(University.deleted_at.is_(None))
        if not admin or is_active is not None:
            statement = statement.where(University.is_active.is_(True if not admin else is_active))
        if search:
            value = f"%{search.strip()}%"
            statement = statement.where(or_(University.name.ilike(value), University.country.ilike(value)))
        if country:
            statement = statement.where(University.country == country)
        if region:
            statement = statement.where(University.region == region)
        if university_type:
            statement = statement.where(University.university_type == university_type)
        if max_tuition is not None:
            statement = statement.where(University.tuition_fee.is_not(None), University.tuition_fee <= max_tuition)

        total = self.db.scalar(select(func.count()).select_from(statement.order_by(None).subquery())) or 0
        items = self.db.scalars(
            statement.order_by(University.ranking, University.name).offset((page - 1) * page_size).limit(page_size)
        ).all()
        return items, total

    def create(self, values: dict[str, object]) -> University:
        university = University(**values)
        self.db.add(university)
        self.db.flush()
        return university

    def update(self, university: University, values: dict[str, object]) -> University:
        for field, value in values.items():
            setattr(university, field, value)
        self.db.flush()
        return university

    def soft_delete(self, university: University) -> None:
        university.deleted_at = datetime.now(timezone.utc)
        university.is_active = False
        self.db.flush()

    def active_for_recommendations(self) -> Sequence[University]:
        return self.db.scalars(
            select(University).where(University.is_active.is_(True), University.deleted_at.is_(None)).order_by(University.ranking)
        ).all()

    def count(self, *, active: bool | None = None) -> int:
        statement = select(func.count(University.id)).where(University.deleted_at.is_(None))
        if active is not None:
            statement = statement.where(University.is_active.is_(active))
        return self.db.scalar(statement) or 0
