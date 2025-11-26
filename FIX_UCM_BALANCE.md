# 🔧 Виправлення помилки ucmBalance

## Проблема
```
Unknown field `ucmBalance` for select statement on model `User`
```

## Причина
В API використовувалось поле `ucmBalance`, але в Prisma schema воно називається `balanceUcm`.

## Виправлення
Оновлено 2 файли:

### 1. `src/app/api/service-requests/route.ts`
- Замінено `ucmBalance` → `balanceUcm` (2 місця)

### 2. `src/app/public-requests/create/page.tsx`
- Замінено `ucmBalance` → `balanceUcm` (5 місць)
- Додано `Number()` для безпечного приведення типів Decimal

## Деплой на сервер

### Варіант 1: Автоматичний скрипт
```bash
cd /var/www/sviydlyasvoih/platform-svoi
chmod +x deploy-paid-requests.sh
./deploy-paid-requests.sh
```

### Варіант 2: Вручну (РЕКОМЕНДОВАНО)
```bash
cd /var/www/sviydlyasvoih/platform-svoi

# Зупинити PM2
pm2 stop sviy-platform

# Оновити код
git stash
git pull origin main

# Видалити старий білд
rm -rf .next

# Генерувати Prisma
npx prisma generate

# Зібрати проект
npm run build

# Запустити PM2
pm2 start ecosystem.config.js
pm2 save

# Перевірити логи (без tailing)
pm2 logs sviy-platform --lines 30 --nostream
```

### Варіант 3: Швидкий restart (якщо код вже на сервері)
```bash
cd /var/www/sviydlyasvoih/platform-svoi
pm2 restart sviy-platform
pm2 logs sviy-platform --lines 20
```

## Перевірка

Після деплою перевірте:
1. ✅ Створення заявки працює
2. ✅ Списується правильна сума (5 або 7 УЦМ)
3. ✅ ТОП заявки показуються зверху
4. ✅ Немає помилок в логах

## Тестування

```bash
# Створити тестову заявку через API
curl -X POST https://sviydlyasvoih.pp.ua/api/service-requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Тестова заявка",
    "description": "Перевірка системи",
    "isPublic": true,
    "isPromoted": false
  }'
```

## Очікуваний результат
- Статус: 201 Created
- Відповідь: `{ "success": true, "request": {...} }`
- Списано: 5 УЦМ (або 7 УЦМ якщо isPromoted=true)
