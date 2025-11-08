#!/bin/bash

# Скрипт для очищення всіх користувачів з бази даних на сервері
# УВАГА: Видалить ВСІ користувацькі дані!

echo "⚠️  УВАГА! НЕБЕЗПЕЧНА ОПЕРАЦІЯ! ⚠️"
echo "═══════════════════════════════════════════════════════"
echo "Цей скрипт видалить ВСІ дані користувачів з бази даних!"
echo "Категорії послуг будуть збережені."
echo "═══════════════════════════════════════════════════════"
echo ""
read -p "Ви впевнені? Напишіть YES для підтвердження: " confirm

if [ "$confirm" != "YES" ]; then
    echo "❌ Операція скасована"
    exit 0
fi

echo ""
echo "🗑️  Починаємо очищення бази даних..."
echo ""

# Завантажити змінні з .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Витягти параметри з DATABASE_URL
# Формат: postgresql://user:password@host:port/database
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo "📊 Підключення до бази даних..."
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""

# Виконати SQL скрипт
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/clear_users.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ База даних очищена!"
    echo "🎉 Готово! Тепер можна реєструвати нових користувачів"
    echo ""
else
    echo ""
    echo "❌ Помилка при очищенні бази даних"
    echo "💡 Перевірте DATABASE_URL в .env файлі"
    echo ""
    exit 1
fi
