@echo off
chcp 65001 >nul
title 在本機啟動 Lab 網站（163.17.21.29:8080）
cd /d "%~dp0"
set "NODE=C:\Program Files\nodejs"
set "PATH=%NODE%;%PATH%"

echo.
echo ========================================
echo   在本機啟動（你的 IP: 163.17.21.29）
echo ========================================
echo.
echo 適用：這台電腦就是 Lab 上、IP 為 163.17.21.29 的那台
echo 分享網址：http://163.17.21.29:8080
echo.

if not exist ".next\BUILD_ID" (
    echo 首次使用，正在建置...
    call npm.cmd run build
    if errorlevel 1 (
        echo 建置失敗
        pause
        exit /b 1
    )
)

echo 啟動網站 port 8080（請保持此視窗開啟）...
echo.
call npm.cmd run start:public
