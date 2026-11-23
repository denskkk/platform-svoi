-- «Нерухомість»: старі розділи real_estate_sale / real_estate_rent стали папками з підрозділами.
-- Наявні оголошення переносяться в підрозділ за типом об'єкта (propertyType). Адитивно, повторний запуск безпечний.
UPDATE listings SET data = data || jsonb_build_object('section', CASE data->>'propertyType'
    WHEN 'house' THEN 'real_estate_sale_houses'
    WHEN 'land' THEN 'real_estate_sale_land'
    WHEN 'commercial' THEN 'real_estate_sale_commercial'
    ELSE 'real_estate_sale_apartments' END)
WHERE project_slug = 'real-estate' AND data->>'section' = 'real_estate_sale';

UPDATE listings SET data = data || jsonb_build_object('section', CASE data->>'propertyType'
    WHEN 'house' THEN 'real_estate_rent_houses'
    WHEN 'commercial' THEN 'real_estate_rent_commercial'
    ELSE 'real_estate_rent_apartments' END)
WHERE project_slug = 'real-estate' AND data->>'section' = 'real_estate_rent';
