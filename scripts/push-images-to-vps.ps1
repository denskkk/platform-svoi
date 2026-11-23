# One command: export all pictures from localhost, copy them to the VPS and import them there.
# Needs ssh.exe / scp.exe (built into Windows 10/11). You type the SSH password (or use your SSH key) yourself.
# Usage (from the project root):
#   .\scripts\push-images-to-vps.ps1 -Server "root@YOUR_VPS_IP" -RemotePath "/var/www/platform-svoi"
# Options: -Port 22  -DbUser postgres -DbName svoi -DbHost localhost -DbPort 5432 (local database for the export)
# Run it AFTER the new code is deployed on the VPS (so scripts/import-folder-images.sh exists there).
# NOTE: ASCII only on purpose.
param(
  [Parameter(Mandatory = $true)][string]$Server,
  [Parameter(Mandatory = $true)][string]$RemotePath,
  [int]$Port = 22,
  [string]$DbUser = "postgres",
  [string]$DbName = "svoi",
  [string]$DbHost = "localhost",
  [int]$DbPort = 5432
)
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)
foreach ($c in @("ssh", "scp")) { if (-not (Get-Command $c -ErrorAction SilentlyContinue)) { throw "$c.exe not found (Windows optional feature: OpenSSH Client)" } }

Write-Host "== 1/3 Export from localhost ==" -ForegroundColor Cyan
& "$PSScriptRoot\export-folder-images.ps1" -DbUser $DbUser -DbName $DbName -DbHost $DbHost -DbPort $DbPort
if (-not (Test-Path "folder-images-export.zip")) { throw "export failed" }

Write-Host "== 2/3 Copy to the VPS ($Server) ==" -ForegroundColor Cyan
& scp -P $Port "folder-images-export.zip" "${Server}:/tmp/folder-images-export.zip"
if ($LASTEXITCODE -ne 0) { throw "scp failed - check -Server and your SSH access" }

Write-Host "== 3/3 Import on the VPS ==" -ForegroundColor Cyan
& ssh -p $Port $Server "cd '$RemotePath' && bash scripts/import-folder-images.sh /tmp/folder-images-export.zip && rm -f /tmp/folder-images-export.zip"
if ($LASTEXITCODE -ne 0) { throw "import failed - read the text above (missing files? old code on the VPS?)" }
Write-Host "DONE. Open a few project pages on the site and check the pictures." -ForegroundColor Green
