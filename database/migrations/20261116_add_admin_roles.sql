-- Ролі персоналу (additive; таблиця users не змінюється). Безпечно запускати повторно.
CREATE TABLE IF NOT EXISTS admin_roles (
  admin_role_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  role VARCHAR(30) NOT NULL,
  granted_by_id INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
