@echo off
echo ========================================
echo   Killing Process on Port 7351
echo ========================================
echo.

echo Finding process using port 7351...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :7351') do (
    echo Found process ID: %%a
    echo Killing process...
    taskkill /PID %%a /F
)

echo.
echo Done! Port 7351 should now be free.
echo.
pause

