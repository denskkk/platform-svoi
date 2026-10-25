#!/usr/bin/env bash
# Безпечний деплой: збирає нову версію, і лише якщо збірка успішна — перезапускає застосунок.
# Якщо збірка впала, попередня робоча версія (.next) повертається, сайт не зупиняється.
#
# Використання (на VPS, у папці проєкту):
#   bash scripts/deploy.sh
#   PM2_APP=sviy-platform bash scripts/deploy.sh

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PM2_APP="${PM2_APP:-sviy-platform}"
cd "$APP_DIR"

echo "▶ Папка: $APP_DIR"
echo "▶ PM2-процес: $PM2_APP"

echo "▶ 1/6 Забираємо код з GitHub"
git pull --ff-only origin main

echo "▶ 2/6 Встановлюємо залежності"
npm ci

echo "▶ 3/6 Prisma client"
npx prisma generate

echo "▶ 4/6 Резервна копія поточної збірки"
rm -rf .next.bak
if [ -d .next ]; then cp -a .next .next.bak; fi

echo "▶ 5/6 Збірка"
if ! npm run build; then
  echo "✖ Збірка не вдалася — повертаємо попередню версію, сайт працює як раніше."
  rm -rf .next
  if [ -d .next.bak ]; then mv .next.bak .next; fi
  exit 1
fi

echo "▶ 6/6 Перезапуск"
pm2 reload "$PM2_APP" --update-env
pm2 save >/dev/null

echo "▶ Перевірка"
for i in 1 2 3 4 5 6 7 8 9 10; do
  code="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:${PORT:-3000}/api/health || true)"
  if [ "$code" = "200" ]; then
    echo "✔ Готово: сайт відповідає (health = 200)"
    rm -rf .next.bak
    exit 0
  fi
  sleep 2
done

echo "✖ Сайт не відповідає після перезапуску. Дивіться: pm2 logs $PM2_APP --lines 100"
echo "  Попередня збірка збережена в .next.bak (відкат: rm -rf .next && mv .next.bak .next && pm2 reload $PM2_APP)"
exit 1
