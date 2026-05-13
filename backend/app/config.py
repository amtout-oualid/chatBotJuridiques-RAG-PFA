"""
config.py — Centralised application settings.

Loads values from the .env file at the backend root using pydantic-settings.
Every module imports `get_settings()` instead of reading os.environ directly.
"""

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application-wide configuration, sourced from environment / .env."""

    # ── Database ─────────────────────────────────────────
    DATABASE_URL: str

    # ── Clerk Authentication ─────────────────────────────
    CLERK_PUBLISHABLE_KEY: str = ""
    CLERK_SECRET_KEY: str = ""
    CLERK_ISSUER: str = ""

    # ── Google Gemini AI ─────────────────────────────────
    GOOGLE_API_KEY: str = ""

    # ── CORS ─────────────────────────────────────────────
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    """Cached singleton — parsed once, reused everywhere."""
    return Settings()
