@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo 正在打包專案（給學校筆電用，不含 node_modules / .next）...
echo.

set "OUT=%TEMP%\portfolio-給筆電部署.tar.gz"
if exist "%OUT%" del "%OUT%"

tar -czf "%OUT%" ^
  --exclude=node_modules ^
  --exclude=.next ^
  --exclude=.git ^
  --exclude=portfolio-給筆電部署.tar.gz ^
  .

if errorlevel 1 (
    echo.
    echo 打包失敗。請改用「複製到資料夾.bat」（不用 tar）
    pause
    exit /b 1
)

set "DESK=%USERPROFILE%\Desktop\portfolio-給筆電部署.tar.gz"
copy /y "%OUT%" "%DESK%" >nul 2>&1
if exist "%DESK%" (
    echo.
    echo 已建立（桌面）：portfolio-給筆電部署.tar.gz
) else (
    echo.
    echo 已建立：%OUT%
)

echo.
echo 下一步（筆電 IP 就是 163.17.21.29，不用 SSH）：
echo   1. 把 tar.gz 複製到筆電並解壓到 D:\portfolio
echo   2. 在筆電 cmd：cd D:\portfolio 然後 npm ci
echo   3. 雙擊「在Lab本機啟動.bat」
echo   4. 分享 http://163.17.21.29:8080
echo.
pause
