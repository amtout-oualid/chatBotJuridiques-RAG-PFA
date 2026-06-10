@echo off
cd /d "%~dp0backend"
echo ==========================================
echo STARTING LEGAL CHATBOT BACKEND
echo ==========================================
echo.
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
echo.
echo Backend process has stopped.
pause
