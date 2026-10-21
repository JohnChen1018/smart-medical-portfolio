@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "NODE=C:\Program Files\nodejs"
set "PATH=%NODE%;%PATH%"

echo.
echo ========================================
echo   Lab 固定網址（跟學長一樣）
echo ========================================
echo.
echo   你的 IP：163.17.21.29
echo   首頁：    http://163.17.21.29:8080
echo   WSI：     http://163.17.21.29:8080/projects/whole-slide-object-detection
echo.
echo   若 163.17.21.29 就是「這台電腦」，請改雙擊：
echo   「在Lab本機啟動.bat」  （不用 SSH）
echo.
echo   ※ 請在「學校筆電」上執行本檔，不要遠端連家裡桌機時跑！
echo.
echo ----------------------------------------
echo   SSH 部署到 Lab 主機 163.17.21.29
echo ----------------------------------------
echo.
echo   注意：要輸入的是「登入 Lab 的帳號名稱」
echo   例如：s12345678 或你的學號
echo   不是輸入 IP！IP 163.17.21.29 已設定好了。
echo.
echo   若在家裡 Wi-Fi，需先連「學校 VPN」才能 SSH 到 Lab。
echo.
set /p LAB_USER="請輸入 Lab SSH 帳號（不是 IP）: "
if "%LAB_USER%"=="" (
    echo 未輸入帳號，已取消。
    pause
    exit /b 1
)
echo %LAB_USER% | findstr /R "^[0-9][0-9]*\.[0-9]" >nul && (
    echo.
    echo [錯誤] 你輸入的是 IP 位址，不是 SSH 帳號！
    echo 請問學長或系上：登入 163.17.21.29 的帳號叫什麼？
    pause
    exit /b 1
)

echo.
echo 正在部署到 %LAB_USER%@163.17.21.29 ...
node scripts\deploy-lab.mjs %LAB_USER%
pause
