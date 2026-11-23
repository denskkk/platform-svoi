#!/usr/bin/env bash
# Перевіряє і готує VPS до відео (рілси, історії, дописи): ffmpeg, папки завантажень, ліміт nginx.
# Запуск на VPS:  bash scripts/setup-video-server.sh        (безпечно повторювати)
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
envval() { [ -f "$ROOT/.env" ] && grep -E "^$1=" "$ROOT/.env" | head -1 | cut -d= -f2- | tr -d '"' || true; }
ok()   { echo "  OK   $*"; }
warn() { echo "  FIX  $*"; }

echo "== 1/4 ffmpeg =="
for b in ffmpeg ffprobe; do
  if command -v "$b" >/dev/null 2>&1; then ok "$b: $(command -v $b)"; else
    warn "$b not installed -> installing ffmpeg"
    (apt-get update -qq && apt-get install -y -qq ffmpeg) >/dev/null 2>&1 && ok "ffmpeg installed" || echo "  ERROR could not install ffmpeg: run  apt-get install -y ffmpeg  manually"
    break
  fi
done
ffmpeg -hide_banner -encoders 2>/dev/null | grep -q libx264 && ok "libx264 encoder available" || echo "  ERROR ffmpeg has no libx264 (install the full 'ffmpeg' package)"

echo "== 2/4 Upload folders =="
UP="${UPLOADS_DIR:-$(envval UPLOADS_DIR)}"; UP="${UP:-$ROOT/public/uploads}"
OWNER="$(stat -c '%U:%G' "$ROOT")"
for d in videos videos-raw misc posts avatars; do mkdir -p "$UP/$d"; done
chown -R "$OWNER" "$UP" 2>/dev/null || true
ok "uploads dir: $UP (owner $OWNER); free space: $(df -h "$UP" | awk 'NR==2{print $4}')"

echo "== 3/4 nginx upload limit =="
CONF="$(grep -rl "videos/upload" /etc/nginx 2>/dev/null | head -1 || true)"
if [ -z "$CONF" ]; then
  warn "your nginx config has no '/api/videos/upload' block -> big videos are cut at 1 MB/10 MB (this is the usual 'upload failed' cause)."
  echo "       Copy the server block from $ROOT/nginx.conf into your site config, or ask for help."
elif grep -qE "client_max_body_size +(1[5-9][0-9]|[2-9][0-9][0-9])M" "$CONF"; then
  ok "nginx limit is large enough ($CONF)"
else
  warn "limit in $CONF is lower than 160M: set 'client_max_body_size 160M;' in the /api/videos/upload location, then: nginx -t && systemctl reload nginx"
fi

echo "== 4/4 Quick encode test =="
if command -v ffmpeg >/dev/null 2>&1; then
  T="$(mktemp -d)"
  if nice -n 19 ffmpeg -hide_banner -loglevel error -f lavfi -i testsrc=duration=1:size=320x240:rate=15 -c:v libx264 -pix_fmt yuv420p "$T/t.mp4" >/dev/null 2>&1 && [ -s "$T/t.mp4" ]; then ok "test video encoded"; else echo "  ERROR test encode failed"; fi
  rm -rf "$T"
fi
echo "Done. If the app runs with a custom path for ffmpeg, set FFMPEG_PATH / FFPROBE_PATH in .env."
