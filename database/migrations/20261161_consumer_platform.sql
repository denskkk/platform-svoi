-- «Платформа споживача та підприємця»: проєкт відкривається (чотири папки за ТЗ замовника) і отримує опис.
UPDATE projects SET
  status = 'active',
  description_uk = 'Об’єднуємо споживачів, підприємців та активних людей в єдину спільноту можливостей.',
  description_en = 'We unite consumers, entrepreneurs and active people into one community of opportunities.'
WHERE slug = 'consumer-platform';
