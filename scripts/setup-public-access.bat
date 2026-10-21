@echo off
chcp 65001 >nul
cd /d "%~dp0.."
set "NODE=C:\Program Files\nodejs"
set "PATH=%NODE%;%PATH%"

for /f %%i in ('powershell -NoProfile -Command "(Invoke-RestMethod 'https://api.ipify.org?format=json').ip"') do set PUBLIC_IP=%%i

echo.
echo ========================================
echo   公網直連資訊 (port 8080)
echo ========================================
echo.
echo 公網 IP: %PUBLIC_IP%
echo 分享網址: http://%PUBLIC_IP%:8080
echo.
echo 同 Wi-Fi: http://192.168.0.103:8080
echo.
echo 若 8080 被占用，路由器可轉發: 外網8080 -^> 內網192.168.0.103:3000
echo 防火牆: 雙擊「放行防火牆.bat」(右鍵以系統管理員執行)
echo.
pause
