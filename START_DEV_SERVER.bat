@echo off
echo ========================================
echo   Sophia Prep - Starting Dev Server
echo ========================================
echo.
echo This will start the Vite dev server...
echo Keep this window open while developing.
echo.
echo Press Ctrl+C to stop the server.
echo ========================================
echo.

cd /d "%~dp0"
npm run dev

pause

