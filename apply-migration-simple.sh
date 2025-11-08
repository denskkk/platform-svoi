#!/bin/bash

# Скрипт для застосування міграції (без psql, використовує Node.js)
# Запуск: bash apply-migration-simple.sh

echo "🚀 Starting migration..."

# Переходимо в директорію проєкту
cd /var/www/sviydlyasvoih/platform-svoi

# Підтягуємо останні зміни
echo "📥 Pulling latest changes..."
git pull origin main

# Застосовуємо міграцію через Prisma
echo "📝 Applying database migration..."
npx prisma db push --accept-data-loss

# Оновлюємо категорії через Node.js скрипт
echo "📝 Updating categories..."
node scripts/update-categories.js

# Генеруємо Prisma Client
echo "🔄 Generating Prisma Client..."
npx prisma generate

# Білдимо проєкт
echo "🔨 Building project..."
npm run build

# Перезапускаємо додаток
echo "♻️ Restarting application..."
pm2 restart sviy-web

echo ""
echo "✅ Migration completed successfully!"
echo "🌐 Application restarted and ready"
