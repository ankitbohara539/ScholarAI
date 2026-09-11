from pathlib import Path

PACKAGE_DIR = Path(__file__).resolve().parent
DATA_DIR = PACKAGE_DIR / "data" / "raw"
ARTIFACT_DIR = PACKAGE_DIR / "artifacts"
QS_DATA = DATA_DIR / "QS_Ranking_Uni_Dataset.csv"
ADMISSION_DATA = DATA_DIR / "university_admission.csv"
MODEL_PATH = ARTIFACT_DIR / "admission_mlp.pt"
METADATA_PATH = ARTIFACT_DIR / "metadata.json"
METRICS_PATH = ARTIFACT_DIR / "metrics.json"
CONFUSION_MATRIX_PATH = ARTIFACT_DIR / "admission_band_confusion_matrix.png"

FEATURE_COLUMNS = [
    "GRE_Score",
    "TOEFL_Score",
    "University_Rating",
    "SOP",
    "LOR",
    "GPA",
    "Research",
]
TARGET_COLUMN = "Chance_of_Admission"
