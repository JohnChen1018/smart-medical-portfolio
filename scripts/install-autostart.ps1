# 開機自動啟動網站 + 公開網址（只需執行一次，需系統管理員）
$TaskName = "SmartMedicalPortfolio-Autostart"
$Bat = Join-Path $PSScriptRoot "autostart-portfolio.bat"
$Action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$Bat`""
$Trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Force
Write-Host "已設定開機自動啟動。登出再登入或重開機後生效。"
Write-Host "公開網址會寫入：公開網址.txt"
