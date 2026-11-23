-- Структури проєктів за ТЗ замовника: розширений текст заявки, перенос оголошень зі старих розділів у нові підрозділи.
-- Адитивно, повторний запуск безпечний (оновлюються лише рядки зі старим значенням section).
ALTER TABLE project_suggestions ALTER COLUMN text TYPE VARCHAR(3000);

UPDATE listings l SET data = l.data || jsonb_build_object('section', m.new_id)
FROM (VALUES
  ('helper-hour', 'helper_hour_masters',   'helper_hour_masters_misc'),
  ('helper-hour', 'helper_hour_need',      'helper_hour_work_job_need'),
  ('helper-hour', 'helper_hour_rent',      'helper_hour_work_rent_other'),
  ('jobs',        'jobs_seekers',          'jobs_apply_candidates'),
  ('cars',        'cars_shops',            'cars_shops_other'),
  ('health',      'health_shops',          'health_shops_goods'),
  ('turnkey',     'turnkey_projects',      'turnkey_partners'),
  ('turnkey',     'turnkey_export',        'turnkey_partners'),
  ('travel',      'travel_tickets',        'travel_tickets_avia'),
  ('travel',      'travel_insurance',      'travel_insurance_medical'),
  ('pets',        'pets_shops',            'pets_shops_accessories'),
  ('pets',        'pets_vet',              'pets_vet_general'),
  ('pets',        'pets_training',         'pets_training_dogs'),
  ('pets',        'pets_nutrition',        'pets_nutrition_food'),
  ('pets',        'pets_travel',           'pets_travel_transport'),
  ('pets',        'pets_support',          'pets_support_shelters'),
  ('pets',        'pets_sitting_walking',  'pets_walking_can'),
  ('translator',  'translator_documents',  'translator_translators_other')
) AS m(slug, old_id, new_id)
WHERE l.project_slug = m.slug AND l.data->>'section' = m.old_id;

-- Інвестори: раніше профілі були відкритими; нове поле visibility за замовчуванням «open».
UPDATE listings SET data = data || jsonb_build_object('visibility', 'open')
WHERE project_slug = 'invest' AND data->>'section' = 'invest_investors' AND (data->>'visibility') IS NULL;
