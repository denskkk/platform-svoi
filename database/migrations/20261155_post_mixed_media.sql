-- Змішане медіа в дописі (фото + відео в одній каруселі, як в Instagram). Additive, безпечно запускати повторно.
-- Раніше до допису можна було прикріпити лише ОДНЕ відео (UNIQUE post_id); тепер їх кілька, із порядком у каруселі.
ALTER TABLE post_videos DROP CONSTRAINT IF EXISTS post_videos_post_id_key;
DROP INDEX IF EXISTS post_videos_post_id_key;
ALTER TABLE post_videos ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS post_videos_post_position_idx ON post_videos(post_id, position);
