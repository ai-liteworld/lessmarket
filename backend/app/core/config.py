"""
Central application settings, loaded from environment variables.
See .env.example at the repo root for the full list of required variables
(spec section 9.3).
"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- Core ---
    ENVIRONMENT: str = "development"
    JWT_SECRET: str = "change-me"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7

    # --- Database / cache ---
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/marketplace"
    REDIS_URL: str = "redis://localhost:6379/0"

    # --- LLM provider ---
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"
    LLM_REQUEST_TIMEOUT_SECONDS: int = 15

    # --- Storage ---
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"
    S3_BUCKET_NAME: str = "marketplace-images"
    CLOUDINARY_URL: str = ""

    # --- Caching TTLs (spec 4.4) ---
    SCHEMA_CACHE_TTL_HOURS: int = 24
    SEARCH_CACHE_TTL_SECONDS: int = 300

    # --- Background learning (spec 5) ---
    SPEC_PROMOTION_THRESHOLD: float = 0.10  # promote a field used in >10% of ads


@lru_cache
def get_settings() -> Settings:
    return Settings()
