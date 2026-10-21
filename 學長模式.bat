@echo off
chcp 65001 >nul
title 學長模式 - http://公網IP:8080
cd /d "%~dp0"

set "NODE=C:\Program Files\nodejs"
set "PATH=%NODE%;%PATH%"

echo.
echo ========================================
echo   學長模式（像 163.17.21.25:8080）
echo ========================================
echo.

REM 防火牆（會跳出一次「是」）
if exist "%~dp0放行防火牆.vbs" (
    echo 正在設定防火牆（若跳出視窗請按「是」）...
    cscript //nologo "%~dp0放行防火牆.vbs" >nul 2>&1
    timeout /t 2 /nobreak >nul
)

REM 確保網站有 build
if not exist ".next\BUILD_ID" (
    echo 首次使用，正在建置網站（約 1 分鐘）...
    call npm.cmd run build
)

REM 若 3000 沒在跑就啟動
powershell -NoProfile -Command "try { (Invoke-WebRequest -Uri 'http://127.0.0.1:3000/' -UseBasicParsing -TimeoutSec 2).StatusCode | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if errorlevel 1 (
    powershell -NoProfile -Command "try { (Invoke-WebRequest -Uri 'http://127.0.0.1:8080/' -UseBasicParsing -TimeoutSec 2).StatusCode | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
    if errorlevel 1 (
        echo 正在啟動網站...
        start "Portfolio" /min cmd /c "cd /d %~dp0 && set PATH=%NODE%;%PATH% && npm.cmd run start"
        timeout /t 10 /nobreak >nul
    )
)

node scripts\senior-mode.mjs
pause
