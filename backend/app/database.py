"""
database.py — Async SQLAlchemy engine, session factory, and Base.

Uses asyncpg as the PostgreSQL driver for true async I/O.
Every route gets a fresh AsyncSession via the `get_db` dependency.
"""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from app.config import get_settings

settings = get_settings()

# ── Engine ───────────────────────────────────────────────
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_size=10,
    max_overflow=20,
)

# ── Session factory ──────────────────────────────────────
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# ── Declarative base for ORM models ─────────────────────
Base = declarative_base()


async def get_db():
    """FastAPI dependency — yields an AsyncSession, auto-closes on exit."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
