"""
database.py — Async SQLAlchemy engine, session factory, and Base.

Uses asyncpg as the PostgreSQL driver for true async I/O.
Every route gets a fresh AsyncSession via the `get_db` dependency.
"""

import time
from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from app.config import get_settings
from app.logger import db_logger

settings = get_settings()

# ── Engine ───────────────────────────────────────────────
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,  # detect stale connections before use
)

# ── Database Event Logging ───────────────────────────────
SLOW_QUERY_THRESHOLD_MS = 500

@event.listens_for(engine.sync_engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    conn.info.setdefault("query_start_time", []).append(time.perf_counter())

@event.listens_for(engine.sync_engine, "after_cursor_execute")
def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    start_time = conn.info["query_start_time"].pop(-1)
    duration_ms = (time.perf_counter() - start_time) * 1000
    
    extra = {
        "query": statement,
        "duration_ms": round(duration_ms, 2)
    }
    
    if duration_ms > SLOW_QUERY_THRESHOLD_MS:
        db_logger.warning("Slow database query detected", extra=extra)
    else:
        db_logger.debug("Database query executed", extra=extra)

@event.listens_for(engine.sync_engine, "handle_error")
def handle_error(exception_context):
    db_logger.error(
        f"Database execution error: {exception_context.original_exception}", 
        extra={"query": exception_context.statement},
        exc_info=True
    )

@event.listens_for(engine.sync_engine, "connect")
def connect(dbapi_connection, connection_record):
    db_logger.debug("Database connection established")

@event.listens_for(engine.sync_engine, "checkout")
def checkout(dbapi_connection, connection_record, connection_proxy):
    db_logger.debug("Database connection checked out from pool")

@event.listens_for(engine.sync_engine, "checkin")
def checkin(dbapi_connection, connection_record):
    db_logger.debug("Database connection returned to pool")


# ── Session factory ──────────────────────────────────────
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# ── Declarative base for ORM models ─────────────────────
Base = declarative_base()


async def get_db():
    """
    FastAPI dependency — yields an AsyncSession.

    Automatically rolls back on unhandled exceptions
    to prevent partial commits and connection leaks.
    """
    async with AsyncSessionLocal() as session:
        try:
            db_logger.debug("Session started (Transaction start)")
            yield session
            # Only commit explicitly called in services, but we could log standard lifecycle
            db_logger.debug("Session closed successfully")
        except Exception as e:
            db_logger.error(f"Transaction rollback due to unhandled exception: {e}", exc_info=True)
            await session.rollback()
            raise
        finally:
            await session.close()
