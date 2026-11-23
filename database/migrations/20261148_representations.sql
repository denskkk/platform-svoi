-- Представництва: країна → область → район → громада, керівники, команди та заявки (additive)
CREATE TABLE IF NOT EXISTS rep_units (
  unit_id    SERIAL PRIMARY KEY,
  project    VARCHAR(60)  NOT NULL,
  parent_id  INTEGER REFERENCES rep_units(unit_id) ON DELETE CASCADE,
  level      VARCHAR(12)  NOT NULL,
  name       VARCHAR(120) NOT NULL,
  flag       VARCHAR(8),
  leader_id  INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS rep_units_project_parent_idx ON rep_units (project, parent_id, sort_order);
CREATE INDEX IF NOT EXISTS rep_units_leader_idx ON rep_units (leader_id);

CREATE TABLE IF NOT EXISTS rep_members (
  member_id      SERIAL PRIMARY KEY,
  unit_id        INTEGER NOT NULL REFERENCES rep_units(unit_id) ON DELETE CASCADE,
  user_id        INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  role           VARCHAR(16) NOT NULL,
  mode           VARCHAR(8)  NOT NULL DEFAULT 'both',
  specialization VARCHAR(160),
  status         VARCHAR(12) NOT NULL DEFAULT 'approved',
  created_at     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT rep_members_unit_user_role_key UNIQUE (unit_id, user_id, role)
);
CREATE INDEX IF NOT EXISTS rep_members_user_idx ON rep_members (user_id);

CREATE TABLE IF NOT EXISTS rep_applications (
  application_id SERIAL PRIMARY KEY,
  project        VARCHAR(60) NOT NULL,
  unit_id        INTEGER REFERENCES rep_units(unit_id) ON DELETE SET NULL,
  user_id        INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  kind           VARCHAR(12) NOT NULL,
  place_name     VARCHAR(120),
  message        TEXT NOT NULL,
  phone          VARCHAR(30),
  specialization VARCHAR(160),
  mode           VARCHAR(8),
  to_leader_id   INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  status         VARCHAR(12) NOT NULL DEFAULT 'new',
  handled_by_id  INTEGER,
  handled_at     TIMESTAMP(3),
  created_at     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS rep_applications_leader_status_idx ON rep_applications (to_leader_id, status);
CREATE INDEX IF NOT EXISTS rep_applications_unit_status_idx ON rep_applications (unit_id, status);
CREATE INDEX IF NOT EXISTS rep_applications_status_created_idx ON rep_applications (status, created_at);
CREATE INDEX IF NOT EXISTS rep_applications_user_created_idx ON rep_applications (user_id, created_at);

-- Початкові країни для проєкту «Юристи» (приклад із макета; адміністрація змінює список у /admin/representations). Лише якщо дерево порожнє.
INSERT INTO rep_units (project, level, name, flag, sort_order)
SELECT 'lawyers', 'country', v.name, v.flag, v.ord
FROM (VALUES ('Україна', '🇺🇦', 1), ('Словаччина', '🇸🇰', 2), ('Чехія', '🇨🇿', 3), ('Угорщина', '🇭🇺', 4)) AS v(name, flag, ord)
WHERE NOT EXISTS (SELECT 1 FROM rep_units WHERE project = 'lawyers');
