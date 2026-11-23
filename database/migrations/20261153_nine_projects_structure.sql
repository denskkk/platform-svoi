-- Дев'ять проєктів отримали структуру папок (знайомства, містика, гранти, краса, варті уваги, медіамережа, кооперативи, застосунки, відбудова).
-- Міграція адитивна: назви проєктів не змінюються, дані не видаляються.
UPDATE projects SET status = 'active'
WHERE slug IN ('dating','mystic','grants','beauty','notable','media-network','cooperatives','apps','rebuild') AND status = 'coming_soon';
