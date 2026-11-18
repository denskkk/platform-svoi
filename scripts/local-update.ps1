# Локальне оновлення для тесту (Windows PowerShell). Запуск з кореня проєкту:
#   powershell -ExecutionPolicy Bypass -File scripts\local-update.ps1
# Параметри за потреби: -DbUser postgres -DbName svoi -DbHost localhost -DbPort 5432
param(
  [string]$DbUser = "postgres",
  [string]$DbName = "svoi",
  [string]$DbHost = "localhost",
  [int]$DbPort = 5432
)
$ErrorActionPreference = "Stop"
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
if (-not (Test-Path $psql)) { throw "Не знайдено psql: $psql" }

Write-Host "1/6 Код з гілки feature/social-feed" -ForegroundColor Cyan
git fetch origin
git checkout feature/social-feed
git pull origin feature/social-feed

Write-Host "2/6 Залежності" -ForegroundColor Cyan
npm ci

Write-Host "3/6 Таблиці з prisma/schema.prisma (додає нові, нічого не видаляє)" -ForegroundColor Cyan
npx prisma db push
npx prisma generate

Write-Host "4/6 SQL-міграції з даними (проєкти, налаштування)" -ForegroundColor Cyan
if (-not $env:PGPASSWORD) {
  $sec = Read-Host "Пароль користувача $DbUser бази PostgreSQL" -AsSecureString
  $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))
}
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
  if ($LASTEXITCODE -ne 0) { Write-Host "  ПОМИЛКА у $f (скопіюйте текст вище)" -ForegroundColor Red }
}

Write-Host "5/6 Перевірка збірки (ловить помилки типів)" -ForegroundColor Cyan
npm run build

Write-Host "6/6 Готово. Запуск: npm run start  ->  http://localhost:3000" -ForegroundColor Green
