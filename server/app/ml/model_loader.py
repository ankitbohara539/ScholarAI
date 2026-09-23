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
from ml_engine.persistence import PickleModelError, load_model

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
    if settings.ml_pickle_path.exists():
        try:
            bundle = load_model(settings.ml_pickle_path)
            metadata = bundle["metadata"]
            if metadata.get("feature_columns") != FEATURE_COLUMNS:
                raise ArtifactValidationError("Model feature schema does not match application schema")
            input_size = int(bundle["input_size"])
            if input_size != len(FEATURE_COLUMNS):
                raise ArtifactValidationError("Model input dimensionality is invalid")
            model = AdmissionMLP(input_size, tuple(bundle["hidden_sizes"]))
            model.load_state_dict({key: torch.as_tensor(value) for key, value in bundle["model_state"].items()})
            model.eval()
            artifacts = _validated_artifacts(model, metadata)
            logger.info("Recommendation pickle loaded version=%s", settings.ml_model_version)
            return artifacts
        except ArtifactValidationError:
            raise
        except PickleModelError as exc:
            raise ArtifactValidationError(str(exc)) from exc
        except Exception as exc:
            logger.error("Recommendation pickle could not be loaded error_type=%s", type(exc).__name__)
            raise ArtifactValidationError("Model pickle is incompatible") from exc

    # Backward-compatible fallback for installations trained before pickle support.
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
        artifacts = _validated_artifacts(model, metadata)
    except ArtifactValidationError:
        raise
    except Exception as exc:
        logger.error("Recommendation artifacts could not be loaded error_type=%s", type(exc).__name__)
        raise ArtifactValidationError("Model artifacts are incompatible") from exc
    logger.info("Recommendation model loaded version=%s features=%s", settings.ml_model_version, len(FEATURE_COLUMNS))
    return artifacts


def _validated_artifacts(model: AdmissionMLP, metadata: dict[str, object]) -> ModelArtifacts:
    try:
        mean = np.asarray(metadata["scaler_mean"], dtype=np.float32)
        scale = np.asarray(metadata["scaler_scale"], dtype=np.float32)
        cohort_features = np.asarray(metadata["cohort_features"], dtype=np.float32)
        cohort_targets = np.asarray(metadata["cohort_targets"], dtype=np.float32)
    except (KeyError, TypeError, ValueError) as exc:
        raise ArtifactValidationError("Model metadata is incomplete") from exc
    expected = len(FEATURE_COLUMNS)
    if mean.shape != (expected,) or scale.shape != (expected,) or np.any(scale == 0):
        raise ArtifactValidationError("Scaler metadata is invalid")
    if cohort_features.ndim != 2 or cohort_features.shape[1] != expected or len(cohort_targets) != len(cohort_features):
        raise ArtifactValidationError("Cohort metadata is invalid")
    return ModelArtifacts(model, mean, scale, cohort_features, cohort_targets, settings.ml_model_version)
