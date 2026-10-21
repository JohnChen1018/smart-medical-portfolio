@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo ========================================
echo   把最新程式同步到筆電（在家桌機執行）
echo ========================================
echo.
echo 筆電要先接同一個 WiFi，或插隨身碟。
echo.

set /p TARGET=筆電上的專案路徑（例 D:\portfolio 或 E:\portfolio）: 
if "%TARGET%"=="" (
    echo 已取消
    pause
    exit /b 1
)

if not exist "%TARGET%" (
    echo 建立資料夾 %TARGET%
    mkdir "%TARGET%"
)

echo.
echo 同步中（不含 node_modules / .next）...
robocopy "%~dp0" "%TARGET%" /MIR /XD node_modules .next .git /XF portfolio-給筆電部署.tar.gz portfolio-給筆電部署.zip /NFL /NDL /NJH /NJS /nc /ns /np

echo.
echo 完成。筆電資料夾已更新。
echo 到學校後在筆電執行「部署到Lab.bat」即可。
echo.
pause
