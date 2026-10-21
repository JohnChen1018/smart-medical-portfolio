# 建立 Windows 工作排程：每日 09:00、21:00 備份研究平台
$TaskName = "SmartMedicalPortfolio-Backup-s125727277"
$Script = Join-Path $PSScriptRoot "backup-portfolio.ps1"
$Action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$Script`""
$TriggerMorning = New-ScheduledTaskTrigger -Daily -At "09:00"
$TriggerEvening = New-ScheduledTaskTrigger -Daily -At "21:00"
$Settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd

Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $TriggerMorning -Settings $Settings -Force
Register-ScheduledTask -TaskName "${TaskName}-PM" -Action $Action -Trigger $TriggerEvening -Settings $Settings -Force

Write-Host "Scheduled tasks created: $TaskName (09:00) and ${TaskName}-PM (21:00)"
Write-Host "Backups go to: D:\Backups\smart-medical-portfolio\s125727277\"
