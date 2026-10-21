@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "NODE=C:\Program Files\nodejs"
set "PATH=%NODE%;%PATH%"

REM 等網路就緒
timeout /t 8 /nobreak >nul

powershell -NoProfile -Command "try { (Invoke-WebRequest -Uri 'http://127.0.0.1:3000/' -UseBasicParsing -TimeoutSec 2).StatusCode | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if errorlevel 1 (
    start "Portfolio" /min cmd /c "cd /d %~dp0 && set PATH=%NODE%;%PATH% && npm.cmd run start"
    timeout /t 15 /nobreak >nul
)

if exist "scripts\cloudflared.exe" (
    start "PortfolioTunnel" /min cmd /c "cd /d %~dp0 && node scripts\share-public.mjs"
)
