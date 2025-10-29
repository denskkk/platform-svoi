# Скрипт для швидкого запуску СВІЙ ДЛЯ СВОЇХ на Windows

Write-Host "🚀 Запуск СВІЙ ДЛЯ СВОЇХ..." -ForegroundColor Green
Write-Host ""

# Крок 1: Перевірка Docker
Write-Host "1️⃣  Перевірка Docker..." -ForegroundColor Cyan
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker знайдено: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker не знайдено! Встановіть Docker Desktop з https://www.docker.com/products/docker-desktop" -ForegroundColor Red
    exit 1
}

# Крок 2: Запуск PostgreSQL
Write-Host ""
Write-Host "2️⃣  Запуск PostgreSQL..." -ForegroundColor Cyan

# Видалити старий контейнер якщо існує
docker rm -f sviy-postgres 2>$null

# Запустити новий контейнер
docker run --name sviy-postgres `
    -e POSTGRES_USER=postgres `
    -e POSTGRES_PASSWORD=postgres `
    -e POSTGRES_DB=sviydliasvoyikh `
    -p 5432:5432 `
    -d postgres:14-alpine

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ PostgreSQL запущено" -ForegroundColor Green
} else {
    Write-Host "❌ Помилка запуску PostgreSQL" -ForegroundColor Red
    exit 1
}

# Почекати поки БД запуститься
Write-Host "⏳ Очікування запуску БД..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Крок 3: Застосувати схему
Write-Host ""
Write-Host "3️⃣  Застосування схеми БД..." -ForegroundColor Cyan
npm run db:generate
npm run db:push

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Схема застосована" -ForegroundColor Green
} else {
    Write-Host "⚠️  Помилка застосування схеми" -ForegroundColor Yellow
}

# Крок 4: Завантажити seed дані
Write-Host ""
Write-Host "4️⃣  Завантаження тестових даних..." -ForegroundColor Cyan

# Копіювати SQL файли в контейнер
docker cp database/seed.sql sviy-postgres:/tmp/seed.sql

# Виконати seed
docker exec sviy-postgres psql -U postgres -d sviydliasvoyikh -f /tmp/seed.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Тестові дані завантажено" -ForegroundColor Green
} else {
    Write-Host "⚠️  Seed дані не завантажено (можливо вже є)" -ForegroundColor Yellow
}

# Крок 5: Запустити Next.js
Write-Host ""
Write-Host "5️⃣  Запуск Next.js сервера..." -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 Готово! Відкрийте браузер:" -ForegroundColor Green
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   API: http://localhost:3000/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 База даних:" -ForegroundColor Yellow
Write-Host "   Host: localhost:5432" -ForegroundColor White
Write-Host "   Database: sviydliasvoyikh" -ForegroundColor White
Write-Host "   User: postgres" -ForegroundColor White
Write-Host "   Password: postgres" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Тестові акаунти:" -ForegroundColor Yellow
Write-Host "   Email: oleksandr.kovalenko@example.com" -ForegroundColor White
Write-Host "   Пароль: password123" -ForegroundColor White
Write-Host ""
Write-Host "Натисніть Ctrl+C для зупинки сервера" -ForegroundColor Gray
Write-Host ""

npm run dev
