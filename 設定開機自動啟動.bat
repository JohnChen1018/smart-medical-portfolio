@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo 設定開機自動啟動（請在跳出的視窗按「是」）...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\install-autostart.ps1"
pause
