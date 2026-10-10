@echo off
title Push Health Copilot to GitHub - vissaGunavardhan
color 0B
echo ========================================================
echo   PUSH TO YOUR PERSONAL GITHUB: vissaGunavardhan
echo ========================================================
echo.
echo Make sure you have created the repository on GitHub:
echo   URL: https://github.com/new
echo   Repository Name: Health---Copilot
echo   (Leave it empty, do NOT check Initialize with README)
echo.
echo Press any key when ready to push...
pause >nul

echo.
echo [*] Updating git remote to: https://github.com/vissaGunavardhan/Health--Copilot.git
git remote set-url origin https://github.com/vissaGunavardhan/Health--Copilot.git

echo [*] Pushing latest code to your GitHub account...
git push -u origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo   [SUCCESS] Your project is live at:
    echo   https://github.com/vissaGunavardhan/Health--Copilot
    echo ========================================================
) else (
    echo [!] Push failed or authentication required.
    echo If a GitHub login window popped up, please complete the sign-in.
)
echo.
pause
