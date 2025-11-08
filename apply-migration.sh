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

# Завантажити змінні з .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Витягти параметри з DATABASE_URL
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

# Застосовуємо SQL міграції для категорій
echo "📝 Updating categories..."
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/migrations/003_update_categories.sql

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
