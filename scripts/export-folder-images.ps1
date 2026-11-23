# Export ALL site pictures set on localhost (folder pictures + project banners) so they can be imported on the VPS.
# Only files that are really referenced in the database are packed; demo seed files (seed_*) are skipped on purpose.
# Run from the project root:  powershell -ExecutionPolicy Bypass -File scripts\export-folder-images.ps1
# Optional: -DbUser postgres -DbName svoi -DbHost localhost -DbPort 5432
# Result: folder-images-export.zip (uploads + folder_images.sql + files.txt). NOTE: ASCII only on purpose.
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
$projectDir = (Get-Location).Path

# Uploads folder: UPLOADS_DIR from .env / .env.local, otherwise public\uploads
$uploads = Join-Path $projectDir "public\uploads"
foreach ($f in @(".env.local", ".env")) {
  $p = Join-Path $projectDir $f
  if (Test-Path $p) {
    $m = Select-String -Path $p -Pattern '^\s*UPLOADS_DIR\s*=\s*"?([^"\r\n]+)"?' | Select-Object -First 1
    if ($m) { $uploads = $m.Matches[0].Groups[1].Value.Trim(); break }
  }
}
Write-Host "Uploads folder: $uploads"

$out = Join-Path $projectDir "folder-images-export"
if (Test-Path $out) { Remove-Item $out -Recurse -Force }
New-Item -ItemType Directory -Force -Path $out | Out-Null

function Q($sql) {
  $r = & $psql -U $DbUser -h $DbHost -p $DbPort -d $DbName -t -A -c $sql
  if ($LASTEXITCODE -ne 0) { throw "psql failed" }
  return @($r | Where-Object { $_ -and $_.Trim() })
}

# 1) SQL for folder pictures and project banners (skip seed placeholders)
$sqlFolders = "SELECT format('INSERT INTO folder_images (project, path, image_url, updated_at) VALUES (%L,%L,%L,NOW()) ON CONFLICT (project, path) DO UPDATE SET image_url = EXCLUDED.image_url, updated_at = NOW();', project, path, image_url) FROM folder_images WHERE image_url NOT LIKE '%/seed\_%' ORDER BY project, path;"
$sqlBanners = "SELECT format('UPDATE projects SET banner_url = %L WHERE slug = %L;', banner_url, slug) FROM projects WHERE banner_url LIKE '/uploads/%' AND banner_url NOT LIKE '%/seed\_%' ORDER BY slug;"
$lines = @()
$lines += Q $sqlFolders
$folderCount = $lines.Count
$lines += Q $sqlBanners
$bannerCount = $lines.Count - $folderCount
[IO.File]::WriteAllLines((Join-Path $out "folder_images.sql"), $lines, (New-Object Text.UTF8Encoding($false)))
Write-Host "Folder pictures in database: $folderCount, project banners: $bannerCount" -ForegroundColor Green

# 2) Copy exactly the referenced files
$urls = @()
$urls += Q "SELECT image_url FROM folder_images WHERE image_url NOT LIKE '%/seed\_%';"
$urls += Q "SELECT banner_url FROM projects WHERE banner_url LIKE '/uploads/%' AND banner_url NOT LIKE '%/seed\_%';"
$urls = $urls | Where-Object { $_ -like "/uploads/*" } | Sort-Object -Unique
$copied = 0; $missing = @()
foreach ($u in $urls) {
  $rel = $u.Substring("/uploads/".Length).Replace("/", "\")
  $src = Join-Path $uploads $rel
  if (Test-Path $src) {
    $dst = Join-Path $out ("uploads\" + $rel)
    New-Item -ItemType Directory -Force -Path (Split-Path $dst -Parent) | Out-Null
    Copy-Item $src $dst -Force
    $copied++
  } else { $missing += $u }
}
[IO.File]::WriteAllLines((Join-Path $out "files.txt"), @($urls), (New-Object Text.UTF8Encoding($false)))
Write-Host "Files copied: $copied of $($urls.Count)" -ForegroundColor Green
if ($missing.Count -gt 0) {
  Write-Host "MISSING on disk: $($missing.Count) (their records will point to nothing on the VPS). First ones:" -ForegroundColor Red
  $missing | Select-Object -First 10 | ForEach-Object { Write-Host "  $_" }
  Write-Host "Run: npx tsx scripts/clean-broken-images.ts  and  npx tsx scripts/fill-folder-images.ts  - then export again." -ForegroundColor Yellow
}

$zip = Join-Path $projectDir "folder-images-export.zip"
if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path (Join-Path $out "*") -DestinationPath $zip
Write-Host "Ready: $zip ($([math]::Round((Get-Item $zip).Length / 1MB, 1)) MB)" -ForegroundColor Green
