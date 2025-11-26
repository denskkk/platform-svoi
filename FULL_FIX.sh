#!/bin/bash

# ПОВНИЙ СКРИПТ ВИПРАВЛЕННЯ
# Виконайте: bash FULL_FIX.sh

set -e  # Зупинити при помилці

echo "=== ШАГ 1: Зупинка PM2 ==="
pm2 stop all || true
pm2 delete all || true
pm2 flush

echo ""
echo "=== ШАГ 2: Оновлення коду ==="
cd /var/www/sviydlyasvoih/platform-svoi
git stash
git pull origin main

echo ""
echo "=== ШАГ 3: Перевірка файлу ==="
echo "Шукаємо balanceUcm в route.ts:"
grep -c "balanceUcm" src/app/api/service-requests/route.ts || echo "НЕ ЗНАЙДЕНО!"
grep -c "ucmBalance" src/app/api/service-requests/route.ts || echo "Старий код не знайдено (добре)"

echo ""
echo "=== ШАГ 4: Повне очищення та білд ==="
rm -rf .next
rm -rf node_modules/.cache
npx prisma generate
npm run build

echo ""
echo "=== ШАГ 5: Перевірка зібраного файлу ==="
ls -lh .next/server/app/api/service-requests/route.js

echo ""
echo "=== ШАГ 6: Запуск PM2 ==="
pm2 start ecosystem.config.js --update-env
pm2 save

echo ""
echo "=== ШАГ 7: Очікування запуску ==="
sleep 5

echo ""
echo "=== ШАГ 8: Перевірка логів ==="
pm2 logs --lines 50 --nostream

echo ""
echo "=== ШАГ 9: Статус ==="
pm2 status

echo ""
echo "✅ ГОТОВО! Перевірте чи немає помилки ucmBalance вище"
