#!/bin/bash

# Скрипт для застосування міграції (без psql, використовує Node.js)
# Запуск: bash apply-migration-simple.sh

set -e  # Вийти при помилці

echo "🚀 Starting migration..."
echo ""

# Переходимо в директорію проєкту
cd /var/www/sviydlyasvoih/platform-svoi

# Підтягуємо останні зміни
echo "📥 Pulling latest changes..."
git pull origin main
echo ""

# Застосовуємо міграцію через Prisma
echo "📝 Applying database migration..."
npx prisma db push --accept-data-loss
if [ $? -ne 0 ]; then
    echo "❌ Prisma migration failed"
    exit 1
fi
echo ""

# Генеруємо Prisma Client
echo "🔄 Generating Prisma Client..."
npx prisma generate
if [ $? -ne 0 ]; then
    echo "❌ Prisma generate failed"
    exit 1
fi
echo ""

# Оновлюємо категорії через Node.js скрипт
echo "📝 Updating categories..."
node scripts/update-categories.js
if [ $? -ne 0 ]; then
    echo "⚠️  Category update failed, but continuing..."
fi
echo ""

# Очищаємо старий білд
echo "🧹 Cleaning old build..."
rm -rf .next
echo ""

# Білдимо проєкт
echo "🔨 Building project (this may take a few minutes)..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi
echo ""

# Перезапускаємо додаток
echo "♻️ Restarting application..."
pm2 restart sviy-web
if [ $? -ne 0 ]; then
    echo "❌ PM2 restart failed"
    exit 1
fi
echo ""

echo "✅ Migration completed successfully!"
echo "🌐 Application restarted and ready"
echo ""
echo "📊 Check status: pm2 status"
echo "📋 Check logs: pm2 logs sviy-web --lines 50"
