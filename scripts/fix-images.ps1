# One-click: repair and fill all project images (folders + project banners) on localhost.
# Usage (PowerShell, from the project folder, e.g. C:\dev\svoi-test):
#   .\scripts\fix-images.ps1 -Key "YOUR_PIXABAY_KEY"
#   .\scripts\fix-images.ps1 -Key "YOUR_PIXABAY_KEY" -Reseed     # + recreate demo people/stories with avatars
#   .\scripts\fix-images.ps1 -Key "YOUR_PIXABAY_KEY" -Force      # also replace working images
# NOTE: ASCII only on purpose.
param(
  [string]$Key = $env:PIXABAY_API_KEY,
  [switch]$Force,
  [switch]$Reseed,   # recreate demo people/stories/posts WITH their image files (fixes missing avatars in stories)
  [string]$Backup = "C:\dev\svoi-uploads-bak"
)
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)
if (-not $Key) { $Key = Read-Host "Pixabay API key" }
if (-not $Key) { Write-Host "No key given." -ForegroundColor Red; exit 1 }
$env:PIXABAY_API_KEY = $Key

Write-Host "== 1/4 Restore old uploads from backup (if any) ==" -ForegroundColor Cyan
if (Test-Path $Backup) {
  New-Item -ItemType Directory -Force -Path "public\uploads" | Out-Null
  Copy-Item "$Backup\*" "public\uploads\" -Recurse -Force
  Write-Host "Restored from $Backup"
} else { Write-Host "No backup folder, skipping." }

if ($Reseed) {
  Write-Host "== 1b Recreate demo data with images (seed) ==" -ForegroundColor Cyan
  npm run db:seed-projects -- --reset
  if ($LASTEXITCODE -ne 0) { Write-Host "Seed failed" -ForegroundColor Red; exit 1 }
}

Write-Host "== 2/4 Remove DB links to missing files ==" -ForegroundColor Cyan
npx tsx scripts/clean-broken-images.ts
if ($LASTEXITCODE -ne 0) { Write-Host "Cleanup failed" -ForegroundColor Red; exit 1 }

Write-Host "== 3/4 Fill project banners and folder images (Pixabay) ==" -ForegroundColor Cyan
$extra = @(); if ($Force) { $extra += "--force" }
npx tsx scripts/fill-folder-images.ts @extra
if ($LASTEXITCODE -ne 0) { Write-Host "Fill stopped (rate limit?). Run this script again - it continues where it stopped." -ForegroundColor Yellow; exit 1 }

Write-Host "== 4/4 Done ==" -ForegroundColor Green
Write-Host "Now restart the app:  npm run start   (then Ctrl+F5 in the browser)"
Write-Host "Check what was chosen: folder-images-report.tsv"
