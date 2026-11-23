-- Облік переходів із вітрин магазинів + активація напряму «Інтернет-магазини» (additive).
CREATE TABLE IF NOT EXISTS outbound_clicks (
  outbound_click_id SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  user_id INTEGER,
  source VARCHAR(30) NOT NULL DEFAULT 'storefront',
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS outbound_clicks_listing_created_idx ON outbound_clicks(listing_id, created_at);
CREATE INDEX IF NOT EXISTS outbound_clicks_user_id_idx ON outbound_clicks(user_id);
UPDATE projects SET status = 'active' WHERE slug IN ('shops', 'events') AND status = 'coming_soon';
