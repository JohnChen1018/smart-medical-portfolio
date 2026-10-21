# 一鍵分享作品集：同 Wi-Fi + 外網遠端
# 用法（PowerShell）：
#   1) 先開一個終端跑： npm run start
#   2) 再開此腳本：     .\scripts\share-site.ps1
# 若同 Wi-Fi 仍連不上，請「以系統管理員」執行一次： .\scripts\share-site.ps1 -OpenFirewall

param(
    [switch]$OpenFirewall
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $projectRoot

function Get-LanIp {
    $ip = Get-NetIPAddress -AddressFamily IPv4 |
        Where-Object {
            $_.IPAddress -notlike "127.*" -and
            $_.IPAddress -notlike "169.254.*" -and
            $_.PrefixOrigin -ne "WellKnown"
        } |
        Sort-Object InterfaceMetric |
        Select-Object -First 1 -ExpandProperty IPAddress
    if (-not $ip) { $ip = "127.0.0.1" }
    return $ip
}

function Test-Port3000 {
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:3000/" -UseBasicParsing -TimeoutSec 5
        return $r.StatusCode -eq 200
    } catch {
        return $false
    }
}

if (-not (Test-Port3000)) {
    Write-Host ""
    Write-Host "尚未偵測到本機 :3000 網站。" -ForegroundColor Yellow
    Write-Host "請先在另一個終端執行：" -ForegroundColor Yellow
    Write-Host "  cd $projectRoot" -ForegroundColor Cyan
    Write-Host "  npm run build" -ForegroundColor Cyan
    Write-Host "  npm run start" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

$lanIp = Get-LanIp
Write-Host ""
Write-Host "=== 同 Wi-Fi 分享（區域網路）===" -ForegroundColor Green
Write-Host "首頁：     http://${lanIp}:3000" -ForegroundColor Cyan
Write-Host "WSI 儀表板： http://${lanIp}:3000/projects/whole-slide-object-detection" -ForegroundColor Cyan
Write-Host ""
Write-Host "對方需與你連同一個 Wi-Fi，手機/筆電瀏覽器直接開上述網址。" -ForegroundColor Gray

if ($OpenFirewall) {
    Write-Host ""
    Write-Host "正在新增防火牆規則（需系統管理員）..." -ForegroundColor Yellow
    netsh advfirewall firewall delete rule name="Smart Medical Portfolio 3000" 2>$null | Out-Null
    netsh advfirewall firewall add rule name="Smart Medical Portfolio 3000" dir=in action=allow protocol=TCP localport=3000 profile=any
    Write-Host "已允許 TCP 3000 連入。" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "若同 Wi-Fi 仍連不上，請「以系統管理員」執行：" -ForegroundColor Yellow
    Write-Host "  .\scripts\share-site.ps1 -OpenFirewall" -ForegroundColor Cyan
}

$cloudflared = Get-Command cloudflared -ErrorAction SilentlyContinue
if ($cloudflared) {
    Write-Host ""
    Write-Host "=== 外網遠端（不同 Wi-Fi / 4G）===" -ForegroundColor Green
    Write-Host "正在啟動 Cloudflare 隧道…（請保持此視窗開啟）" -ForegroundColor Yellow
    Write-Host "出現 https://xxxx.trycloudflare.com 後，把網址傳給對方即可。" -ForegroundColor Gray
    Write-Host ""
    & cloudflared tunnel --url http://127.0.0.1:3000
    exit 0
}

Write-Host ""
Write-Host "=== 外網遠端（不同 Wi-Fi / 4G）===" -ForegroundColor Green
Write-Host "使用 localtunnel 建立公開網址…（請保持此視窗開啟）" -ForegroundColor Yellow
Write-Host "出現 https://xxxx.loca.lt 後，把完整網址傳給對方。" -ForegroundColor Gray
Write-Host ""
Write-Host "WSI 儀表板路徑範例：" -ForegroundColor Gray
Write-Host "  https://xxxx.loca.lt/projects/whole-slide-object-detection" -ForegroundColor DarkGray
Write-Host ""

$nodePath = "C:\Program Files\nodejs"
if (Test-Path $nodePath) { $env:Path = "$nodePath;$env:Path" }
npx -y localtunnel --port 3000
