@echo off
echo.
echo ========================================
echo   PRODUCTION DEPLOYMENT TESTER
echo ========================================
echo.
echo This will test your Railway + Vercel deployment
echo.
echo Please provide your URLs:
echo.
set /p BACKEND_URL="Enter your Railway backend URL (e.g., https://byu.up.railway.app): "
set /p FRONTEND_URL="Enter your Vercel frontend URL (e.g., https://byu.vercel.app): "
echo.
echo Testing with:
echo Backend:  %BACKEND_URL%
echo Frontend: %FRONTEND_URL%
echo.
pause
echo.
echo Running tests...
echo.
node test-production-endpoints.js %BACKEND_URL% %FRONTEND_URL%
echo.
pause

