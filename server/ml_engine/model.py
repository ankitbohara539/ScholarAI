from torch import nn


class AdmissionMLP(nn.Module):
    """Small feed-forward ANN for admission probability regression."""

    def __init__(self, input_size: int = 7, hidden_sizes: tuple[int, ...] = (64, 32, 16)):
        super().__init__()
        layers: list[nn.Module] = []
        previous = input_size
        for width in hidden_sizes:
            layers.extend((nn.Linear(previous, width), nn.ReLU(), nn.Dropout(0.10)))
            previous = width
        layers.extend((nn.Linear(previous, 1), nn.Sigmoid()))
        self.network = nn.Sequential(*layers)

    def forward(self, features):
        return self.network(features).squeeze(-1)
