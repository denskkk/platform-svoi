#!/usr/bin/env bash
# Застосовує всі міграції оновлення «соцмережа/екосистема» по порядку. Усі файли тільки додають таблиці/індекси
# і безпечні для повторного запуску. Використання: DATABASE_URL=postgres://... ./database/apply_social_update.sh
set -euo pipefail
cd "$(dirname "$0")/migrations"
: "${DATABASE_URL:?Вкажіть DATABASE_URL}"
for f in \
  20261112_add_social_feed.sql \
  20261112_add_user_blocks.sql \
  20261112_add_projects.sql \
  20261113_add_listings.sql \
  20261114_add_business_applications.sql \
  20261115_add_partner_pages.sql \
  20261116_add_admin_roles.sql; do
  echo ">> $f"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
done
echo "Готово"
