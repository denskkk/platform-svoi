#!/bin/bash

# Быстрый деплой с проверкой ошибок
# Использование: bash quick-deploy.sh

set -e  # Выход при первой ошибке

echo "🚀 БЫСТРЫЙ ДЕПЛОЙ"
echo "======================================"
echo ""

cd /var/www/sviydlyasvoih/platform-svoi || exit 1

echo "📥 1. Обновляем код из репо..."
if git pull origin main; then
  echo "   ✅ Код обновлен"
else
  echo "   ❌ Ошибка при git pull"
  exit 1
fi
echo ""

echo "📦 2. Устанавливаем зависимости..."
if NPM_CONFIG_PRODUCTION=false npm ci; then
  echo "   ✅ Зависимости установлены (включая devDependencies)"
else
  echo "   ❌ Ошибка при npm ci"
  exit 1
fi
echo ""

echo "🔨 3. Проверяем tailwindcss..."
if ls node_modules/tailwindcss > /dev/null 2>&1; then
  echo "   ✅ tailwindcss найден"
else
  echo "   ❌ tailwindcss не найден!"
  exit 1
fi
echo ""

echo "🏗️  4. Собираем проект..."
if npm run build 2>&1 | tee build.log; then
  echo "   ✅ Сборка успешна"
else
  echo "   ❌ Ошибка при сборке"
  echo "   📋 Последние строки build.log:"
  tail -20 build.log
  exit 1
fi
echo ""

echo "🔄 5. Перезагружаем PM2..."
if pm2 reload ecosystem.config.json --update-env; then
  echo "   ✅ PM2 перезагружен"
else
  echo "   ❌ Ошибка при перезагрузке PM2"
  exit 1
fi
echo ""

echo "⏳ Ждем 3 сек чтобы процесс стартовал..."
sleep 3
echo ""

echo "📊 6. Проверяем статус..."
pm2 status
echo ""

echo "📋 7. Первые 20 строк логов..."
pm2 logs sviy-platform --lines 20 --nostream
echo ""

echo "======================================"
echo "✅ Деплой завершен!"
echo "======================================"
echo ""
echo "Команды для проверки:"
echo "  • Логи:        pm2 logs sviy-platform"
echo "  • Диагностика: bash diagnose-issues.sh"
echo "  • Тест API:    bash test-service-request.sh <TOKEN>"
