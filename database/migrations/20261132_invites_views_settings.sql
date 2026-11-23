-- Запрошення (реферальний код), перегляди профілю, налаштування користувача (additive).
ALTER TABLE users ADD COLUMN IF NOT EXISTS ref_code VARCHAR(16);
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by_id INTEGER;
CREATE UNIQUE INDEX IF NOT EXISTS users_ref_code_key ON users (ref_code);
DO $$ BEGIN
  ALTER TABLE users ADD CONSTRAINT users_referred_by_id_fkey FOREIGN KEY (referred_by_id) REFERENCES users(user_id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS users_referred_by_id_idx ON users (referred_by_id);

CREATE TABLE IF NOT EXISTS profile_views (
  profile_view_id SERIAL PRIMARY KEY,
  viewer_id  INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  profile_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS profile_views_profile_idx ON profile_views (profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS profile_views_viewer_idx ON profile_views (viewer_id, profile_id, created_at);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id INTEGER PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Проєкти: «Таксі» першим, адвокатські об'єднання; «Автомобілі» → «Автосалони» (лише якщо назву не змінювали).
INSERT INTO projects (slug, icon, color, name_uk, name_en, description_uk, description_en, status, sort_order, updated_at) VALUES
  ('taxi', '🚕', '#eab308', 'Таксі', 'Taxi', 'Замовити таксі, стати водієм, заробляти зі своїми.', 'Order a taxi, become a driver, earn with your own people.', 'active', 1, NOW()),
  ('lawyers', '⚖️', '#1e3a8a', 'Адвокатські об’єднання', 'Law associations', 'Адвокати та адвокатські об’єднання, консультації.', 'Lawyers and law associations, consultations.', 'coming_soon', 25, NOW())
ON CONFLICT (slug) DO NOTHING;
UPDATE projects SET name_uk = 'Автосалони', name_en = 'Car dealerships' WHERE slug = 'cars' AND name_uk = 'Автомобілі';
