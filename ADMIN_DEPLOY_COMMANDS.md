# Команди для розгортання розширеної адмін-панелі на VPS

# 1. Перейти до директорії проєкту
cd /var/www/sviydlyasvoyikh/platform-svoy#

# 2. Витягнути зміни з Git
git pull origin main

# 3. Застосувати SQL міграцію для ucm_verified
PGPASSWORD=postgres psql -U postgres -d sviydlyasvoyikh -f database/migrations/20251125_add_ucm_verified.sql

# 4. Регенерувати Prisma Client
npx prisma generate

# 5. Перебудувати Next.js проєкт
npm run build

# 6. Перезапустити PM2
pm2 restart sviy-web

# 7. Перевірити статус
pm2 status

# 8. Перевірити логи (якщо потрібно)
pm2 logs sviy-web --lines 50

# =====================================================
# Альтернативний варіант (якщо є помилки з Prisma)
# =====================================================

# Якщо npx prisma generate видає помилки з enum, застосувати вручну:
PGPASSWORD=postgres psql -U postgres -d sviydlyasvoyikh

# В psql консолі:
# ALTER TABLE users ADD COLUMN IF NOT EXISTS ucm_verified BOOLEAN DEFAULT false;
# CREATE INDEX IF NOT EXISTS idx_users_ucm_verified ON users(ucm_verified) WHERE ucm_verified = true;
# \q

# Потім знову:
npx prisma generate
npm run build
pm2 restart sviy-web

# =====================================================
# НОВІ ФІЧІ АДМІН-ПАНЕЛІ
# =====================================================

# 1. Автономна адмін-панель без навігації на головну
# 2. API для видачі УЦМ: POST /api/admin/grant-ucm
# 3. API для читання всіх переписок: GET /api/admin/messages
# 4. API для встановлення статусу "Перевірено УЦМ": PATCH /api/admin/users/[id]/verify
# 5. Сторінка управління користувачами: /admin/users-manage
# 6. Сторінка читання всіх повідомлень: /admin/messages
# 7. Поле ucm_verified в БД для верифікації користувачів

# =====================================================
# ТЕСТУВАННЯ
# =====================================================

# Після розгортання протестуйте:
# 1. Вхід як admin@gmail.com / sviyadmin1354
# 2. Перехід на /admin - має відкритися панель
# 3. Видача УЦМ користувачу
# 4. Встановлення статусу "Перевірено УЦМ"
# 5. Читання переписок користувачів
