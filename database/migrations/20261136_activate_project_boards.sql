-- Проєкти з готовою дошкою оголошень стають активними (лише якщо ще «скоро»; приховані не чіпаємо).
UPDATE projects SET status = 'active'
WHERE status = 'coming_soon'
  AND slug IN ('antiques','mystic','rebuild','cooperatives','grants','turnkey','apps','translator','invest','travel','pets');
