from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parent.parent.parent / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    PROJECT_NAME: str = "Smart Mess Management System"
    DEBUG: bool = False

    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    ADMIN_NAME: str = "Admin"
    ADMIN_EMAIL: str = "admin@smms.local"
    ADMIN_PASSWORD: str = "admin"

    ALLOWED_HOSTS: str = ""

    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    RATE_LIMIT_ENABLED: bool = False
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = 60

    @property
    def cors_origins(self) -> List[str]:
        origins = ["http://localhost", "http://localhost:3000"]
        if self.ALLOWED_HOSTS:
            hosts = [h.strip() for h in self.ALLOWED_HOSTS.split(",") if h.strip()]
            origins = list(dict.fromkeys(origins + hosts))
        return origins


@lru_cache
def get_settings() -> Settings:
    return Settings()
