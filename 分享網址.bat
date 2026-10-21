@echo off
chcp 65001 >nul
title 作品集 - 產生公開網址
cd /d "%~dp0"

set "NODE=C:\Program Files\nodejs"
set "PATH=%NODE%;%PATH%"

if not exist "scripts\cloudflared.exe" (
    echo 首次使用，正在下載分享工具...
    powershell -NoProfile -Command "Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile 'scripts\cloudflared.exe' -UseBasicParsing"
)

echo.
echo ========================================
echo   作品集公開分享（複製網址給別人即可）
echo ========================================
echo.

powershell -NoProfile -Command "try { (Invoke-WebRequest -Uri 'http://127.0.0.1:3000/' -UseBasicParsing -TimeoutSec 2).StatusCode | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if errorlevel 1 (
    echo 正在啟動網站...
    start "Portfolio" /min cmd /c "cd /d %~dp0 && set PATH=%NODE%;%PATH% && npm.cmd run start"
    echo 等待啟動中...
    timeout /t 12 /nobreak >nul
)

node scripts\share-public.mjs
pause
