-- Сторінка «Як заробити з нами?»: відео, кроки, приклади (additive).
ALTER TABLE project_earn_pages ADD COLUMN IF NOT EXISTS video_url VARCHAR(300) NOT NULL DEFAULT '';
ALTER TABLE project_earn_pages ADD COLUMN IF NOT EXISTS steps_uk TEXT NOT NULL DEFAULT '';
ALTER TABLE project_earn_pages ADD COLUMN IF NOT EXISTS steps_en TEXT NOT NULL DEFAULT '';
ALTER TABLE project_earn_pages ADD COLUMN IF NOT EXISTS examples_uk TEXT NOT NULL DEFAULT '';
ALTER TABLE project_earn_pages ADD COLUMN IF NOT EXISTS examples_en TEXT NOT NULL DEFAULT '';
