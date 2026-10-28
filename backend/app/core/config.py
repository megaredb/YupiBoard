from pathlib import Path
from typing import Annotated, Any

from pydantic import BeforeValidator, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


def parse_cors(v: Any) -> list[str]:
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",") if i.strip()]
    elif isinstance(v, list):
        return v
    import json

    return json.loads(v) if isinstance(v, str) else []


# Root repository directory path
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
ENV_PATH = ROOT_DIR / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_PATH if ENV_PATH.exists() else ".env",
        env_ignore_empty=True,
        extra="ignore",
    )

    PROJECT_NAME: str = "YupiBoard"
    ENVIRONMENT: str = "development"

    # Database
    POSTGRES_USER: str = "pguser"
    POSTGRES_PASSWORD: str = "changeme123!0"
    POSTGRES_SERVER: str = "127.0.0.1"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "local"

    @computed_field  # type: ignore[prop-decorator]
    @property
    def DATABASE_URL(self) -> str:
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # Security & Tokens
    SECRET_KEY: str = "super-secret-dev-jwt-key-replace-in-production-min-32-chars-long"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    EMAIL_RESET_TOKEN_EXPIRE_HOURS: int = 24

    # CORS
    CORS_ORIGINS: Annotated[list[str], BeforeValidator(parse_cors)] = [
        "https://yupiboard.localhost",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    FRONTEND_URL: str = "https://yupiboard.localhost"

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    # Mail (FastAPI-Mail)
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM: str = "noreply@yupiboard.com"
    MAIL_PORT: int = 1025
    MAIL_SERVER: str = "localhost"
    MAIL_STARTTLS: bool = False
    MAIL_SSL_TLS: bool = False
    MAIL_FROM_NAME: str = "YupiBoard Support"

    # Storage & Media
    STORAGE_BACKEND: str = "local"
    MEDIA_DIR: str = "media"
    MEDIA_BASE_URL: str = "https://api.yupiboard.localhost/media"
    S3_ENDPOINT_URL: str | None = None
    S3_BUCKET_NAME: str = "yupiboard-storage"
    S3_ACCESS_KEY: str | None = None
    S3_SECRET_KEY: str | None = None
    S3_PUBLIC_URL_PREFIX: str = "https://storage.yupiboard.com"

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"


settings = Settings()
