-- Перелік проєктів від замовника (18.11). Існуючі проєкти перейменовуються і впорядковуються,
-- нових немає у БД — додаються зі статусом coming_soon (статус існуючих НЕ змінюється).
INSERT INTO projects (slug, icon, color, name_uk, name_en, description_uk, description_en, status, sort_order, updated_at) VALUES
  ('antiques', '🏺', '#92400e', 'Антикварна лавка для своїх', 'Antiques shop for your own', 'Антикваріат і колекційні речі від своїх.', 'Antiques and collectibles from your own people.', 'coming_soon', 1, NOW()),
  ('dating', '💞', '#be185d', 'Знайомства зі своїми', 'Dating with your own', 'Знайомства в колі своїх.', 'Meet people within your community.', 'coming_soon', 2, NOW()),
  ('mystic', '🔮', '#6d28d9', 'Містика для своїх', 'Mystic for your own', 'Містика, езотерика, практики.', 'Mystic, esoterica, practices.', 'coming_soon', 3, NOW()),
  ('china', '📦', '#b91c1c', 'Китай — закупівлі під ключ для своїх', 'China — turnkey sourcing for your own', 'Закупівлі з Китаю «під ключ».', 'Turnkey sourcing from China.', 'coming_soon', 4, NOW()),
  ('clubs', '🤝', '#0e7490', 'Клуби за інтересами для своїх', 'Interest clubs for your own', 'Риболовля, полювання, в’язання, мандрівки, спорт, творчість.', 'Fishing, hunting, knitting, travel, sport, creativity.', 'coming_soon', 5, NOW()),
  ('shops', '🛍️', '#6d28d9', 'Крамниця для своїх', 'Shop for your own', 'Справжня українська продукція від українських виробників.', 'Genuine Ukrainian products from Ukrainian producers.', 'coming_soon', 6, NOW()),
  ('knitting', '🧶', '#be123c', 'Клуб в’язання зі своїми', 'Knitting club with your own', 'Клуб в’язання.', 'Knitting club.', 'coming_soon', 7, NOW()),
  ('trade', '🌍', '#3730a3', 'Ярмарки української продукції у світі', 'Ukrainian product fairs worldwide', 'Ярмарки української продукції по всьому світу.', 'Fairs of Ukrainian products around the world.', 'coming_soon', 8, NOW()),
  ('rebuild', '🏗️', '#15803d', 'Відбудова України', 'Rebuilding Ukraine', 'Проєкти та участь у відбудові.', 'Projects and participation in rebuilding.', 'coming_soon', 9, NOW()),
  ('bank', '🏦', '#1e3a8a', 'Банк для своїх', 'Bank for your own', 'Фінансові сервіси для своїх.', 'Financial services for your own.', 'coming_soon', 10, NOW()),
  ('cooperatives', '🤲', '#0f766e', 'Кооперативи для своїх', 'Cooperatives for your own', 'Кооперативи та спільні ініціативи.', 'Cooperatives and joint initiatives.', 'coming_soon', 11, NOW()),
  ('grants', '🎓', '#a16207', 'Гранти для своїх', 'Grants for your own', 'Гранти та програми підтримки.', 'Grants and support programs.', 'coming_soon', 12, NOW()),
  ('taxi', '🚕', '#eab308', 'Таксі для своїх', 'Taxi for your own', 'Замовити таксі, стати водієм, заробляти зі своїми.', 'Order a taxi, become a driver, earn with your own people.', 'coming_soon', 13, NOW()),
  ('real-estate', '🏠', '#12705f', 'Агентство нерухомості для своїх', 'Real estate agency for your own', 'Купити, продати, орендувати, здати нерухомість.', 'Buy, sell, rent and let property.', 'coming_soon', 14, NOW()),
  ('turnkey', '🔑', '#0a3d62', 'Бізнес під ключ для своїх', 'Turnkey business for your own', 'Готові бізнеси та запуск під ключ.', 'Ready businesses and turnkey launch.', 'coming_soon', 15, NOW()),
  ('jobs', '💼', '#a16207', 'Робота для своїх', 'Jobs for your own', 'Вакансії та пошук роботи.', 'Vacancies and job search.', 'coming_soon', 16, NOW()),
  ('consumer-platform', '🧾', '#334155', 'Платформа споживача та підприємця', 'Consumer & entrepreneur platform', 'Платформа для споживачів і підприємців.', 'A platform for consumers and entrepreneurs.', 'coming_soon', 17, NOW()),
  ('apps', '📱', '#1d4ed8', 'Застосунки для своїх', 'Apps for your own', 'Застосунки від своїх.', 'Apps from your own people.', 'coming_soon', 18, NOW()),
  ('translator', '🌐', '#0e7490', 'Перекладач для своїх', 'Translator for your own', 'Переклади та перекладачі.', 'Translations and translators.', 'coming_soon', 19, NOW()),
  ('health', '🩺', '#1b6fb3', 'Здоров’я', 'Health', 'Лікарі, дієтологи, тренери.', 'Doctors, dietitians, trainers.', 'coming_soon', 20, NOW()),
  ('invest', '📈', '#166534', 'Дошка оголошень інвестиційних проєктів та пошуку інвесторів', 'Investment projects & investor board', 'Інвестиційні проєкти та пошук інвесторів.', 'Investment projects and investor search.', 'coming_soon', 21, NOW()),
  ('lawyers', '⚖️', '#1e3a8a', 'Адвокатське об’єднання «Свій»', 'Law association “Svii”', 'Адвокати та консультації.', 'Lawyers and consultations.', 'coming_soon', 22, NOW()),
  ('travel', '✈️', '#0369a1', 'Турагенція для своїх', 'Travel agency for your own', 'Тури та подорожі.', 'Tours and travel.', 'coming_soon', 23, NOW()),
  ('cars', '🚗', '#1e4fa8', 'Автосалон онлайн для своїх', 'Online car dealership for your own', 'Купити авто, автосалони, «шукаю».', 'Buy a car, dealerships, “looking for”.', 'coming_soon', 24, NOW()),
  ('pets', '🐾', '#b45309', 'Онлайн зоомагазин', 'Online pet shop', 'Товари для тварин.', 'Pet supplies.', 'coming_soon', 25, NOW())
ON CONFLICT (slug) DO UPDATE SET
  name_uk = EXCLUDED.name_uk, name_en = EXCLUDED.name_en,
  description_uk = EXCLUDED.description_uk, description_en = EXCLUDED.description_en,
  sort_order = EXCLUDED.sort_order, updated_at = NOW();
-- Лише проєкти зі списку замовника: решта (категорії) ховається, не видаляється (повернути можна в /admin/projects).
UPDATE projects SET status = 'hidden', sort_order = 100 + sort_order WHERE slug IN ('sport','events','services','other');
