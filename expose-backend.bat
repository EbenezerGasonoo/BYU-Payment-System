@echo off
echo ================================================
echo  BYU Virtual Card - Backend Internet Exposure
echo ================================================
echo.
echo Installing localtunnel (if not installed)...
call npm list -g localtunnel >nul 2>&1 || npm install -g localtunnel
echo.
echo ================================================
echo  Starting public tunnel for backend...
echo ================================================
echo.
echo Backend API will be accessible from anywhere!
echo.
echo Keep this window open to maintain the connection.
echo Press Ctrl+C to stop sharing.
echo.
lt --port 3000


