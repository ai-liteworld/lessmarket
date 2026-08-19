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
    # Comma-separated list of allowed frontend origins (no trailing slash).
    CORS_ORIGINS: str = "http://localhost:5173,https://ai-liteworld.github.io"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    # --- Database / cache ---
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/marketplace"
    REDIS_URL: str = "redis://localhost:6379/0"

    # --- LLM provider (Hugging Face Inference Providers, OpenAI-compatible) ---
    HF_TOKEN: str = ""
    LLM_MODEL: str = "Qwen/Qwen2.5-7B-Instruct"
    LLM_BASE_URL: str = "https://router.huggingface.co/v1"
    # Free-tier serverless models can have cold-start delays (10-30s), so
    # give this more headroom than a typical OpenAI-style timeout.
    LLM_REQUEST_TIMEOUT_SECONDS: int = 30

    # --- Storage (Cloudinary: signed direct-to-cloud uploads from the browser) ---
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"
    S3_BUCKET_NAME: str = "marketplace-images"
    CLOUDINARY_URL: str = ""
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # --- SMS OTP (Twilio Verify - phone signup activation) ---
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_VERIFY_SERVICE_SID: str = ""
    # When true, skip real Twilio calls and accept a fixed dev code (123456)
    # instead - lets the signup/verify flow be built and tested with zero
    # SMS cost before a Twilio account is wired up.
    SMS_MOCK_MODE: bool = False
    SMS_MOCK_CODE: str = "123456"

    # --- Ad limits ---
    MAX_AD_IMAGES: int = 3

    # --- Caching TTLs (spec 4.4) ---
    SCHEMA_CACHE_TTL_HOURS: int = 24
    SEARCH_CACHE_TTL_SECONDS: int = 300

    # --- Background learning (spec 5) ---
    SPEC_PROMOTION_THRESHOLD: float = 0.10  # promote a field used in >10% of ads


@lru_cache
def get_settings() -> Settings:
    return Settings()
