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

    @property
    def cors_origins(self) -> list[str]:
        return [str(self.frontend_origin).rstrip("/")]


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings = get_settings()
