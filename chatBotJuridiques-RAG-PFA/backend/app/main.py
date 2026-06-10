"""
main.py — FastAPI application factory.

Assembles the app with CORS, all routers, and the startup event
that creates tables in PostgreSQL.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import Base, engine
from app.routers import auth, chats, editor, files, lawyers


# ─────────────────────────────────────────────────────────
# Lifespan: create tables on startup, dispose engine on shutdown
# ─────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    On startup  → create all tables (if they don't exist).
    On shutdown → close the engine connection pool.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


# ─────────────────────────────────────────────────────────
# Application
# ─────────────────────────────────────────────────────────
settings = get_settings()

app = FastAPI(
    title="ChatBot Juridique — RAG API",
    description=(
        "Backend API for the legal AI chatbot platform. "
        "Provides AI-powered legal assistance, document management, "
        "LaTeX generation, and a professional lawyer directory."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS for the React frontend ──────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Include all routers ──────────────────────────────────
app.include_router(auth.router)
app.include_router(chats.router)
app.include_router(files.router)
app.include_router(editor.router)
app.include_router(lawyers.router)


# ── Health check ─────────────────────────────────────────
@app.get("/", tags=["Health"])
async def root():
    """Simple health-check endpoint."""
    return {"status": "ok", "service": "ChatBot Juridique — RAG API"}
