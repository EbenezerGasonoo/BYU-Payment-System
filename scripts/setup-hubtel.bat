@echo off
echo ================================================
echo  Hubtel Payment Setup Helper
echo ================================================
echo.

echo This script will help you set up Hubtel payment integration.
echo.
echo You need to add these environment variables:
echo.
echo For LOCAL development (backend/.env file):
echo.
echo HUBTEL_API_ID=GR69OD8
echo HUBTEL_API_KEY=04abf4cbb3c041839c1c3af89c3ebea2
echo HUBTEL_CHECKOUT_URL=https://payproxyapi.hubtel.com/items/initiate
echo BACKEND_URL=http://localhost:3000
echo FRONTEND_URL=http://localhost:5173
echo.
echo For PRODUCTION (Railway Dashboard):
echo.
echo 1. Go to Railway Dashboard
echo 2. Select your backend service
echo 3. Go to Variables tab
echo 4. Add each variable above
echo.
echo ================================================
echo.
echo Press any key to open the setup guide...
pause >nul

start docs\HUBTEL_SETUP_GUIDE.md

