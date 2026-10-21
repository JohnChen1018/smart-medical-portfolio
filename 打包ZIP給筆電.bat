@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo 正在用 ZIP 打包（比 tar 穩，適合 Google Drive）...
echo 這會需要幾分鐘，請勿關閉視窗...
echo.

set "OUT=%USERPROFILE%\Desktop\portfolio-給筆電.zip"
if exist "%OUT%" del "%OUT%"

powershell -NoProfile -Command ^
  "$src='%~dp0'; $dst='%OUT%'; $tmp=Join-Path $env:TEMP 'portfolio-pack'; if(Test-Path $tmp){Remove-Item $tmp -Recurse -Force}; New-Item -ItemType Directory -Path $tmp | Out-Null; robocopy $src $tmp /E /XD node_modules .next .git /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null; Compress-Archive -Path (Join-Path $tmp '*') -DestinationPath $dst -Force; Remove-Item $tmp -Recurse -Force; if(Test-Path $dst){Write-Host ('完成，大小 MB: ' + [math]::Round((Get-Item $dst).Length/1MB,1))} else {Write-Host '失敗'; exit 1}"

if errorlevel 1 (
    echo 打包失敗，請改用「複製到資料夾.bat」+ 隨身碟
    pause
    exit /b 1
)

echo.
echo 已建立：桌面\portfolio-給筆電.zip
echo 請上傳「這個 zip」到 Google Drive（不是只上傳 .bat）
echo.
pause
