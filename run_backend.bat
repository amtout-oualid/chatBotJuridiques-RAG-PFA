@echo off
echo ====================================================
echo Starting ChatBot Juridique Backend
echo ====================================================

cd backend

:: Use "uv run" to automatically use the virtual environment
:: without needing to manually activate it first.
uv run uvicorn main:app --reload --host 127.0.0.1 --port 8000
