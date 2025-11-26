#!/bin/bash

# Быстрая диагностика сервера
# Использование: bash diagnose-issues.sh

echo "================================"
echo "🔧 ДИАГНОСТИКА СЕРВЕРА"
echo "================================"
echo ""

BASE_URL="https://sviydlyasvoih.com.ua"

# 1. Проверка доступности сервера
echo "1️⃣  Проверка доступности сервера..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL")
if [ "$HTTP_CODE" = "200" ]; then
  echo "   ✅ Сервер доступен (HTTP $HTTP_CODE)"
else
  echo "   ❌ Сервер недоступен (HTTP $HTTP_CODE)"
  exit 1
fi
echo ""

# 2. Проверка API Health
echo "2️⃣  Проверка API health..."
HEALTH=$(curl -s "$BASE_URL/api/health")
if echo "$HEALTH" | grep -q "ok"; then
  echo "   ✅ API работает"
  echo "   $HEALTH"
else
  echo "   ⚠️  API ответ: $HEALTH"
fi
echo ""

# 3. Проверка БД
echo "3️⃣  Проверка базы данных..."
DB_HEALTH=$(curl -s "$BASE_URL/api/health/db")
if echo "$DB_HEALTH" | grep -q "ok"; then
  echo "   ✅ База данных доступна"
else
  echo "   ❌ Проблема с БД"
  echo "   $DB_HEALTH"
fi
echo ""

# 4. Проверка статуса PM2
if command -v pm2 &> /dev/null; then
  echo "4️⃣  Статус PM2 (локально)..."
  pm2 list
  echo ""
fi

# 5. Проверка 404 страниц
echo "5️⃣  Проверка недостающих страниц..."
for page in "/privacy" "/faq" "/how-it-works" "/terms"; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$page")
  if [ "$CODE" = "404" ]; then
    echo "   ⚠️  $page - 404 (не найдена)"
  else
    echo "   ✅ $page - $CODE"
  fi
done
echo ""

# 6. Проверка сервис-рекестов
echo "6️⃣  Проверка API /api/service-requests (GET)..."
SR=$(curl -s -H "Authorization: Bearer test" "$BASE_URL/api/service-requests")
if echo "$SR" | jq -e '.requests' > /dev/null 2>&1; then
  echo "   ✅ API /api/service-requests доступен"
  COUNT=$(echo "$SR" | jq '.pagination.total' 2>/dev/null)
  echo "   📊 Всего заявок: $COUNT"
else
  echo "   ⚠️  Ответ: $SR"
fi
echo ""

echo "================================"
echo "✅ Диагностика завершена"
echo "================================"
