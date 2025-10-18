@echo off
color 0A
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║  BYU Payment System - Internet Exposure with Ngrok         ║
echo ╔════════════════════════════════════════════════════════════╝
echo.
echo Checking for ngrok...
echo.

if exist ngrok.exe (
    echo ✅ Ngrok found!
    echo.
    echo Starting tunnel on port 5173...
    echo.
    echo ════════════════════════════════════════════════════════════
    echo  SHARE THE URL THAT APPEARS BELOW:
    echo ════════════════════════════════════════════════════════════
    echo.
    ngrok http 5175
) else (
    echo ❌ Ngrok not found in this folder!
    echo.
    echo 📥 Please download ngrok:
    echo    1. Go to: https://ngrok.com/download
    echo    2. Download for Windows
    echo    3. Extract ngrok.exe to this folder:
    echo       I:\Projects\BYU Payment System\
    echo    4. Run this script again
    echo.
    echo 🔑 Then setup authtoken:
    echo    1. Sign up: https://dashboard.ngrok.com/signup
    echo    2. Get token: https://dashboard.ngrok.com/get-started/your-authtoken
    echo    3. Run: ngrok config add-authtoken YOUR_TOKEN
    echo.
    pause
)

