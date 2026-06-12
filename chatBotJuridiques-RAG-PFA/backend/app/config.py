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

    # ── LaTeXLite ────────────────────────────────────────
    LATEXLITE_API_KEY: str = ""

    # ── RAG Pipeline (System B Integration) ──────────────
    CHROMA_PERSIST_DIR: str = "./chroma_db"
    CHROMA_COLLECTION_NAME: str = "legal_docs_arabic"
    EMBEDDING_MODEL: str = "BAAI/bge-m3"
    EMBEDDING_DEVICE: str = "cpu"
    TOP_K_RETRIEVAL: int = 20
    TOP_K_RERANK: int = 5
    OPENAI_API_KEY: str = ""

    # ── Logging ──────────────────────────────────────────
    LOG_LEVEL: str = "INFO"

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

settings = get_settings()
