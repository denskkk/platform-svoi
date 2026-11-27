-- «Платформа споживача та підприємця» — перший проєкт у списку; додається «Комфортний дім — все для дому».
INSERT INTO projects (slug, icon, color, name_uk, name_en, description_uk, description_en, status, sort_order, updated_at) VALUES
  ('comfort-home', '🏠', '#b45309', 'Комфортний дім — все для дому', 'Comfortable home — everything for the home',
   'Меблі, техніка, інтер’єр і послуги майстрів: великий маркетплейс для дому, квартири та комфортного життя.',
   'Furniture, appliances, interior and craftsmen services: a large marketplace for your home.', 'active', 26, NOW())
ON CONFLICT (slug) DO UPDATE SET
  name_uk = EXCLUDED.name_uk, name_en = EXCLUDED.name_en,
  description_uk = EXCLUDED.description_uk, description_en = EXCLUDED.description_en,
  icon = EXCLUDED.icon, color = EXCLUDED.color, status = 'active', updated_at = NOW();
UPDATE projects SET sort_order = 0, updated_at = NOW() WHERE slug = 'consumer-platform';
