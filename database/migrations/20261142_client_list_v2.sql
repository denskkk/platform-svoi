-- Перелік проєктів, версія 2 (замовник, 22.11): новий порядок за важливістю + три нові проєкти за списком замовника
-- («Помічник на годину», «Український експортний альянс», «Світ краси») і ще два з його переліку (24 пункти).
-- Безпечно для повторного запуску: статус існуючих проєктів не змінюється, дані не видаляються.
INSERT INTO projects (slug, icon, color, name_uk, name_en, description_uk, description_en, status, sort_order, updated_at) VALUES
  ('lawyers', '⚖️', '#1e3a8a', 'Адвокатське об’єднання «Свій»', 'Law association “Svii”', 'Адвокати онлайн та офлайн, кабінет адвоката, команда.', 'Lawyers online and offline, lawyer cabinet, team.', 'coming_soon', 1, NOW()),
  ('real-estate', '🏠', '#12705f', 'Агентство нерухомості для своїх', 'Real estate agency for your own', 'Купити, продати, орендувати, здати нерухомість. Усе для дому.', 'Buy, sell, rent and let property. Everything for the home.', 'coming_soon', 2, NOW()),
  ('jobs', '💼', '#a16207', 'Робота для своїх', 'Jobs for your own', 'Вакансії та пошук роботи.', 'Vacancies and job search.', 'coming_soon', 3, NOW()),
  ('cars', '🚗', '#1e4fa8', 'Автосалон онлайн для своїх', 'Online car dealership for your own', 'Купити авто, оренда авто, усе для авто.', 'Buy a car, rent a car, everything for cars.', 'coming_soon', 4, NOW()),
  ('shops', '🛍️', '#6d28d9', 'Крамниця для своїх', 'Shop for your own', 'Справжня українська продукція від українських виробників.', 'Genuine Ukrainian products from Ukrainian producers.', 'coming_soon', 5, NOW()),
  ('health', '🩺', '#1b6fb3', 'Здоров’я для своїх', 'Health for your own', 'Лікарі, харчування, спорт і фітнес, психологи, відновлення, для вагітних і дітей.', 'Doctors, nutrition, sport and fitness, psychologists, recovery, for pregnant women and children.', 'coming_soon', 6, NOW()),
  ('helper-hour', '🛠️', '#f59e0b', 'Помічник на годину для своїх', 'Helper for an hour for your own', 'Майстри й спеціалісти, оренда інструментів, виконання робіт, заявки на роботу.', 'Handymen and specialists, tool rental, jobs done, work requests.', 'coming_soon', 7, NOW()),
  ('translator', '🌐', '#0e7490', 'Перекладач для своїх', 'Translator for your own', 'Перекладачі, переклад документів і текстів.', 'Translators, document and text translation.', 'coming_soon', 8, NOW()),
  ('turnkey', '🔑', '#0a3d62', 'Бізнес під ключ для своїх', 'Turnkey business for your own', 'Спеціалісти для бізнесу, підбір партнерів, експорт і ринок збуту.', 'Business specialists, partner matching, export and sales markets.', 'coming_soon', 9, NOW()),
  ('china', '📦', '#b91c1c', 'Китай — закупівлі під ключ для своїх', 'China — turnkey sourcing for your own', 'Закупівлі з Китаю «під ключ».', 'Turnkey sourcing from China.', 'coming_soon', 10, NOW()),
  ('invest', '📈', '#166534', 'Дошка оголошень інвестиційних проєктів та пошуку інвесторів', 'Investment projects & investor board', 'Проєкти, інвестори, спеціалісти для виконання проєктів.', 'Projects, investors, specialists to carry out projects.', 'coming_soon', 11, NOW()),
  ('export-alliance', '🚢', '#0f766e', 'Український експортний альянс зі своїми', 'Ukrainian export alliance with your own', 'Експорт українських товарів і пошук ринків збуту за кордоном.', 'Export of Ukrainian goods and search for sales markets abroad.', 'coming_soon', 12, NOW()),
  ('taxi', '🚕', '#eab308', 'Таксі для своїх', 'Taxi for your own', 'Замовити таксі, стати водієм, формувати команду.', 'Order a taxi, become a driver, build a team.', 'coming_soon', 13, NOW()),
  ('travel', '✈️', '#0369a1', 'Турагентство для своїх', 'Travel agency for your own', 'Тури, гарячі пропозиції, квитки, страхування.', 'Tours, hot deals, tickets, insurance.', 'coming_soon', 14, NOW()),
  ('pets', '🐾', '#b45309', 'Онлайн зоомагазин', 'Online pet shop', 'Усе для тварин: товари, ветеринари, догляд, перетримка.', 'Everything for pets: goods, vets, grooming, pet sitting.', 'coming_soon', 15, NOW()),
  ('beauty', '💄', '#db2777', 'Світ краси для своїх', 'World of beauty for your own', 'Краса та догляд від своїх.', 'Beauty and care from your own.', 'coming_soon', 16, NOW()),
  ('antiques', '🏺', '#92400e', 'Антикварна лавка для своїх', 'Antiques shop for your own', 'Антикваріат і колекційні речі від своїх.', 'Antiques and collectibles from your own people.', 'coming_soon', 17, NOW()),
  ('clubs', '🤝', '#0e7490', 'Клуби за інтересами для своїх', 'Interest clubs for your own', 'Полювання, риболовля, в’язання, блогери, стрімери, геймери та інші клуби.', 'Hunting, fishing, knitting, bloggers, streamers, gamers and other clubs.', 'coming_soon', 18, NOW()),
  ('dating', '💞', '#be185d', 'Знайомства зі своїми', 'Dating with your own', 'Знайомства в колі своїх.', 'Meet people within your community.', 'coming_soon', 19, NOW()),
  ('mystic', '🔮', '#6d28d9', 'Містика для своїх', 'Mystic for your own', 'Містика, езотерика, практики.', 'Mystic, esoterica, practices.', 'coming_soon', 20, NOW()),
  ('grants', '🎓', '#a16207', 'Гранти для своїх', 'Grants for your own', 'Гранти та програми підтримки.', 'Grants and support programs.', 'coming_soon', 21, NOW()),
  ('trade', '🌍', '#3730a3', 'Міжнародні ярмарки української продукції у світі', 'International fairs of Ukrainian products worldwide', 'Виробники, реалізатори й організатори ярмарок.', 'Producers, sellers and fair organizers.', 'coming_soon', 22, NOW()),
  ('notable', '⭐', '#ca8a04', 'Свої варті уваги', 'Your own worth noticing', 'Люди, проєкти й бізнеси, які варто знати.', 'People, projects and businesses worth knowing.', 'coming_soon', 23, NOW()),
  ('media-network', '📰', '#334155', 'Медіамережа свої', 'Media network of your own', 'Свої медіа: блогери, новини, журнали.', 'Own media: bloggers, news, magazines.', 'coming_soon', 24, NOW()),
  ('apps', '📱', '#1d4ed8', 'Застосунки для своїх', 'Apps for your own', 'Застосунки від своїх.', 'Apps from your own people.', 'coming_soon', 25, NOW()),
  ('cooperatives', '🤲', '#0f766e', 'Кооперативи для своїх', 'Cooperatives for your own', 'Кооперативи та спільні ініціативи.', 'Cooperatives and joint initiatives.', 'coming_soon', 26, NOW()),
  ('rebuild', '🏗️', '#15803d', 'Відбудова України', 'Rebuilding Ukraine', 'Проєкти та участь у відбудові.', 'Projects and participation in rebuilding.', 'coming_soon', 27, NOW())
ON CONFLICT (slug) DO UPDATE SET
  icon = EXCLUDED.icon, name_uk = EXCLUDED.name_uk, name_en = EXCLUDED.name_en,
  description_uk = EXCLUDED.description_uk, description_en = EXCLUDED.description_en,
  sort_order = EXCLUDED.sort_order, updated_at = NOW();
-- Усунуто зі списку замовника: «Банк для своїх» (не потрібен у проєктах), окремий «Клуб в’язання» (тепер клуб усередині
-- «Клубів за інтересами»), «Платформа споживача» (немає в списку). Ховаються, не видаляються (повернути можна в /admin/projects).
UPDATE projects SET status = 'hidden', sort_order = 200 + sort_order, updated_at = NOW()
WHERE slug IN ('bank', 'knitting', 'consumer-platform') AND status <> 'hidden';

-- Проєкти, у яких уже є папки й оголошення, робимо доступними (нові напрями, що були «скоро»).
UPDATE projects SET status = 'active', updated_at = NOW()
WHERE status = 'coming_soon'
  AND slug IN ('lawyers', 'helper-hour', 'translator', 'turnkey', 'china', 'invest', 'travel', 'pets', 'trade');
