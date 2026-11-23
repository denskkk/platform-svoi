-- Спільноти: закрите вступ із заявками, права писати, дошка дописів (additive).
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS join_mode  VARCHAR(12) NOT NULL DEFAULT 'open';
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS post_mode  VARCHAR(12) NOT NULL DEFAULT 'owner';
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS visibility VARCHAR(12) NOT NULL DEFAULT 'public';
ALTER TABLE club_members ADD COLUMN IF NOT EXISTS status VARCHAR(12) NOT NULL DEFAULT 'active';
ALTER TABLE club_members ADD COLUMN IF NOT EXISTS can_write BOOLEAN NOT NULL DEFAULT false;
-- Творці наявних клубів можуть писати
UPDATE club_members m SET can_write = true FROM clubs c WHERE c.club_id = m.club_id AND c.owner_id = m.user_id;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS club_id INTEGER;
DO $$ BEGIN
  ALTER TABLE posts ADD CONSTRAINT posts_club_id_fkey FOREIGN KEY (club_id) REFERENCES clubs(club_id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS posts_club_id_id_idx ON posts (club_id, post_id DESC);
