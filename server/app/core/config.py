from functools import lru_cache
from pathlib import Path

from pydantic import AnyHttpUrl, Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

SERVER_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "ScholarAI API"
    api_prefix: str = "/api"
    database_url: str = Field(validation_alias="DATABASE_URL")
    jwt_secret_key: SecretStr = Field(min_length=32, validation_alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", validation_alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(
        default=30, gt=0, validation_alias="ACCESS_TOKEN_EXPIRE_MINUTES"
    )
    frontend_origin: AnyHttpUrl = Field(
        default="http://localhost:5173", validation_alias="FRONTEND_ORIGIN"
    )
    log_level: str = Field(default="INFO", validation_alias="LOG_LEVEL")
    ml_model_path: Path = Field(
        default=SERVER_DIR / "ml_engine" / "artifacts" / "admission_mlp.pt",
        validation_alias="ML_MODEL_PATH",
    )
    ml_metadata_path: Path = Field(
        default=SERVER_DIR / "ml_engine" / "artifacts" / "metadata.json",
        validation_alias="ML_METADATA_PATH",
    )
    ml_model_version: str = Field(default="admission-mlp-v1", validation_alias="ML_MODEL_VERSION")
    avatar_upload_dir: Path = Field(
        default=SERVER_DIR / "uploads" / "avatars", validation_alias="AVATAR_UPLOAD_DIR"
    )
    avatar_max_bytes: int = Field(default=3 * 1024 * 1024, gt=0, validation_alias="AVATAR_MAX_BYTES")

    model_config = SettingsConfigDict(
        env_file=SERVER_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("jwt_algorithm")
    @classmethod
    def validate_algorithm(cls, value: str) -> str:
        if value != "HS256":
            raise ValueError("Only HS256 is supported by this application")
        return value

    @field_validator("ml_model_path", "ml_metadata_path", "avatar_upload_dir", mode="after")
    @classmethod
    def resolve_ml_path(cls, value: Path) -> Path:
        return value if value.is_absolute() else SERVER_DIR / value

    @property
    def cors_origins(self) -> list[str]:
        return [str(self.frontend_origin).rstrip("/")]


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings = get_settings()
