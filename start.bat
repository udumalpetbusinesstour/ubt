@echo off
title Udumalpet Business Tour (UBT) Startup Desk
echo ==========================================================
echo Starting Udumalpet Business Tour (UBT) Platform Stack...
echo ==========================================================
echo.

echo [1/2] Launching Express API Server...
start "UBT Backend Server" cmd /k "cd backend && npm run dev"

echo [2/2] Launching Vite React Client...
start "UBT Frontend Client" cmd /k "cd frontend && npm run dev"

echo.
echo ==========================================================
echo Both servers have been launched in separate windows:
echo - Frontend SPA Client: http://localhost:3000
echo - Backend Express API: http://localhost:5000
echo ==========================================================
echo.
pause
