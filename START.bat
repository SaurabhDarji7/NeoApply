@echo off
REM NeoApply - Quick Start Script for Windows
REM This script sets up and starts the entire application

echo.
echo ========================================
echo   NeoApply - Starting Application
echo ========================================
echo.

REM Check if .env file exists
if not exist .env (
    echo [ERROR] .env file not found!
    echo Please copy .env.example to .env and configure your OpenAI API key
    pause
    exit /b 1
)

REM Check for OpenAI API key
findstr /C:"your-openai-api-key-here" .env >nul
if %errorlevel% equ 0 (
    echo [WARNING] Please add your OpenAI API key to .env file
    echo OPENAI_API_KEY=sk-your-actual-key-here
    echo.
    pause
)

echo [Step 1] Building Docker containers...
docker-compose build

echo.
echo [Step 2] Starting services...
docker-compose up -d

echo.
echo [Step 3] Waiting for database to be ready...
timeout /t 5 /nobreak >nul

echo.
echo [Step 4] Creating database...
docker-compose exec -T backend rails db:create

echo.
echo [Step 5] Running migrations...
docker-compose exec -T backend rails db:migrate

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Services are running at:
echo   - Frontend: http://localhost:5173
echo   - Backend:  http://localhost:3000
echo   - Health:   http://localhost:3000/up
echo.
echo To start the background job worker, open a NEW terminal and run:
echo   docker-compose exec backend bundle exec rails solid_queue:start
echo.
echo To view logs:
echo   docker-compose logs -f
echo.
echo To stop services:
echo   docker-compose down
echo.
pause
