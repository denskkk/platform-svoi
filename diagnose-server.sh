#!/bin/bash
# Команды для диагностики и исправления проблемы на сервере

echo "=========================================="
echo "Диагностика проблемы с изображениями"
echo "=========================================="

# 1. Проверяем текущую версию кода
echo ""
echo "1. Текущая версия в Git:"
git log --oneline -3

# 2. Проверяем, есть ли наши изменения
echo ""
echo "2. Проверяем наличие исправлений в коде:"
grep -n "cache: 'no-store'" src/app/profile/\[id\]/page.tsx | head -5

if [ $? -eq 0 ]; then
    echo "✓ Исправления найдены в коде"
else
    echo "✗ Исправления НЕ найдены - нужен git pull"
fi

# 3. Проверяем права на директории uploads
echo ""
echo "3. Проверяем права на uploads:"
ls -la public/uploads/

echo ""
echo "4. Проверяем последние загруженные файлы:"
echo "--- Аватары ---"
ls -lth public/uploads/avatars/ | head -5
echo "--- Услуги ---"
ls -lth public/uploads/services/ | head -5

# 5. Проверяем когда был последний build
echo ""
echo "5. Дата последней сборки:"
ls -ld .next/

echo ""
echo "=========================================="
echo "Если исправления НЕ найдены, выполните:"
echo "=========================================="
echo "cd /var/www/sviydlyasvoih/platform-svoi"
echo "cp .env .env.local.backup"
echo "rm -rf prisma/migrations/20251103200601_/"
echo "git checkout -- .env"
echo "git pull origin main"
echo "# Восстановите настройки из .env.local.backup"
echo "npm run build"
echo "pm2 restart sviy-web"
