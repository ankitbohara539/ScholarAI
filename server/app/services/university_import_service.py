import csv
import io
import logging
import re
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from pathlib import Path

from sqlalchemy.orm import Session

from app.repositories.university_repository import UniversityRepository

logger = logging.getLogger(__name__)


@dataclass
class ImportSummary:
    inserted: int = 0
    updated: int = 0
    skipped: int = 0
    failed: int = 0


def parse_rank(value: str) -> int:
    numbers = [int(number) for number in re.findall(r"\d+", value.replace(",", ""))]
    if not numbers:
        raise ValueError("ranking is missing")
    return round(sum(numbers[:2]) / min(len(numbers), 2))


class UniversityImportService:
    REQUIRED_COLUMNS = {
        "RANK_2025",
        "Institution_Name",
        "Location",
        "Region",
        "Academic_Reputation_Score",
    }

    def __init__(self, db: Session) -> None:
        self.db = db
        self.universities = UniversityRepository(db)

    @staticmethod
    def _reader(path: Path) -> csv.DictReader:
        for encoding in ("utf-8-sig", "cp1252", "latin1"):
            try:
                return csv.DictReader(io.StringIO(path.read_text(encoding=encoding)))
            except UnicodeDecodeError:
                continue
        raise ValueError(f"Unable to decode dataset: {path.name}")

    def import_csv(self, path: Path) -> ImportSummary:
        if not path.exists():
            raise FileNotFoundError(f"Dataset not found: {path.name}")
        summary = ImportSummary()
        reader = self._reader(path)
        try:
            missing = self.REQUIRED_COLUMNS - set(reader.fieldnames or [])
            if missing:
                raise ValueError(f"Dataset is missing required columns: {sorted(missing)}")
            for row_number, row in enumerate(reader, start=2):
                try:
                    name = row["Institution_Name"].strip()
                    country = row["Location"].strip()
                    region = row["Region"].strip()
                    reputation = Decimal(row["Academic_Reputation_Score"].strip())
                    if not name or not country or not region or not Decimal("0") <= reputation <= Decimal("100"):
                        raise ValueError("invalid required value")
                    values: dict[str, object] = {
                        "name": name,
                        "country": country,
                        "region": region,
                        "ranking": parse_rank(row["RANK_2025"]),
                        "academic_reputation_score": reputation,
                    }
                    existing = self.universities.get_by_identity(name, country)
                    if existing is None:
                        self.universities.create(values)
                        summary.inserted += 1
                    else:
                        changed = any(getattr(existing, key) != value for key, value in values.items())
                        if changed:
                            self.universities.update(existing, values)
                            summary.updated += 1
                        else:
                            summary.skipped += 1
                except (KeyError, ValueError, InvalidOperation, TypeError):
                    summary.failed += 1
                    logger.warning("Skipping malformed university dataset row=%s", row_number)
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise
        logger.info(
            "University import complete inserted=%s updated=%s skipped=%s failed=%s",
            summary.inserted,
            summary.updated,
            summary.skipped,
            summary.failed,
        )
        return summary
