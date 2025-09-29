@echo off
echo ========================================
echo Visual Programming Compiler Launcher
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

REM Check if we're in the project directory
if not exist "app.py" (
    echo ❌ app.py not found. Make sure you're in the project directory.
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ❌ Failed to create virtual environment
        pause
        exit /b 1
    )
    echo ✅ Virtual environment created
)

REM Activate virtual environment
echo 🔄 Activating virtual environment...
call venv\Scripts\activate
if errorlevel 1 (
    echo ❌ Failed to activate virtual environment
    pause
    exit /b 1
)

REM Install/update requirements
echo 📦 Installing/updating requirements...
pip install -r requirements.txt --quiet
if errorlevel 1 (
    echo ❌ Failed to install requirements
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist ".env" (
    echo ⚠️  .env file not found
    echo Creating sample .env file...
    echo API_KEY=AIzaSyAychocmYlYz-hhxMH-4tTKUjqG9WWwcZg > .env
    echo ✅ Sample .env file created with provided API key
)

echo.
echo 🚀 Starting Visual Programming Compiler...
echo 🌐 Open your browser and go to: http://localhost:5000
echo 🔧 Press Ctrl+C to stop the server
echo.

REM Start the application
python start.py

pause