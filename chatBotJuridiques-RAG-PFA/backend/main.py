"""
Thin entry point for running the backend with uvicorn.

Usage:
    cd backend
    uvicorn main:app --reload
"""

from app.main import app  # noqa: F401