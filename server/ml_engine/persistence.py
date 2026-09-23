"""Versioned pickle persistence for locally trained ScholarAI model bundles.

Only load artifacts produced by this project. Python pickle is not safe for
untrusted files.
"""
from __future__ import annotations

import pickle
from pathlib import Path
from typing import Any


ARTIFACT_FORMAT_VERSION = 1


class PickleModelError(RuntimeError):
    """Raised when a pickle artifact is missing, corrupt, or incompatible."""


def save_model(model: dict[str, Any], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {"artifact_format_version": ARTIFACT_FORMAT_VERSION, **model}
    try:
        with path.open("wb") as artifact:
            pickle.dump(payload, artifact, protocol=pickle.HIGHEST_PROTOCOL)
    except OSError as exc:
        raise PickleModelError(f"Could not save model artifact: {path}") from exc


def load_model(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise PickleModelError(f"Model artifact does not exist: {path}")
    try:
        with path.open("rb") as artifact:
            payload = pickle.load(artifact)  # noqa: S301 - configured local training artifact only
    except (OSError, pickle.PickleError, EOFError, AttributeError, ImportError, ValueError) as exc:
        raise PickleModelError("Model pickle is corrupt or incompatible") from exc
    if not isinstance(payload, dict) or payload.get("artifact_format_version") != ARTIFACT_FORMAT_VERSION:
        raise PickleModelError("Model pickle format is incompatible")
    return payload
