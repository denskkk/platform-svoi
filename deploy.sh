#!/bin/bash

# ============================================
# СКРИПТ БЫСТРОГО ДЕПЛОЯ
# ============================================
# Использование: ./deploy.sh
# Убедитесь, что скрипт исполняемый: chmod +x deploy.sh

set -e  # Остановить при ошибке

echo "🚀 Начинаем деплой Свій для Своїх..."
echo ""

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Функция вывода шагов
step() {
    echo -e "${GREEN}➜ $1${NC}"
}

# Функция вывода предупреждений
warn() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Функция вывода ошибок
error() {
    echo -e "${RED}✗ $1${NC}"
}

# Проверка, что мы в правильной директории
if [ ! -f "package.json" ]; then
    error "Файл package.json не найден. Запустите скрипт из корня проекта."
    exit 1
fi

# 1. Git pull (если используете Git)
if [ -d ".git" ]; then
    step "Получение последних изменений из Git..."
    git pull
else
    warn "Git репозиторий не найден. Пропускаем git pull."
fi

# 2. Установка зависимостей
step "Установка зависимостей..."
npm ci

# 3. Проверка .env файла
if [ ! -f ".env" ]; then
    error ".env файл не найден!"
    echo "Создайте .env файл на основе .env.production.example"
    exit 1
fi

# 4. Prisma миграции
step "Применение миграций базы данных..."
npx prisma generate
npx prisma migrate deploy

# 5. Сборка проекта
step "Сборка production версии..."
npm run build

# 6. Перезапуск PM2
if command -v pm2 &> /dev/null; then
    step "Перезапуск приложения через PM2..."
    
    # Проверить, запущено ли приложение
    if pm2 list | grep -q "sviy-web"; then
        pm2 restart sviy-web
    else
        warn "Приложение не найдено в PM2. Запускаем..."
        pm2 start npm --name "sviy-web" -- start
        pm2 save
    fi
    
    # Показать статус
    echo ""
    pm2 status
    
    # Показать последние логи
    echo ""
    step "Последние логи приложения:"
    pm2 logs sviy-web --lines 20 --nostream
else
    error "PM2 не установлен. Установите: sudo npm i -g pm2"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Деплой завершён успешно!${NC}"
echo ""
echo "Проверьте сайт: https://sviydlyasvoih.com.ua"
echo ""
echo "Полезные команды:"
echo "  pm2 logs sviy-web       - Просмотр логов"
echo "  pm2 monit               - Мониторинг ресурсов"
echo "  pm2 restart sviy-web    - Перезапуск приложения"
