param(
  [Parameter(Mandatory = $true)]
  [string]$OutFile
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing
Add-Type @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class QpCap {
  public delegate bool EnumProc(IntPtr hWnd, IntPtr lParam);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc lpEnumFunc, IntPtr lParam);
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT r);
  [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr hWnd, IntPtr hdc, uint flags);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
  [StructLayout(LayoutKind.Sequential)]
  public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
}
"@

$procs = Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -like "QuPath*" }
if (-not $procs) { exit 2 }
$pids = @{}
foreach ($proc in $procs) { $pids[$proc.Id] = $true }

$script:handles = New-Object System.Collections.Generic.List[IntPtr]
$callback = [QpCap+EnumProc]{
  param($hWnd, $lParam)
  if (-not [QpCap]::IsWindowVisible($hWnd)) { return $true }
  $windowPid = [uint32]0
  [void][QpCap]::GetWindowThreadProcessId($hWnd, [ref]$windowPid)
  if (-not $pids.ContainsKey([int]$windowPid)) { return $true }
  $title = New-Object System.Text.StringBuilder 512
  [void][QpCap]::GetWindowText($hWnd, $title, $title.Capacity)
  if ($title.Length -lt 1) { return $true }
  $script:handles.Add($hWnd)
  return $true
}

function Get-WindowTitle([IntPtr]$hwnd) {
  $title = New-Object System.Text.StringBuilder 512
  [void][QpCap]::GetWindowText($hwnd, $title, $title.Capacity)
  return $title.ToString()
}

function Send-Key([byte]$key) {
  [QpCap]::keybd_event($key, 0, 0, [UIntPtr]::Zero)
  [QpCap]::keybd_event($key, 0, 2, [UIntPtr]::Zero)
}

function Find-QuPathWindows {
  $script:handles = New-Object System.Collections.Generic.List[IntPtr]
  [void][QpCap]::EnumWindows($callback, [IntPtr]::Zero)
  return @($script:handles)
}

$windows = Find-QuPathWindows
if ($windows.Count -eq 0) { exit 2 }

$dismissed = $false
foreach ($hwnd in $windows) {
  $title = Get-WindowTitle $hwnd
  if ($title -eq "Welcome") {
    [void][QpCap]::SetForegroundWindow($hwnd)
    Start-Sleep -Milliseconds 150
    Send-Key 0x0D
    $dismissed = $true
  } elseif ($title -eq "Extensions") {
    [void][QpCap]::SetForegroundWindow($hwnd)
    Start-Sleep -Milliseconds 150
    Send-Key 0x1B
    $dismissed = $true
  }
}
if ($dismissed) {
  Start-Sleep -Milliseconds 700
  $windows = Find-QuPathWindows
  if ($windows.Count -eq 0) { exit 2 }
}

$script:found = [IntPtr]::Zero
$bestArea = 0
foreach ($hwnd in $windows) {
  $title = Get-WindowTitle $hwnd
  if ($title -eq "Welcome" -or $title -eq "Extensions") { continue }
  $probe = New-Object QpCap+RECT
  [void][QpCap]::GetWindowRect($hwnd, [ref]$probe)
  $area = [Math]::Max(0, $probe.Right - $probe.Left) * [Math]::Max(0, $probe.Bottom - $probe.Top)
  if ($area -gt $bestArea) {
    $bestArea = $area
    $script:found = $hwnd
  }
}
if ($script:found -eq [IntPtr]::Zero) { $script:found = $windows[0] }

if ([QpCap]::IsIconic($script:found)) {
  [void][QpCap]::ShowWindow($script:found, 9)
  Start-Sleep -Milliseconds 300
}

$rect = New-Object QpCap+RECT
[void][QpCap]::GetWindowRect($script:found, [ref]$rect)
$width = $rect.Right - $rect.Left
$height = $rect.Bottom - $rect.Top
if ($width -lt 80 -or $height -lt 80) { exit 3 }

$bitmap = New-Object System.Drawing.Bitmap $width, $height
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$hdc = $graphics.GetHdc()
$printed = [QpCap]::PrintWindow($script:found, $hdc, 2)
$graphics.ReleaseHdc($hdc)
if (-not $printed) {
  $graphics.CopyFromScreen($rect.Left, $rect.Top, 0, 0, (New-Object System.Drawing.Size $width, $height))
}
$graphics.Dispose()
$bitmap.Save($OutFile, [System.Drawing.Imaging.ImageFormat]::Jpeg)
$bitmap.Dispose()
exit 0
