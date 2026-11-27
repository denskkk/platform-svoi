-- «Нерухомість»: ділянки та будинки об'єднані в одну папку; новобудови стали фільтром «вторинка / новобудова» усередині «Квартир».
-- Адитивно, повторний запуск безпечний.
UPDATE listings SET data = data || jsonb_build_object('section', 'real_estate_sale_houses')
WHERE project_slug = 'real-estate' AND data->>'section' = 'real_estate_sale_land';

UPDATE listings SET data = (data || jsonb_build_object('section', 'real_estate_sale_apartments', 'marketType', 'newbuild')) - 'propertyType' || jsonb_build_object('propertyType', 'apartment')
WHERE project_slug = 'real-estate' AND data->>'section' = 'real_estate_sale_newbuilds';

UPDATE listings SET data = data || jsonb_build_object('marketType', 'secondary')
WHERE project_slug = 'real-estate' AND data->>'section' = 'real_estate_sale_apartments' AND NOT (data ? 'marketType');
