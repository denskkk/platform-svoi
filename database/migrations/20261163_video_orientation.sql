-- Орієнтація відео: вертикальні йдуть у «Рілси», горизонтальні лишаються в стрічці. Additive; старі відео (NULL) поводяться як раніше.
-- Заповнити для вже завантажених:  node scripts/backfill-video-dims.mjs
ALTER TABLE post_videos ADD COLUMN IF NOT EXISTS width INT;
ALTER TABLE post_videos ADD COLUMN IF NOT EXISTS height INT;
ALTER TABLE post_videos ADD COLUMN IF NOT EXISTS is_vertical BOOLEAN;
CREATE INDEX IF NOT EXISTS idx_post_videos_vertical ON post_videos (is_vertical) WHERE status = 'ready';
