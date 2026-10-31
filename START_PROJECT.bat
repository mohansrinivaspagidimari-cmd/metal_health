@echo off
title ML LAB

echo Starting ML Lab backend...
start "ML Lab Backend" cmd /k "cd /d %~dp0backend && py -m pip install -r requirements.txt && py app.py"

timeout /t 3 /nobreak >nul

echo Starting ML Lab frontend...
start "ML Lab Frontend" cmd /k "cd /d %~dp0frontend && if not exist node_modules npm install && npm run dev"

timeout /t 8 /nobreak >nul
start http://localhost:5173

echo.
echo ML Lab started. Keep both terminal windows open.
pause
