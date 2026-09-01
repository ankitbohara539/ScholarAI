import json
import logging
from dataclasses import dataclass
from functools import lru_cache

import numpy as np
import torch

from app.core.config import settings
from app.ml.exceptions import ArtifactValidationError
from ml_engine.config import FEATURE_COLUMNS
from ml_engine.model import AdmissionMLP

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class ModelArtifacts:
    model: AdmissionMLP
    mean: np.ndarray
    scale: np.ndarray
    cohort_features: np.ndarray
    cohort_targets: np.ndarray
    version: str


@lru_cache(maxsize=1)
def load_model_artifacts() -> ModelArtifacts:
    if not settings.ml_model_path.exists() or not settings.ml_metadata_path.exists():
        logger.error("Recommendation artifacts are missing")
        raise ArtifactValidationError("Required model artifacts are missing")
    try:
        metadata = json.loads(settings.ml_metadata_path.read_text(encoding="utf-8"))
        if metadata.get("feature_columns") != FEATURE_COLUMNS:
            raise ArtifactValidationError("Model feature schema does not match application schema")
        checkpoint = torch.load(settings.ml_model_path, map_location="cpu", weights_only=True)
        if checkpoint.get("input_size") != len(FEATURE_COLUMNS):
            raise ArtifactValidationError("Model input dimensionality is invalid")
        model = AdmissionMLP(checkpoint["input_size"], tuple(checkpoint["hidden_sizes"]))
        model.load_state_dict(checkpoint["model_state"])
        model.eval()
        mean = np.asarray(metadata["scaler_mean"], dtype=np.float32)
        scale = np.asarray(metadata["scaler_scale"], dtype=np.float32)
        cohort_features = np.asarray(metadata["cohort_features"], dtype=np.float32)
        cohort_targets = np.asarray(metadata["cohort_targets"], dtype=np.float32)
        expected = len(FEATURE_COLUMNS)
        if mean.shape != (expected,) or scale.shape != (expected,) or np.any(scale == 0):
            raise ArtifactValidationError("Scaler metadata is invalid")
        if cohort_features.ndim != 2 or cohort_features.shape[1] != expected or len(cohort_targets) != len(cohort_features):
            raise ArtifactValidationError("Cohort metadata is invalid")
    except ArtifactValidationError:
        raise
    except Exception as exc:
        logger.error("Recommendation artifacts could not be loaded error_type=%s", type(exc).__name__)
        raise ArtifactValidationError("Model artifacts are incompatible") from exc
    logger.info("Recommendation model loaded version=%s features=%s", settings.ml_model_version, len(FEATURE_COLUMNS))
    return ModelArtifacts(model, mean, scale, cohort_features, cohort_targets, settings.ml_model_version)
