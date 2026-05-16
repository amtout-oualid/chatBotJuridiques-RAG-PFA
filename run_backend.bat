@echo off
setlocal
echo ====================================================
echo ChatBot Juridique Backend
echo ====================================================

cd /d "%~dp0backend"

where uv >nul 2>&1
if errorlevel 1 (
  echo ERROR: Install uv from https://docs.astral.sh/uv/
  exit /b 1
)

echo Syncing dependencies...
uv sync
if errorlevel 1 exit /b 1

set PORT=8000
set HOST=127.0.0.1

:: If port 8000 is busy, try 8001 and tell the user to update frontend .env
powershell -NoProfile -Command "$c = Get-NetTCPConnection -LocalPort %PORT% -State Listen -ErrorAction SilentlyContinue; if ($c) { exit 1 } else { exit 0 }"
if errorlevel 1 (
  echo.
  echo Port %PORT% is already in use.
  curl -s http://%HOST%:%PORT%/ >nul 2>&1
  if not errorlevel 1 (
    echo The API is ALREADY RUNNING at http://%HOST%:%PORT%/
    echo Open http://%HOST%:%PORT%/docs in your browser. No need to start again.
    echo To restart: close the other terminal running uvicorn, or run:
    echo   taskkill /F /FI "WINDOWTITLE eq uvicorn*"
    exit /b 0
  )
  echo Port busy but API not responding. Trying port 8001...
  set PORT=8001
  echo Update frontend\.env: VITE_API_BASE_URL=http://127.0.0.1:8001
)

echo.
echo Starting http://%HOST%:%PORT%
uv run uvicorn main:app --reload --host %HOST% --port %PORT%
