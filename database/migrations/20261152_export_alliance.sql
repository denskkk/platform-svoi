-- «Український експортний альянс»: проєкт отримав структуру папок і стає активним (адміністратор може змінити статус в адмінці).
UPDATE projects SET status = 'active' WHERE slug = 'export-alliance' AND status = 'coming_soon';
