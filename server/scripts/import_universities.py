import argparse
import json
from dataclasses import asdict
from pathlib import Path

from app.db.database import SessionLocal
from app.services.university_import_service import UniversityImportService

DEFAULT_DATASET = Path(__file__).resolve().parents[1] / "ml_engine" / "data" / "raw" / "QS_Ranking_Uni_Dataset.csv"


def main() -> None:
    parser = argparse.ArgumentParser(description="Import normalized QS universities into the configured database")
    parser.add_argument("--file", type=Path, default=DEFAULT_DATASET)
    args = parser.parse_args()
    with SessionLocal() as db:
        summary = UniversityImportService(db).import_csv(args.file)
    print(json.dumps(asdict(summary), indent=2))


if __name__ == "__main__":
    main()
