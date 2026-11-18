-- Пропозиції та скарги у проєктах (additive)
CREATE TABLE IF NOT EXISTS project_suggestions (
  suggestion_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  project_slug VARCHAR(60) NOT NULL,
  kind VARCHAR(16) NOT NULL,
  text VARCHAR(1000) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'new',
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS project_suggestions_status_idx ON project_suggestions (status, suggestion_id DESC);
