@echo off
where node >nul 2>nul
if errorlevel 1 (echo Install Node.js 24 or later and reopen this launcher. & pause & exit /b 1)
node "%~dp0windows.cjs" stop
pause
