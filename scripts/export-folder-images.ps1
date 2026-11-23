# Export folder pictures set in the admin (localhost) so they can be imported on the VPS.
# Run from the project root:  powershell -ExecutionPolicy Bypass -File scripts\export-folder-images.ps1
# Optional: -DbUser postgres -DbName svoi -DbHost localhost -DbPort 5432
# Result: folder-images-export.zip (uploads + folder_images.sql). NOTE: ASCII only on purpose.
param(
  [string]$DbUser = "postgres",
  [string]$DbName = "svoi",
  [string]$DbHost = "localhost",
  [int]$DbPort = 5432
)
$ErrorActionPreference = "Stop"
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
if (-not (Test-Path $psql)) { throw "psql not found: $psql" }
if (-not $env:PGPASSWORD) {
  $sec = Read-Host "Password of PostgreSQL user $DbUser" -AsSecureString
  $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))
}
$env:PGCLIENTENCODING = "UTF8"
$out = Join-Path (Get-Location) "folder-images-export"
if (Test-Path $out) { Remove-Item $out -Recurse -Force }
New-Item -ItemType Directory -Force -Path $out | Out-Null

$sql = "SELECT format('INSERT INTO folder_images (project, path, image_url, updated_at) VALUES (%L,%L,%L,NOW()) ON CONFLICT (project, path) DO UPDATE SET image_url = EXCLUDED.image_url, updated_at = NOW();', project, path, image_url) FROM folder_images ORDER BY project, path;"
$lines = & $psql -U $DbUser -h $DbHost -p $DbPort -d $DbName -t -A -c $sql
if ($LASTEXITCODE -ne 0) { throw "psql failed" }
[IO.File]::WriteAllLines((Join-Path $out "folder_images.sql"), $lines, (New-Object Text.UTF8Encoding($false)))
Write-Host ("Pictures in database: " + @($lines | Where-Object { $_ }).Count) -ForegroundColor Green

foreach ($d in @("misc", "banners")) {
  $src = Join-Path (Get-Location) ("public\uploads\" + $d)
  if (Test-Path $src) { robocopy $src (Join-Path $out ("uploads\" + $d)) /E /NFL /NDL /NJH /NJS | Out-Null }
}
$zip = Join-Path (Get-Location) "folder-images-export.zip"
if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path (Join-Path $out "*") -DestinationPath $zip
Write-Host "Ready: $zip" -ForegroundColor Green
