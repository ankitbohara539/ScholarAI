import argparse
import io
import json
import random
from pathlib import Path

import numpy as np
import torch
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from torch import nn
from torch.utils.data import DataLoader, TensorDataset

from .config import (
    ADMISSION_DATA,
    ARTIFACT_DIR,
    FEATURE_COLUMNS,
    METADATA_PATH,
    METRICS_PATH,
    MODEL_PATH,
    TARGET_COLUMN,
)
from .data import load_admissions
from .model import AdmissionMLP


def set_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)


def train_model(
    data_path: Path = ADMISSION_DATA,
    epochs: int = 300,
    batch_size: int = 64,
    learning_rate: float = 1e-3,
    patience: int = 35,
    seed: int = 42,
) -> dict[str, float]:
    set_seed(seed)
    frame = load_admissions(data_path)
    train_frame, test_frame = train_test_split(frame, test_size=0.20, random_state=seed)
    train_frame, validation_frame = train_test_split(
        train_frame, test_size=0.20, random_state=seed
    )

    scaler = StandardScaler().fit(train_frame[FEATURE_COLUMNS])

    def tensors(source):
        x = torch.tensor(scaler.transform(source[FEATURE_COLUMNS]), dtype=torch.float32)
        y = torch.tensor(source[TARGET_COLUMN].to_numpy(), dtype=torch.float32)
        return x, y

    x_train, y_train = tensors(train_frame)
    x_validation, y_validation = tensors(validation_frame)
    x_test, y_test = tensors(test_frame)

    model = AdmissionMLP(input_size=len(FEATURE_COLUMNS))
    optimizer = torch.optim.AdamW(model.parameters(), lr=learning_rate, weight_decay=1e-4)
    loss_function = nn.MSELoss()
    loader = DataLoader(TensorDataset(x_train, y_train), batch_size=batch_size, shuffle=True)

    best_loss = float("inf")
    best_state = None
    remaining_patience = patience
    epochs_run = 0
    for epoch in range(1, epochs + 1):
        model.train()
        for features, targets in loader:
            optimizer.zero_grad()
            loss = loss_function(model(features), targets)
            loss.backward()
            optimizer.step()

        model.eval()
        with torch.no_grad():
            validation_loss = loss_function(model(x_validation), y_validation).item()
        epochs_run = epoch
        if validation_loss < best_loss - 1e-6:
            best_loss = validation_loss
            best_state = {key: value.detach().clone() for key, value in model.state_dict().items()}
            remaining_patience = patience
        else:
            remaining_patience -= 1
            if remaining_patience == 0:
                break

    if best_state is None:
        raise RuntimeError("Training did not produce a model")
    model.load_state_dict(best_state)
    model.eval()
    with torch.no_grad():
        predictions = model(x_test).numpy()

    metrics = {
        "mae": float(mean_absolute_error(y_test.numpy(), predictions)),
        "rmse": float(mean_squared_error(y_test.numpy(), predictions) ** 0.5),
        "r2": float(r2_score(y_test.numpy(), predictions)),
        "best_validation_mse": float(best_loss),
        "epochs_run": epochs_run,
        "train_rows": len(train_frame),
        "validation_rows": len(validation_frame),
        "test_rows": len(test_frame),
    }

    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    checkpoint_buffer = io.BytesIO()
    torch.save(
        {
            "model_state": model.state_dict(),
            "input_size": len(FEATURE_COLUMNS),
            "hidden_sizes": (64, 32, 16),
        },
        checkpoint_buffer,
    )
    MODEL_PATH.write_bytes(checkpoint_buffer.getvalue())
    metadata = {
        "feature_columns": FEATURE_COLUMNS,
        "scaler_mean": scaler.mean_.tolist(),
        "scaler_scale": scaler.scale_.tolist(),
        "cohort_features": frame[FEATURE_COLUMNS].to_numpy().tolist(),
        "cohort_targets": frame[TARGET_COLUMN].to_numpy().tolist(),
        "seed": seed,
    }
    METADATA_PATH.write_text(json.dumps(metadata), encoding="utf-8")
    METRICS_PATH.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    return metrics


def main() -> None:
    parser = argparse.ArgumentParser(description="Train the PyTorch admission ANN")
    parser.add_argument("--data", type=Path, default=ADMISSION_DATA)
    parser.add_argument("--epochs", type=int, default=300)
    parser.add_argument("--batch-size", type=int, default=64)
    parser.add_argument("--learning-rate", type=float, default=1e-3)
    parser.add_argument("--patience", type=int, default=35)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()
    metrics = train_model(
        args.data, args.epochs, args.batch_size, args.learning_rate, args.patience, args.seed
    )
    print(json.dumps(metrics, indent=2))
    print(f"Saved model to: {MODEL_PATH}")


if __name__ == "__main__":
    main()
