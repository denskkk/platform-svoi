-- Розкладає наявні оголошення (без розділу) по папках нової структури проєктів.
-- Адитивно: змінюється лише JSON data (додається ключ "section"), лише там, де його ще немає. Повторний запуск безпечний.
UPDATE listings SET data = data || jsonb_build_object('section', CASE
    WHEN project_slug = 'real-estate' AND data->>'dealType' = 'rent' THEN 'real_estate_rent'
    WHEN project_slug = 'real-estate' THEN 'real_estate_sale'
    WHEN project_slug = 'jobs' AND data->>'jobKind' = 'resume' THEN 'jobs_seekers'
    WHEN project_slug = 'jobs' THEN 'jobs_vacancies'
    WHEN project_slug = 'cars' THEN 'cars_buy'
    WHEN project_slug = 'invest' AND data->>'investKind' = 'investor' THEN 'invest_investors'
    WHEN project_slug = 'invest' THEN 'invest_projects'
    WHEN project_slug = 'health' AND data->>'healthKind' IN ('dietitian', 'nutrition') THEN 'health_nutrition_dietitian'
    WHEN project_slug = 'health' AND data->>'healthKind' = 'rehab' THEN 'health_recovery_masseurs'
    WHEN project_slug = 'health' THEN 'health_doctors_family'
    WHEN project_slug = 'shops' THEN 'shops_food_meat'
    WHEN project_slug = 'lawyers' THEN 'lawyers_advocates'
    WHEN project_slug = 'helper-hour' THEN 'helper_hour_masters'
    WHEN project_slug = 'translator' THEN 'translator_documents'
    WHEN project_slug = 'turnkey' THEN 'turnkey_partners'
    WHEN project_slug = 'china' THEN 'china_consult_custom'
    WHEN project_slug = 'travel' THEN 'travel_turnkey'
    WHEN project_slug = 'pets' THEN 'pets_animals_other_list'
    WHEN project_slug = 'trade' THEN 'trade_producers'
  END)
WHERE project_slug IN ('real-estate','jobs','cars','invest','health','shops','lawyers','helper-hour','translator','turnkey','china','travel','pets','trade')
  AND (data->>'section') IS NULL;
