class ArtifactValidationError(RuntimeError):
    """Raised when saved ML artifacts do not match the inference contract."""
