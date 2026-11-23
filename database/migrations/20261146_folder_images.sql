-- Картинки папок (кубиків) у проєктах і категоріях клубів. Додаткова таблиця, наявні дані не змінюються.
CREATE TABLE IF NOT EXISTS folder_images (
  folder_image_id SERIAL PRIMARY KEY,
  project         VARCHAR(60)  NOT NULL,
  path            VARCHAR(120) NOT NULL,
  image_url       VARCHAR(255) NOT NULL,
  updated_at      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT folder_images_project_path_key UNIQUE (project, path)
);
