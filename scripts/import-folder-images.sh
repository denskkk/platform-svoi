#!/usr/bin/env bash
# Import folder pictures exported from localhost (folder-images-export.zip) on the VPS.
# Usage:  bash scripts/import-folder-images.sh /path/to/folder-images-export.zip [uploads_dir]
# uploads_dir defaults to $UPLOADS_DIR or <project>/public/uploads. DB: DATABASE_URL (from .env) or PG* variables.
set -euo pipefail
ZIP="${1:?path to folder-images-export.zip}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
UP="${2:-${UPLOADS_DIR:-$ROOT/public/uploads}}"
TMP="$(mktemp -d)"
unzip -q "$ZIP" -d "$TMP"
mkdir -p "$UP"
[ -d "$TMP/uploads" ] && cp -rn "$TMP/uploads/." "$UP/"
if [ -z "${DATABASE_URL:-}" ] && [ -f "$ROOT/.env" ]; then DATABASE_URL="$(grep -E '^DATABASE_URL=' "$ROOT/.env" | head -1 | cut -d= -f2- | tr -d '"')"; fi
DB_URL="${DATABASE_URL%%\?*}"
psql "$DB_URL" -v ON_ERROR_STOP=1 -q -f "$TMP/folder_images.sql"
rm -rf "$TMP"
echo "Done: files copied to $UP, folder_images updated"
