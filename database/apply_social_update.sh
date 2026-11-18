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
  20261116_add_admin_roles.sql \
  20261117_add_saved_posts.sql \
  20261118_add_comment_likes_replies.sql \
  20261119_business_application_fields.sql \
  20261120_add_organization_applications.sql \
  20261121_activate_listing_projects.sql \
  20261122_add_outbound_clicks.sql \
  20261123_add_clubs.sql \
  20261124_add_referrals_deals.sql \
  20261125_add_post_videos.sql \
  20261126_add_stories.sql \
  20261127_earn_page_media_steps.sql \
  20261128_business_media_geo.sql \
  20261129_add_notification_settings.sql \
  20261130_add_reposts_reactions.sql \
  20261131_add_user_cover.sql \
  20261132_invites_views_settings.sql \
  20261133_club_communities.sql \
  20261134_add_invoices.sql \
  20261135_project_catalog_client_list.sql \
  20261136_activate_project_boards.sql; do
  echo ">> $f"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
done
echo "Готово"
