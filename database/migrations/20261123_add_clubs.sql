-- Клуби та спільноти (additive). Безпечно запускати повторно.
CREATE TABLE IF NOT EXISTS clubs (
  club_id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(40) NOT NULL,
  city VARCHAR(100),
  image_url VARCHAR(255),
  members_count INTEGER NOT NULL DEFAULT 1,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS clubs_hidden_created_idx ON clubs(is_hidden, created_at DESC);
CREATE INDEX IF NOT EXISTS clubs_category_idx ON clubs(category);
CREATE INDEX IF NOT EXISTS clubs_city_idx ON clubs(city);
CREATE TABLE IF NOT EXISTS club_members (
  club_member_id SERIAL PRIMARY KEY,
  club_id INTEGER NOT NULL REFERENCES clubs(club_id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT club_members_club_user_key UNIQUE (club_id, user_id)
);
CREATE INDEX IF NOT EXISTS club_members_user_id_idx ON club_members(user_id);
UPDATE projects SET status = 'active' WHERE slug = 'clubs' AND status = 'coming_soon';
