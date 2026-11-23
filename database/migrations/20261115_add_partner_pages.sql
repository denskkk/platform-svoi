-- Сторінки «Як заробити з нами?» та заявки на партнерство (additive, повторний запуск безпечний).
CREATE TABLE IF NOT EXISTS project_earn_pages (
  earn_page_id SERIAL PRIMARY KEY,
  project_slug VARCHAR(60) NOT NULL UNIQUE,
  title_uk VARCHAR(150) NOT NULL DEFAULT '',
  title_en VARCHAR(150) NOT NULL DEFAULT '',
  body_uk TEXT NOT NULL DEFAULT '',
  body_en TEXT NOT NULL DEFAULT '',
  updated_by_id INTEGER,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS partner_applications (
  partner_application_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  project_slug VARCHAR(60) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  reject_reason VARCHAR(500),
  moderated_at TIMESTAMP,
  moderated_by_id INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS partner_applications_user_project_idx ON partner_applications(user_id, project_slug);
CREATE INDEX IF NOT EXISTS partner_applications_status_created_idx ON partner_applications(status, created_at);
