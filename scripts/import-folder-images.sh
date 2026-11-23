#!/usr/bin/env bash
# Import site pictures (folder pictures + project banners) exported from localhost (folder-images-export.zip) on the VPS.
# Usage:  bash scripts/import-folder-images.sh /path/to/folder-images-export.zip [uploads_dir]
# uploads_dir defaults to $UPLOADS_DIR (or UPLOADS_DIR from .env) or <project>/public/uploads. DB: DATABASE_URL (from .env) or env.
# Safe to run twice: files are copied without overwriting different files, SQL is an upsert/update.
set -euo pipefail
ZIP="${1:?path to folder-images-export.zip}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
envval() { [ -f "$ROOT/.env" ] && grep -E "^$1=" "$ROOT/.env" | head -1 | cut -d= -f2- | tr -d '"' || true; }
UP="${2:-${UPLOADS_DIR:-$(envval UPLOADS_DIR)}}"
UP="${UP:-$ROOT/public/uploads}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
# unzip exits with 1 on warnings (e.g. zips made on Windows with backslashes) - that is fine, we repair the names below
unzip -q "$ZIP" -d "$TMP" || [ $? -eq 1 ]
# Old Windows zips keep the backslash as part of the file name (uploads\misc\x.jpg): turn them into real folders
shopt -s nullglob
for f in "$TMP"/*\\*; do
  b="$(basename "$f")"
  rel="${b//\\//}"
  mkdir -p "$TMP/$(dirname "$rel")"
  mv "$f" "$TMP/$rel"
done
shopt -u nullglob
mkdir -p "$UP"
[ -d "$TMP/uploads" ] && { cp -rn "$TMP/uploads/." "$UP/" 2>/dev/null || cp -r "$TMP/uploads/." "$UP/"; }
DB="${DATABASE_URL:-$(envval DATABASE_URL)}"
DB_URL="${DB%%\?*}"
[ -n "$DB_URL" ] || { echo "DATABASE_URL not found"; exit 1; }
psql "$DB_URL" -v ON_ERROR_STOP=1 -q -f "$TMP/folder_images.sql"
# verify that every referenced file is on disk
MISS=0; TOTAL=0
if [ -f "$TMP/files.txt" ]; then
  while IFS= read -r u; do
    [ -z "$u" ] && continue
    TOTAL=$((TOTAL+1))
    [ -f "$UP/${u#/uploads/}" ] || { MISS=$((MISS+1)); echo "MISSING: $u"; }
  done < "$TMP/files.txt"
fi
echo "Done: uploads dir = $UP; files checked: $TOTAL, missing: $MISS"
[ "$MISS" -eq 0 ] || { echo "Some files are missing - export again on localhost (see export output)."; exit 2; }
chown -R "$(stat -c '%U:%G' "$ROOT")" "$UP" 2>/dev/null || true
