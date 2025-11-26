#!/bin/bash

# Тест создания заявки через API
# Использование: bash test-service-request.sh <TOKEN> [TITLE] [DESCRIPTION]

TOKEN=${1:-""}
TITLE=${2:-"Тест заявка"}
DESCRIPTION=${3:-"Тестирование API"}
CITY=${4:-"Киев"}
BUDGET_FROM=${5:-1000}
BUDGET_TO=${6:-5000}

if [ -z "$TOKEN" ]; then
  echo "❌ Ошибка: TOKEN обязателен"
  echo "Использование: bash test-service-request.sh <JWT_TOKEN> [TITLE] [DESCRIPTION] [CITY] [BUDGET_FROM] [BUDGET_TO]"
  echo ""
  echo "Пример:"
  echo "  bash test-service-request.sh eyJhbGciOiJIUzI1NiIs... \"Ремонт квартиры\" \"Нужен хороший мастер\""
  exit 1
fi

BASE_URL="https://sviydlyasvoih.com.ua"
API_URL="$BASE_URL/api/service-requests"

echo "🔍 Тестирование API: $API_URL"
echo "📝 Параметры:"
echo "  - Title: $TITLE"
echo "  - Description: $DESCRIPTION"
echo "  - City: $CITY"
echo "  - Budget: $BUDGET_FROM - $BUDGET_TO грн"
echo ""

# Отправляем запрос
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"title\": \"$TITLE\",
    \"description\": \"$DESCRIPTION\",
    \"city\": \"$CITY\",
    \"budgetFrom\": $BUDGET_FROM,
    \"budgetTo\": $BUDGET_TO
  }")

echo "📤 Отправлено..."
echo ""
echo "📥 Ответ сервера:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Проверяем результат
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo "✅ Заявка создана успешно!"
  REQUEST_ID=$(echo "$RESPONSE" | jq -r '.request.id' 2>/dev/null)
  echo "🆔 ID заявки: $REQUEST_ID"
elif echo "$RESPONSE" | grep -q '"error"'; then
  ERROR=$(echo "$RESPONSE" | jq -r '.error' 2>/dev/null)
  echo "❌ Ошибка: $ERROR"
  exit 1
else
  echo "⚠️  Неожиданный ответ"
  exit 1
fi
