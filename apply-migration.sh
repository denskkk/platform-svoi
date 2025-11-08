#!/bin/bash

# Скрипт для застосування міграції на сервері
# Запуск: bash apply-migration.sh

echo "🚀 Starting migration..."

# Переходимо в директорію проєкту
cd /var/www/sviydlyasvoih/platform-svoi

# Підтягуємо останні зміни
echo "📥 Pulling latest changes..."
git pull origin main

# Застосовуємо міграцію через Prisma
echo "📝 Applying database migration..."
npx prisma db push --accept-data-loss

# Застосовуємо SQL міграції для категорій
echo "📝 Updating categories..."
PGPASSWORD=admin123 psql -h localhost -U admin -d sviydliasvoyikh -f database/migrations/003_update_categories.sql

# Генеруємо Prisma Client
echo "🔄 Generating Prisma Client..."
npx prisma generate

# Білдимо проєкт
echo "🔨 Building project..."
npm run build

# Перезапускаємо додаток
echo "♻️ Restarting application..."
pm2 restart sviy-web

echo "✅ Migration completed successfully!"
echo "🌐 Application restarted and ready"
