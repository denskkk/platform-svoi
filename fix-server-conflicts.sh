#!/bin/bash
# Скрипт для решения конфликтов на сервере при git pull

echo "====================================="
echo "Решение конфликтов Git на сервере"
echo "====================================="

cd /var/www/sviydlyasvoih/platform-svoi

echo ""
echo "1. Сохраняем локальные изменения .env..."
cp .env .env.local.backup
echo "✓ Backup создан: .env.local.backup"

echo ""
echo "2. Удаляем проблемную миграцию (она уже есть в репозитории)..."
if [ -f "prisma/migrations/20251103200601_/migration.sql" ]; then
    rm -f "prisma/migrations/20251103200601_/migration.sql"
    rmdir "prisma/migrations/20251103200601_" 2>/dev/null
    echo "✓ Миграция удалена"
else
    echo "✓ Миграция уже отсутствует"
fi

echo ""
echo "3. Сбрасываем изменения .env из git..."
git checkout -- .env
echo "✓ .env восстановлен из репозитория"

echo ""
echo "4. Получаем последние изменения..."
git pull origin main

if [ $? -eq 0 ]; then
    echo "✓ Git pull успешно выполнен"
    
    echo ""
    echo "5. Восстанавливаем локальные настройки .env..."
    # Копируем важные локальные настройки обратно
    if [ -f ".env.local.backup" ]; then
        echo "⚠ Проверьте .env.local.backup и вручную перенесите нужные настройки в .env"
    fi
    
    echo ""
    echo "6. Пересобираем проект..."
    npm run build
    
    if [ $? -eq 0 ]; then
        echo "✓ Проект успешно собран"
        
        echo ""
        echo "7. Перезапускаем PM2..."
        pm2 restart sviy-web
        
        echo ""
        echo "✓✓✓ Обновление завершено успешно! ✓✓✓"
        echo ""
        echo "Проверьте логи:"
        echo "  pm2 logs sviy-web --lines 30"
        echo ""
        echo "Не забудьте проверить .env.local.backup и перенести нужные настройки!"
    else
        echo "✗ Ошибка при сборке проекта"
        exit 1
    fi
else
    echo "✗ Ошибка при git pull"
    exit 1
fi
