@echo off
title Health Copilot - Public Browser Link Generator
color 0B
echo ========================================================
echo   HEALTH COPILOT - BROWSER LINKS (THE BROCODE)
echo ========================================================
echo.
echo [1] Local Browser Link (This PC):
echo     👉 http://localhost:5000
echo.
echo [2] Mobile / Wi-Fi Browser Link (Any phone or laptop on same Wi-Fi):
echo     👉 http://192.168.90.53:5000
echo.
echo [3] Global Internet Public HTTPS Link (Pinggy Tunnel):
echo     Connecting secure public gateway...
echo     (You can copy and send the https:// link shown below to anyone!)
echo.
echo ========================================================
echo.
ssh -o StrictHostKeyChecking=no -p 443 -R0:localhost:5000 a.pinggy.io
pause
