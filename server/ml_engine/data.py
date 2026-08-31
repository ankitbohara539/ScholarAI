import re
from pathlib import Path

import numpy as np
import pandas as pd

from .config import FEATURE_COLUMNS, TARGET_COLUMN


def read_csv_flexible(path: Path) -> pd.DataFrame:
    """Read UTF-8 or common Windows-encoded CSV files."""
    for encoding in ("utf-8-sig", "cp1252", "latin1"):
        try:
            return pd.read_csv(path, encoding=encoding)
        except UnicodeDecodeError:
            continue
    raise ValueError(f"Could not decode CSV: {path}")


def load_admissions(path: Path) -> pd.DataFrame:
    frame = read_csv_flexible(path)
    required = FEATURE_COLUMNS + [TARGET_COLUMN]
    missing = sorted(set(required) - set(frame.columns))
    if missing:
        raise ValueError(f"Admission data is missing columns: {missing}")
    frame = frame[required].apply(pd.to_numeric, errors="coerce").dropna()
    if frame.empty:
        raise ValueError("Admission data has no valid numeric rows")
    return frame


def rank_midpoint(value: object) -> float:
    numbers = [int(number) for number in re.findall(r"\d+", str(value).replace(",", ""))]
    if not numbers:
        return np.nan
    return float(sum(numbers[:2]) / min(len(numbers), 2))


def rank_to_rating(rank: float) -> int:
    if rank <= 50:
        return 5
    if rank <= 200:
        return 4
    if rank <= 500:
        return 3
    if rank <= 1000:
        return 2
    return 1


def load_universities(path: Path) -> pd.DataFrame:
    frame = read_csv_flexible(path)
    required = {
        "RANK_2025",
        "Institution_Name",
        "Location",
        "Region",
        "Academic_Reputation_Score",
    }
    missing = sorted(required - set(frame.columns))
    if missing:
        raise ValueError(f"QS data is missing columns: {missing}")
    frame = frame.copy()
    frame["rank_numeric"] = frame["RANK_2025"].map(rank_midpoint)
    frame["reputation_normalized"] = (
        pd.to_numeric(frame["Academic_Reputation_Score"], errors="coerce") / 100.0
    ).clip(0, 1)
    frame = frame.dropna(subset=["rank_numeric", "reputation_normalized"])
    frame["university_rating"] = frame["rank_numeric"].map(rank_to_rating)
    return frame.reset_index(drop=True)
