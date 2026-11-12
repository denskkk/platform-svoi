-- Напрямки («Проєкти»). Нова таблиця + початкові дані. Існуючі таблиці не змінюються.
-- Відкат: DROP TABLE projects;
CREATE TABLE IF NOT EXISTS projects (
  project_id     SERIAL PRIMARY KEY,
  slug           VARCHAR(60) NOT NULL UNIQUE,
  icon           VARCHAR(16),
  color          VARCHAR(16),
  banner_url     VARCHAR(255),
  name_uk        VARCHAR(120) NOT NULL,
  name_en        VARCHAR(120) NOT NULL,
  description_uk TEXT,
  description_en TEXT,
  status         VARCHAR(20) NOT NULL DEFAULT 'coming_soon',
  sort_order     INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS projects_status_sort_order_idx ON projects (status, sort_order);

INSERT INTO projects (slug, icon, color, name_uk, name_en, description_uk, description_en, status, sort_order) VALUES
  ('cars', '🚗', '#2563eb', 'Автомобілі', 'Cars', 'Купівля та продаж авто, автосалони, сервіс.', 'Buy and sell cars, dealerships, service.', 'coming_soon', 10),
  ('real-estate', '🏠', '#0d9488', 'Нерухомість', 'Real estate', 'Квартири, будинки, комерційна нерухомість, оренда та продаж.', 'Apartments, houses, commercial property, rent and sale.', 'coming_soon', 20),
  ('health', '🩺', '#dc2626', 'Здоров’я', 'Health', 'Лікарі, клініки, онлайн-консультації, реабілітація.', 'Doctors, clinics, online consultations, rehabilitation.', 'coming_soon', 30),
  ('sport', '🏋️', '#ea580c', 'Спорт і тренери', 'Sports & coaches', 'Тренери, секції, фітнес, онлайн-тренування.', 'Coaches, classes, fitness, online training.', 'coming_soon', 40),
  ('shops', '🛍️', '#9333ea', 'Інтернет-магазини', 'Online stores', 'Вітрини магазинів і перехід на їхні сайти.', 'Store showcases that lead to the stores'' own websites.', 'coming_soon', 50),
  ('events', '🎟️', '#db2777', 'Події', 'Events', 'Заходи, конференції, виставки, зустрічі, навчання.', 'Events, conferences, exhibitions, meetups, training.', 'coming_soon', 60),
  ('clubs', '🤝', '#0891b2', 'Клуби та спільноти', 'Clubs & communities', 'Клуби за інтересами та професійні спільноти.', 'Interest clubs and professional communities.', 'coming_soon', 70),
  ('trade', '🌍', '#4f46e5', 'Міжнародна торгівля', 'International trade', 'Виробники, постачальники, імпорт та експорт.', 'Manufacturers, suppliers, import and export.', 'coming_soon', 80),
  ('china', '📦', '#b91c1c', 'Китай і постачання', 'China & supply', 'Товари з Китаю, виробники, логістика, оптові пропозиції.', 'Goods from China, manufacturers, logistics, wholesale offers.', 'coming_soon', 90),
  ('services', '🛠️', '#16a34a', 'Послуги', 'Services', 'Спеціалісти та компанії, які надають послуги.', 'Specialists and companies offering services.', 'coming_soon', 100),
  ('jobs', '💼', '#ca8a04', 'Робота і співпраця', 'Jobs & cooperation', 'Вакансії, пошук партнерів і співпраця.', 'Vacancies, partner search and cooperation.', 'coming_soon', 110),
  ('other', '✨', '#64748b', 'Інші напрямки', 'Other', 'Нові напрямки з’являтимуться тут.', 'New directions will appear here.', 'coming_soon', 120)
ON CONFLICT (slug) DO NOTHING;
