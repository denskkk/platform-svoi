-- «Антикварна лавка» і «Клуби за інтересами»: нова структура папок. Адитивно, повторний запуск безпечний.
-- Антикваріат: старі оголошення без розділу потрапляють в «Онлайн-крамниці → Інше».
UPDATE listings SET data = data || jsonb_build_object('section', 'antiques_things_online_other')
WHERE project_slug = 'antiques' AND (data->>'section') IS NULL;

-- Клуби: товари клубів тепер лежать у папці «Клуби за інтересами».
UPDATE listings SET data = data || jsonb_build_object('section', 'clubs_interest_' || substr(data->>'section', 7))
WHERE project_slug = 'clubs' AND data->>'section' IN ('clubs_fishing_shop', 'clubs_hunting_shop', 'clubs_auto_shop', 'clubs_knitting_shop');
UPDATE listings SET data = data || jsonb_build_object('section', 'clubs_shops_other')
WHERE project_slug = 'clubs' AND data->>'section' IN ('clubs_creativity_shop', 'clubs_travel_shop', 'clubs_sport_shop', 'clubs_business_shop', 'clubs_professional_shop', 'clubs_bloggers_shop', 'clubs_streamers_shop', 'clubs_gamers_shop', 'clubs_other_shop');

-- Картинки папок: нові шляхи (interest.<клуб>[.shop]); старі записи лишаються для відкату.
INSERT INTO folder_images (project, path, image_url)
SELECT project, 'interest.' || path, image_url FROM folder_images
WHERE project = 'clubs' AND path IN ('fishing', 'hunting', 'auto', 'knitting', 'fishing.shop', 'hunting.shop', 'auto.shop', 'knitting.shop')
ON CONFLICT (project, path) DO NOTHING;
