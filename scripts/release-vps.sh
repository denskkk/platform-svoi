#!/usr/bin/env bash
# One-command release on the VPS: backup -> git pull -> SQL migrations -> deploy (build + reload) -> optional pictures -> health check.
# Run ON THE VPS in the project folder:   bash scripts/release-vps.sh
# Options (env vars):  PM2_APP=sviy-platform   IMAGES_ZIP=/tmp/folder-images-export.zip   BACKUP_DIR=$HOME/backups   YES=1 (no confirmation question)
# Nothing here deletes data: migrations only add tables/columns and re-map listing sections; the database is backed up first.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
PM2_APP="${PM2_APP:-sviy-platform}"
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
  echo "This will: back up the database, pull origin/main, run SQL migrations 20261142-20261154, rebuild and reload the site."
  read -r -p "Type RELEASE to continue: " ANSWER
  [ "$ANSWER" = "RELEASE" ] || die "cancelled"
fi

say "1/6 Database backup"
mkdir -p "$BACKUP_DIR"
BACKUP="$BACKUP_DIR/svoi_before_release_$TS.dump"
pg_dump "$DB_URL" -Fc -f "$BACKUP"
[ -s "$BACKUP" ] || die "backup is empty"
echo "Backup: $BACKUP ($(du -h "$BACKUP" | cut -f1))"
echo "Restore if needed:  pg_restore -c -d '$DB_URL' '$BACKUP'"

say "2/6 Get the code (git pull --ff-only origin main)"
git pull --ff-only origin main
echo "Now at $(git rev-parse --short HEAD)"

say "3/6 SQL migrations"
MIGRATIONS=(
  20261142_client_list_v2.sql 20261143_listings_backfill_sections.sql 20261144_perf_indexes.sql
  20261145_china_sections_remap.sql 20261146_folder_images.sql 20261147_taxi_request_details.sql
  20261148_representations.sql 20261149_real_estate_sections.sql 20261150_project_structures.sql
  20261151_antiques_clubs_structure.sql 20261152_export_alliance.sql 20261153_nine_projects_structure.sql
  20261154_negotiations.sql
)
export PGCLIENTENCODING=UTF8
for f in "${MIGRATIONS[@]}"; do
  [ -f "database/migrations/$f" ] || die "missing migration file $f"
  printf '  -> %s\n' "$f"
  if ! psql "$DB_URL" -v ON_ERROR_STOP=1 -q -f "database/migrations/$f"; then
    die "migration $f failed. The site is still running the OLD code. Fix/ask for help; restore with: pg_restore -c -d '$DB_URL' '$BACKUP'"
  fi
done

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
echo "Rollback code: git checkout <previous commit> && bash scripts/deploy.sh ; rollback DB: pg_restore (command above)."
