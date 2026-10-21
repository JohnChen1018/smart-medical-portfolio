@echo off
chcp 65001 >nul
echo 正在放行 Windows 防火牆 port 3000 與 8080 ...
netsh advfirewall firewall delete rule name="Smart Medical Portfolio 8080" >nul 2>&1
netsh advfirewall firewall delete rule name="Smart Medical Portfolio 3000" >nul 2>&1
netsh advfirewall firewall add rule name="Smart Medical Portfolio 8080" dir=in action=allow protocol=TCP localport=8080 profile=any
netsh advfirewall firewall add rule name="Smart Medical Portfolio 3000" dir=in action=allow protocol=TCP localport=3000 profile=any
if %errorlevel%==0 (
    echo [OK] 防火牆已放行。
) else (
    echo [失敗] 請右鍵此檔案 -^> 以系統管理員身分執行
)
pause
