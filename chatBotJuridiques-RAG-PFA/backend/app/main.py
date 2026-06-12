"""
main.py — FastAPI application factory.

Assembles the app with CORS, all routers, and the startup event
that creates tables in PostgreSQL.
"""

import time
import uuid
import traceback
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import Base, engine
from app.routers import auth, chats, editor, files, lawyers
from app.logger import app_logger, request_id_var


# ─────────────────────────────────────────────────────────
# Lifespan: create tables on startup, dispose engine on shutdown
# ─────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    On startup  → create all tables (if they don't exist).
    On shutdown → close the engine connection pool.
    """
    app_logger.info("Application starting up: Creating database tables.")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    app_logger.info("Application shutting down: Disposing database connection pool.")
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

# ── Logging Middleware ───────────────────────────────────
@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    # Set correlation ID for the request
    req_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    token = request_id_var.set(req_id)
    
    start_time = time.perf_counter()
    app_logger.info(f"Incoming Request: {request.method} {request.url.path}", extra={
        "method": request.method,
        "path": request.url.path,
        "client_ip": request.client.host if request.client else "unknown"
    })
    
    try:
        response = await call_next(request)
        process_time_ms = (time.perf_counter() - start_time) * 1000
        app_logger.info(f"Outgoing Response: {request.method} {request.url.path} - Status: {response.status_code}", extra={
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_ms": round(process_time_ms, 2)
        })
        return response
    except Exception as exc:
        process_time_ms = (time.perf_counter() - start_time) * 1000
        app_logger.error(f"Unhandled Exception: {str(exc)}", extra={
            "method": request.method,
            "path": request.url.path,
            "status_code": 500,
            "duration_ms": round(process_time_ms, 2),
            "traceback": traceback.format_exc()
        }, exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal Server Error"}
        )
    finally:
        request_id_var.reset(token)

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
