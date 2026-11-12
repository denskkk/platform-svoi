-- Оголошення (єдиний модуль), збережені оголошення, журнал аудиту.
-- Тільки нові таблиці. Також вмикає напрями «Автомобілі» та «Нерухомість».
-- Відкат: DROP TABLE saved_listings, listing_images, listings, audit_logs;
--         UPDATE projects SET status='coming_soon' WHERE slug IN ('cars','real-estate');

CREATE TABLE IF NOT EXISTS listings (
  listing_id      SERIAL PRIMARY KEY,
  project_slug    VARCHAR(60) NOT NULL,
  owner_id        INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  title           VARCHAR(150) NOT NULL,
  description     TEXT NOT NULL,
  price           DECIMAL(14,2),
  currency        VARCHAR(3) NOT NULL DEFAULT 'UAH',
  city            VARCHAR(100),
  contact_name    VARCHAR(100),
  phone           VARCHAR(30),
  data            JSONB NOT NULL DEFAULT '{}',
  status          VARCHAR(20) NOT NULL DEFAULT 'pending',
  reject_reason   TEXT,
  expires_at      TIMESTAMP(3),
  views_count     INTEGER NOT NULL DEFAULT 0,
  moderated_at    TIMESTAMP(3),
  moderated_by_id INTEGER,
  created_at      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS listings_project_slug_status_created_at_idx ON listings (project_slug, status, created_at DESC);
CREATE INDEX IF NOT EXISTS listings_owner_id_created_at_idx ON listings (owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS listings_status_created_at_idx ON listings (status, created_at);
CREATE INDEX IF NOT EXISTS listings_city_idx ON listings (city);
CREATE INDEX IF NOT EXISTS listings_price_idx ON listings (price);

CREATE TABLE IF NOT EXISTS listing_images (
  listing_image_id SERIAL PRIMARY KEY,
  listing_id       INTEGER NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  url              VARCHAR(255) NOT NULL,
  position         INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS listing_images_listing_id_position_idx ON listing_images (listing_id, position);

CREATE TABLE IF NOT EXISTS saved_listings (
  saved_listing_id SERIAL PRIMARY KEY,
  user_id          INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  listing_id       INTEGER NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  created_at       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT saved_listings_user_id_listing_id_key UNIQUE (user_id, listing_id)
);
CREATE INDEX IF NOT EXISTS saved_listings_user_id_created_at_idx ON saved_listings (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS audit_logs (
  audit_id    SERIAL PRIMARY KEY,
  actor_id    INTEGER,
  action      VARCHAR(60) NOT NULL,
  entity_type VARCHAR(40) NOT NULL,
  entity_id   INTEGER,
  details     JSONB,
  created_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS audit_logs_actor_id_idx ON audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs (created_at DESC);

UPDATE projects SET status = 'active' WHERE slug IN ('cars', 'real-estate') AND status = 'coming_soon';
