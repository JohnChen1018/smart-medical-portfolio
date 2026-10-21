@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo ========================================
echo   複製專案到資料夾（不用 tar，較穩）
echo ========================================
echo.

set "OUT=%USERPROFILE%\Desktop\portfolio-給筆電"
if exist "%OUT%" (
    echo 刪除舊資料夾...
    rmdir /s /q "%OUT%"
)
mkdir "%OUT%"

echo 複製中（不含 node_modules / .next）...
robocopy "%~dp0" "%OUT%" /E /XD node_modules .next .git /NFL /NDL /NJH /NJS /nc /ns /np

echo.
echo 完成！資料夾在桌面：
echo   %OUT%
echo.
echo 下一步：
echo   1. 把整個 portfolio-給筆電 資料夾複製到筆電（隨身碟 / Line）
echo   2. 筆電上放到 D:\portfolio
echo   3. cmd：cd D:\portfolio 然後 npm ci
echo   4. 雙擊「在Lab本機啟動.bat」
echo.
pause
