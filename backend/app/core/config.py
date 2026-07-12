from functools import lru_cache
from typing import Literal

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_name: str = "Smart Mess Management System"
    app_env: Literal["development", "test", "production"] = "development"
    api_v1_prefix: str = "/api/v1"
    secret_key: str = Field(min_length=32)
    access_token_expire_minutes: int = 720
    database_url: str
    frontend_url: AnyHttpUrl = AnyHttpUrl("http://localhost:3000")
    cloudinary_url: str | None = None
    log_level: str = "INFO"

    @property
    def cors_origins(self) -> list[str]:
        return [str(self.frontend_url).rstrip("/")]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
