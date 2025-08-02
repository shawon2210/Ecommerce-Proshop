@echo off
echo Starting ProShop E-commerce Application...
echo.

echo Checking if MongoDB is running...
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ✅ MongoDB is running
) else (
    echo ⚠️  MongoDB not detected - make sure it's installed and running
)

echo.
echo Starting Backend Server (Port 5000)...
start "Backend Server" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak >nul

echo Starting Frontend Server (Port 3002)...
start "Frontend Server" cmd /k "cd frontend && npm start"

echo.
echo 🚀 ProShop is starting up!
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3002
echo.
echo Admin Registration Key: ADMIN2024
echo.
pause