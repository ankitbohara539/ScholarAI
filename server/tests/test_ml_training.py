from pathlib import Path

import numpy as np

from ml_engine.train import BAND_METRIC_NOTE, admission_bands, save_admission_band_confusion_matrix


def test_admission_band_confusion_matrix_is_saved(tmp_path: Path) -> None:
    actual = np.asarray([0.35, 0.60, 0.82, 0.90], dtype=np.float32)
    predicted = np.asarray([0.40, 0.70, 0.78, 0.92], dtype=np.float32)
    output = tmp_path / "admission-bands.png"

    accuracy = save_admission_band_confusion_matrix(actual, predicted, output)

    assert output.exists()
    assert output.stat().st_size > 0
    assert accuracy == 1.0
    assert admission_bands(np.asarray([-1.0, 0.50, 0.75, 2.0])).tolist() == [0, 1, 2, 2]
    assert "diagnostic agreement" in BAND_METRIC_NOTE
    assert "not admission-prediction or recommendation accuracy" in BAND_METRIC_NOTE
