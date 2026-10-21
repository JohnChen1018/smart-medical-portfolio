@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "NODE=C:\Program Files\nodejs"
set "PATH=%NODE%;%PATH%"

echo.
echo ========================================
echo   筆電先準備（在家做，帶去學校用）
echo ========================================
echo.
echo 這台是筆電的話，現在就可以準備好。
echo 之後在家用桌機改程式，到學校再從筆電部署到 Lab。
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo [X] 尚未安裝 Node.js
    echo     請到 https://nodejs.org 下載 LTS 版安裝後再執行本檔
    pause
    exit /b 1
)
echo [OK] Node.js
node -v

if not exist "scripts\deploy-lab.mjs" (
    echo [X] 找不到專案，請先把專案複製到這台筆電
    pause
    exit /b 1
)
echo [OK] 專案檔案

echo.
set /p SSH_USER=請輸入 Lab SSH 帳號（問學長，先記在這裡）: 
if "%SSH_USER%"=="" (
    echo 略過，之後部署時再輸入也可以
) else (
    if not exist .env (
        echo LAB_SSH_USER=%SSH_USER%> .env
    ) else (
        findstr /v /b "LAB_SSH_USER=" .env > .env.tmp
        echo LAB_SSH_USER=%SSH_USER%>> .env.tmp
        move /y .env.tmp .env >nul
    )
    echo [OK] 已記住 SSH 帳號：%SSH_USER%
)

echo.
echo ----------------------------------------
echo 準備完成。之後流程：
echo   在家：桌機改程式 → 執行「同步到筆電.bat」
echo   在學校：筆電雙擊「部署到Lab.bat」
echo ----------------------------------------
echo.
pause
