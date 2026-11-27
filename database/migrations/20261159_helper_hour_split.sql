-- «Помічник на годину»: «Оренда та робота» розділено на окремі папки «Виконую роботу» та «Оренда».
-- Розділи оголошень перейменовано; адитивно, повторний запуск безпечний.
UPDATE listings SET data = jsonb_set(data, '{section}', to_jsonb(replace(data->>'section', 'helper_hour_work_rent_', 'helper_hour_rent_')))
WHERE project_slug = 'helper-hour' AND data->>'section' LIKE 'helper_hour_work_rent_%';
UPDATE listings SET data = jsonb_set(data, '{section}', to_jsonb(replace(data->>'section', 'helper_hour_work_job_', 'helper_hour_job_')))
WHERE project_slug = 'helper-hour' AND data->>'section' LIKE 'helper_hour_work_job_%';
