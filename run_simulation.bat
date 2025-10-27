@echo off
echo ========================================
echo Ecosystem Simulation Launcher
echo ========================================
echo.

REM Check if virtual environment exists
if not exist .venv (
    echo ERROR: Virtual environment not found!
    echo Please run: python -m venv .venv
    echo Then: .venv\Scripts\activate
    echo Then: pip install -r requirements.txt
    pause
    exit /b 1
)

REM Activate virtual environment
call .venv\Scripts\activate.bat

REM Check if dependencies are installed
python -c "import PyQt6" 2>nul
if errorlevel 1 (
    echo ERROR: PyQt6 not installed!
    echo Installing dependencies...
    pip install -r requirements.txt
)

echo Starting simulation...
echo.
python main.py

if errorlevel 1 (
    echo.
    echo ERROR: Simulation failed to start!
    echo Check the error messages above.
    pause
)
