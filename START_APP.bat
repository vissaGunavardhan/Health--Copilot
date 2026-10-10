@echo off
title Health Copilot - Represented by The Brocode
color 0A
echo ========================================================
echo   HEALTH COPILOT - REPRESENTED BY THE BROCODE
echo ========================================================
echo.
echo Checking server status on port 5000...
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:5000/api/health' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } } catch { exit 1 }"
if %ERRORLEVEL% EQU 0 (
    echo [*] Server is ALREADY running and healthy!
) else (
    echo [*] Launching Python Flask Backend Server...
    start /B py backend\server.py
    timeout /t 2 /nobreak >nul
)

echo [*] Opening Web Dashboard in default browser...
start http://localhost:5000

echo.
echo ========================================================
echo   READY FOR PRESENTATION / DEMO!
echo   Dashboard URL: http://localhost:5000
echo ========================================================
echo.
pause
