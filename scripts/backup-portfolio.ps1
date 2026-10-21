# 研究平台自動備份（每日 09:00、21:00）
#
# 備份目的地（本機，可同步至 Google 帳號 s125727277）：
#   D:\Backups\smart-medical-portfolio\s125727277\
#
# 安裝排程（以系統管理員 PowerShell 執行一次）：
#   powershell -ExecutionPolicy Bypass -File scripts\install-backup-schedule.ps1

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$BackupRoot = "D:\Backups\smart-medical-portfolio\s125727277"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$DestDir = Join-Path $BackupRoot $Timestamp
$Archive = Join-Path $BackupRoot "portfolio_$Timestamp.zip"

New-Item -ItemType Directory -Force -Path $BackupRoot | Out-Null
New-Item -ItemType Directory -Force -Path $DestDir | Out-Null

$Include = @(
  "src", "public", "data", "scripts", "prisma", "package.json", "package-lock.json",
  "next.config.ts", "tsconfig.json", "tailwind.config.ts", "postcss.config.mjs",
  "middleware.ts", ".env.example"
)

foreach ($item in $Include) {
  $src = Join-Path $ProjectRoot $item
  if (Test-Path $src) {
    Copy-Item -Path $src -Destination $DestDir -Recurse -Force
  }
}

Compress-Archive -Path "$DestDir\*" -DestinationPath $Archive -Force
Remove-Item -Recurse -Force $DestDir

# 保留最近 10 份 zip
Get-ChildItem $BackupRoot -Filter "portfolio_*.zip" |
  Sort-Object LastWriteTime -Descending |
  Select-Object -Skip 10 |
  ForEach-Object { Remove-Item $_.FullName -Force }

Write-Host "Backup saved: $Archive"
