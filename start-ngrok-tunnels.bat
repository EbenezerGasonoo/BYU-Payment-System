@echo off
echo ================================================
echo  BYU Payment System - Ngrok Dual Tunnels
echo ================================================
echo.
echo This will expose BOTH frontend and backend!
echo.
echo Make sure:
echo   - Backend is running on port 3000
echo   - Frontend is running on port 5173
echo   - You've set your ngrok authtoken
echo.
echo ================================================
echo.
echo Starting tunnels...
echo.
.\ngrok start --all --config ngrok.yml

