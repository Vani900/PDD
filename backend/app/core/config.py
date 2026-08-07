"""
CharityAI Backend – Application Configuration
Uses Pydantic Settings for type-safe, validated environment variables.
"""
from __future__ import annotations

from enum import Enum
from functools import lru_cache
from typing import Any

from pydantic import AnyHttpUrl, EmailStr, PostgresDsn, RedisDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Environment(str, Enum):
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"


class StorageProvider(str, Enum):
    S3 = "s3"
    R2 = "r2"
    MINIO = "minio"


class EmailProvider(str, Enum):
    SENDGRID = "sendgrid"
    SMTP = "smtp"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ──────────────────────────────────────────────────────────
    APP_NAME: str = "CharityAI"
    APP_ENV: Environment = Environment.DEVELOPMENT
    APP_VERSION: str = "1.0.1"
    APP_SECRET_KEY: str = "dev-secret-key-charityai-2026-super-secure-32chars"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    # ── Backend API ──────────────────────────────────────────────────────────
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    BACKEND_WORKERS: int = 4
    API_V1_PREFIX: str = "/api/v1"

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    parsed = json.loads(v)
                    if isinstance(parsed, list):
                        return [str(item) for item in parsed]
                except Exception:
                    pass
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        if isinstance(v, list):
            return [str(origin) for origin in v]
        return ["http://localhost:3000"]

    ALLOWED_ORIGINS: Any = ["http://localhost:3000"]

    # ── PostgreSQL ───────────────────────────────────────────────────────────
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "charityai"
    POSTGRES_USER: str = "charityai_user"
    POSTGRES_PASSWORD: str = "charityai_pass_2026"
    DATABASE_URL: str = ""
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10
    DATABASE_POOL_TIMEOUT: int = 30

    def get_database_url(self) -> str:
        url = self.DATABASE_URL
        if not url:
            url = (
                f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
                f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
            )
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url

    # ── Redis ─────────────────────────────────────────────────────────────────
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = ""
    REDIS_URL: str = ""
    REDIS_CACHE_TTL: int = 3600

    def get_redis_url(self) -> str:
        if self.REDIS_URL:
            return self.REDIS_URL
        if self.REDIS_PASSWORD:
            return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/0"
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/0"

    # ── RabbitMQ ─────────────────────────────────────────────────────────────
    RABBITMQ_HOST: str = "localhost"
    RABBITMQ_PORT: int = 5672
    RABBITMQ_USER: str = "charityai"
    RABBITMQ_PASSWORD: str = "charityai_rabbit_dev"
    RABBITMQ_VHOST: str = "/charityai"
    CELERY_BROKER_URL: str = ""
    CELERY_RESULT_BACKEND: str = ""

    def get_celery_broker_url(self) -> str:
        if self.CELERY_BROKER_URL:
            return self.CELERY_BROKER_URL
        return (
            f"amqp://{self.RABBITMQ_USER}:{self.RABBITMQ_PASSWORD}"
            f"@{self.RABBITMQ_HOST}:{self.RABBITMQ_PORT}/{self.RABBITMQ_VHOST}"
        )

    # ── Elasticsearch ─────────────────────────────────────────────────────────
    ELASTICSEARCH_URL: str = "http://localhost:9200"
    ELASTICSEARCH_USER: str = "elastic"
    ELASTICSEARCH_PASSWORD: str = ""

    # ── JWT ───────────────────────────────────────────────────────────────────
    JWT_SECRET_KEY: str = "dev-jwt-secret-key-charityai-2026-secure-token-64chars"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # ── OAuth2 ────────────────────────────────────────────────────────────────
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/google/callback"
    MICROSOFT_CLIENT_ID: str = ""
    MICROSOFT_CLIENT_SECRET: str = ""
    MICROSOFT_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/microsoft/callback"

    # ── Storage ───────────────────────────────────────────────────────────────
    STORAGE_PROVIDER: StorageProvider = StorageProvider.MINIO
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "ap-south-1"
    AWS_S3_BUCKET: str = "charityai-assets"
    AWS_S3_ENDPOINT_URL: str = ""
    CDN_BASE_URL: str = ""
    MINIO_ROOT_USER: str = "minio_admin"
    MINIO_ROOT_PASSWORD: str = ""
    MINIO_ENDPOINT: str = "http://localhost:9000"

    # ── Email ─────────────────────────────────────────────────────────────────
    EMAIL_PROVIDER: EmailProvider = EmailProvider.SMTP
    SENDGRID_API_KEY: str = ""
    EMAIL_FROM: str = "noreply@charityai.org"
    EMAIL_FROM_NAME: str = "CharityAI"
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_TLS: bool = True

    # ── SMS ───────────────────────────────────────────────────────────────────
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_FROM_NUMBER: str = ""

    # ── Firebase ─────────────────────────────────────────────────────────────
    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_CREDENTIALS_PATH: str = "./firebase-credentials.json"

    # ── AI ────────────────────────────────────────────────────────────────────
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-large"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-pro"

    # ── Payments ──────────────────────────────────────────────────────────────
    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    PAYPAL_CLIENT_ID: str = ""
    PAYPAL_CLIENT_SECRET: str = ""
    PAYPAL_MODE: str = "sandbox"

    # ── Google Maps ───────────────────────────────────────────────────────────
    GOOGLE_MAPS_API_KEY: str = ""

    # ── Rate Limiting ─────────────────────────────────────────────────────────
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW_SECONDS: int = 60
    AUTH_RATE_LIMIT_REQUESTS: int = 10
    AUTH_RATE_LIMIT_WINDOW_SECONDS: int = 60

    # ── Monitoring ────────────────────────────────────────────────────────────
    SENTRY_DSN: str = ""
    PROMETHEUS_METRICS_ENABLED: bool = True

    # ── Feature Flags ─────────────────────────────────────────────────────────
    FEATURE_AI_CHATBOT: bool = True
    FEATURE_BIOMETRIC_LOGIN: bool = True
    FEATURE_DISASTER_MODE: bool = False
    FEATURE_GAMIFICATION: bool = True
    FEATURE_VOICE_ASSISTANT: bool = False
    FEATURE_CARBON_TRACKING: bool = True

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == Environment.PRODUCTION

    @property
    def is_development(self) -> bool:
        return self.APP_ENV == Environment.DEVELOPMENT


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance – call once, reuse everywhere."""
    return Settings()


settings = get_settings()
