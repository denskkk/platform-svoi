# Local update for testing (Windows PowerShell). Run from the project root:
#   powershell -ExecutionPolicy Bypass -File scripts\local-update.ps1
# Optional: -DbUser postgres -DbName svoi -DbHost localhost -DbPort 5432
# NOTE: this file is ASCII only on purpose (Windows PowerShell 5 breaks on UTF-8 without BOM).
param(
  [string]$DbUser = "postgres",
  [string]$DbName = "svoi",
  [string]$DbHost = "localhost",
  [int]$DbPort = 5432
)
$ErrorActionPreference = "Stop"
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
if (-not (Test-Path $psql)) { throw "psql not found: $psql" }

Write-Host "1/5 Dependencies" -ForegroundColor Cyan
npm ci

Write-Host "2/5 Tables from prisma/schema.prisma (adds new ones, removes nothing)" -ForegroundColor Cyan
npx prisma db push
npx prisma generate

Write-Host "3/5 SQL migrations with data (projects, settings)" -ForegroundColor Cyan
if (-not $env:PGPASSWORD) {
  $sec = Read-Host "Password of PostgreSQL user $DbUser" -AsSecureString
  $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))
}
$env:PGCLIENTENCODING = "UTF8"   # migrations are UTF-8 (Ukrainian text)
$files = @(
  "20261121_activate_listing_projects.sql",
  "20261132_invites_views_settings.sql",
  "20261133_club_communities.sql",
  "20261134_add_invoices.sql",
  "20261135_project_catalog_client_list.sql",
  "20261136_activate_project_boards.sql",
  "20261137_group_chats.sql",
  "20261138_project_suggestions.sql",
  "20261139_linked_accounts.sql"
)
foreach ($f in $files) {
  Write-Host "  -> $f"
  & $psql -U $DbUser -h $DbHost -p $DbPort -d $DbName -v ON_ERROR_STOP=1 -q -f "database\migrations\$f"
  if ($LASTEXITCODE -ne 0) { Write-Host "  ERROR in $f (copy the text above and send it)" -ForegroundColor Red }
}

Write-Host "4/5 Build (catches type errors)" -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "BUILD FAILED - copy the error text above and send it" -ForegroundColor Red; exit 1 }

Write-Host "5/5 Done. Start: npm run start  ->  http://localhost:3000" -ForegroundColor Green
