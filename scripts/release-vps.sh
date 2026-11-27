#!/usr/bin/env bash
# One-command release on the VPS: backup -> git pull -> SQL migrations -> deploy (build + reload) -> optional pictures -> health check.
# Run ON THE VPS in the project folder:   bash scripts/release-vps.sh
# Options (env vars):  PM2_APP=sviy   IMAGES_ZIP=/tmp/folder-images-export.zip   BACKUP_DIR=$HOME/backups   YES=1 (no confirmation question)
# Nothing here deletes data: migrations only add tables/columns and re-map listing sections; the database is backed up first.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
PM2_APP="${PM2_APP:-sviy}"
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups}"
IMAGES_ZIP="${IMAGES_ZIP:-/tmp/folder-images-export.zip}"
TS="$(date +%Y%m%d_%H%M%S)"

say() { printf '\n\033[1;36m== %s ==\033[0m\n' "$*"; }
die() { printf '\n\033[1;31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }
envval() { [ -f "$ROOT/.env" ] && grep -E "^$1=" "$ROOT/.env" | head -1 | cut -d= -f2- | tr -d '"' || true; }

say "0/6 Preflight"
command -v psql >/dev/null || die "psql not found"
command -v pg_dump >/dev/null || die "pg_dump not found"
command -v pm2 >/dev/null || die "pm2 not found"
command -v node >/dev/null || die "node not found"
DB="${DATABASE_URL:-$(envval DATABASE_URL)}"
[ -n "$DB" ] || die "DATABASE_URL not found (.env)"
DB_URL="${DB%%\?*}"
psql "$DB_URL" -qtAc "select 1" >/dev/null || die "cannot connect to the database"
echo "Project: $ROOT"
echo "PM2 app: $PM2_APP"
echo "Branch : $(git rev-parse --abbrev-ref HEAD)  now at $(git rev-parse --short HEAD)"
git status --porcelain | head -5 | sed 's/^/  local change: /' || true
if [ "${YES:-}" != "1" ]; then
  echo
  echo "This will: back up the database, pull origin/main, run ALL SQL migrations 20261112-20261155 (safe to repeat), rebuild and reload the site."
  read -r -p "Type RELEASE to continue: " ANSWER
  [ "$ANSWER" = "RELEASE" ] || die "cancelled"
fi

say "1/6 Database backup"
mkdir -p "$BACKUP_DIR"
BACKUP="$BACKUP_DIR/svoi_before_release_$TS.dump"
pg_dump "$DB_URL" -Fc -f "$BACKUP"
[ -s "$BACKUP" ] || die "backup is empty"
echo "Backup: $BACKUP ($(du -h "$BACKUP" | cut -f1))"
echo "Restore if needed:  pg_restore -c -d \"\$DATABASE_URL\" '$BACKUP'   (DATABASE_URL is in .env; cut off the ?schema=public part)"

say "2/6 Get the code (git pull --ff-only origin main)"
git pull --ff-only origin main
echo "Now at $(git rev-parse --short HEAD)"

say "3/6 SQL migrations"
MIGRATIONS=(
  20261112_add_social_feed.sql 20261112_add_user_blocks.sql 20261112_add_projects.sql
  20261113_add_listings.sql 20261114_add_business_applications.sql 20261115_add_partner_pages.sql
  20261116_add_admin_roles.sql 20261117_add_saved_posts.sql 20261118_add_comment_likes_replies.sql
  20261119_business_application_fields.sql 20261120_add_organization_applications.sql 20261121_activate_listing_projects.sql
  20261122_add_outbound_clicks.sql 20261123_add_clubs.sql 20261124_add_referrals_deals.sql
  20261125_add_post_videos.sql 20261126_add_stories.sql 20261127_earn_page_media_steps.sql
  20261128_business_media_geo.sql 20261129_add_notification_settings.sql 20261130_add_reposts_reactions.sql
  20261131_add_user_cover.sql 20261132_invites_views_settings.sql 20261133_club_communities.sql
  20261134_add_invoices.sql 20261135_project_catalog_client_list.sql 20261136_activate_project_boards.sql
  20261137_group_chats.sql 20261138_project_suggestions.sql 20261139_linked_accounts.sql
  20261140_taxi_requests.sql 20261141_activate_more_projects.sql
  20261142_client_list_v2.sql 20261143_listings_backfill_sections.sql 20261143_posts_is_private.sql 20261144_perf_indexes.sql
  20261145_china_sections_remap.sql 20261146_folder_images.sql 20261147_taxi_request_details.sql
  20261148_representations.sql 20261149_real_estate_sections.sql 20261150_project_structures.sql
  20261151_antiques_clubs_structure.sql 20261152_export_alliance.sql 20261153_nine_projects_structure.sql
  20261154_negotiations.sql 20261155_post_mixed_media.sql 20261156_users_terms_accepted.sql 20261157_conversation_cleared.sql
)
export PGCLIENTENCODING=UTF8
for f in "${MIGRATIONS[@]}"; do
  [ -f "database/migrations/$f" ] || die "missing migration file $f"
  printf '  -> %s\n' "$f"
  if ! psql "$DB_URL" -v ON_ERROR_STOP=1 -q -f "database/migrations/$f"; then
    die "migration $f failed. The site is still running the OLD code. Fix/ask for help; restore with: pg_restore -c -d \"\$DATABASE_URL\" '$BACKUP'"
  fi
done

say "3b/6 Schema check (anything printed below is still missing in the database)"
if [ -d node_modules/.bin ] && [ -x node_modules/.bin/prisma ]; then
  DIFF="$(node_modules/.bin/prisma migrate diff --from-url "$DB_URL" --to-schema-datamodel prisma/schema.prisma --script 2>&1 || true)"
  if echo "$DIFF" | grep -qiE "CREATE TABLE|ALTER TABLE|CREATE (UNIQUE )?INDEX"; then
    echo "$DIFF" | head -60
    echo
    echo "NOTE: the lines above are differences between schema.prisma and the database. If they are only CREATE/ADD, run:  npx prisma db push   (do NOT use --accept-data-loss)"
  else
    echo "Schema matches the database."
  fi
else
  echo "prisma CLI not installed yet (it is installed in the next step) - skipped."
fi

say "4/6 Build and reload (scripts/deploy.sh)"
PM2_APP="$PM2_APP" bash scripts/deploy.sh

say "5/6 Pictures (optional)"
if [ -f "$IMAGES_ZIP" ]; then
  bash scripts/import-folder-images.sh "$IMAGES_ZIP" && rm -f "$IMAGES_ZIP"
else
  echo "No $IMAGES_ZIP - skipped. Later:  bash scripts/import-folder-images.sh /path/to/folder-images-export.zip"
fi

say "6/6 Final check"
PORT_="${PORT:-$(envval PORT)}"; PORT_="${PORT_:-3000}"
for p in /api/health /api/projects /; do
  code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT_$p" || true)"
  echo "  $code  $p"
done
printf '\n\033[1;32mRELEASE DONE.\033[0m Backup kept at %s\n' "$BACKUP"
echo "Now check in the browser: login with an old account, feed, projects, admin."
echo "Rollback code: git checkout <previous commit> && bash scripts/deploy.sh ; rollback DB: pg_restore (see the backup line above)."
