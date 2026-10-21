# Public access setup (like http://163.17.21.25:8080)
# Usage: npm run public | npm run public:firewall (as Admin)

param(
    [switch]$OpenFirewall,
    [int]$Port = 8080
)

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
    if (-not $ip) { return "192.168.0.103" }
    return $ip
}

function Get-PublicIp {
    try {
        return (Invoke-RestMethod -Uri "https://api.ipify.org?format=json" -TimeoutSec 10).ip
    } catch {
        return $null
    }
}

function Test-PortListening([int]$p) {
    $line = netstat -ano | Select-String "LISTENING" | Select-String ":$p\s"
    return [bool]$line
}

function Get-PortOwner([int]$p) {
    $match = netstat -ano | Select-String "LISTENING" | Select-String ":$p\s" | Select-Object -First 1
    if (-not $match) { return $null }
    $processId = ($match -replace '\s+', ' ').Trim().Split(' ')[-1]
    if ($processId -match '^\d+$') {
        $proc = Get-Process -Id ([int]$processId) -ErrorAction SilentlyContinue
        if ($proc) { return "$($proc.ProcessName) (PID $processId)" }
        return "PID $processId"
    }
    return $null
}

$lanIp = Get-LanIp
$publicIp = Get-PublicIp
$portInUse = Test-PortListening $Port
$portOwner = if ($portInUse) { Get-PortOwner $Port } else { $null }

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Public IP direct access (port $Port)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($publicIp) {
    Write-Host "Public IP:   $publicIp" -ForegroundColor Green
    Write-Host "Share URL:   http://${publicIp}:$Port" -ForegroundColor Yellow
    Write-Host "WSI:         http://${publicIp}:$Port/projects/whole-slide-object-detection" -ForegroundColor Yellow
} else {
    Write-Host "Cannot get public IP. Try again later." -ForegroundColor Red
}

Write-Host ""
Write-Host "LAN test:    http://${lanIp}:$Port" -ForegroundColor Gray
Write-Host ""

if ($portInUse) {
    Write-Host "WARNING: port $Port is in use -> $portOwner" -ForegroundColor Red
    Write-Host "Stop that program first, then run: npm run start:public" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "Port $Port is free." -ForegroundColor Green
    Write-Host "In another terminal run:" -ForegroundColor Gray
    Write-Host "  npm run build" -ForegroundColor Cyan
    Write-Host "  npm run start:public" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "--- How senior setup differs ---" -ForegroundColor Magenta
Write-Host "163.17.21.25 is likely a school lab server with a real public IP." -ForegroundColor Gray
Write-Host "At home you need router port forwarding:" -ForegroundColor Gray
Write-Host ""
Write-Host "  1. Open router admin (often 192.168.0.1 or 192.168.1.1)" -ForegroundColor White
Write-Host "  2. Find Port Forwarding / Virtual Server / NAT" -ForegroundColor White
Write-Host "  3. Add rule: external $Port -> $lanIp : $Port (TCP)" -ForegroundColor Cyan
Write-Host "  4. Test on phone 4G: http://${publicIp}:$Port" -ForegroundColor White
Write-Host ""
Write-Host "If 4G still fails, ISP may use CGNAT. Ask lab for a server IP," -ForegroundColor Yellow
Write-Host "or use: npm run share (tunnel URL)." -ForegroundColor Yellow
Write-Host ""

if ($OpenFirewall) {
    Write-Host "Opening Windows Firewall..." -ForegroundColor Yellow
    netsh advfirewall firewall delete rule name="Smart Medical Portfolio 8080" 2>$null | Out-Null
    netsh advfirewall firewall delete rule name="Smart Medical Portfolio 3000" 2>$null | Out-Null
    netsh advfirewall firewall add rule name="Smart Medical Portfolio 8080" dir=in action=allow protocol=TCP localport=$Port profile=any
    netsh advfirewall firewall add rule name="Smart Medical Portfolio 3000" dir=in action=allow protocol=TCP localport=3000 profile=any
    Write-Host "Firewall rules added for TCP $Port and 3000." -ForegroundColor Green
} else {
    Write-Host "Run as Administrator once:" -ForegroundColor Yellow
    Write-Host "  npm run public:firewall" -ForegroundColor Cyan
    Write-Host ""
}
