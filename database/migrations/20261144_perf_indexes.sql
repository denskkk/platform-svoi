-- Індекси для швидкої роботи при великій кількості користувачів (адитивно, безпечно повторювати).
-- Розділ оголошення (папка проєкту) лежить у JSON data: фільтр f_section іде по виразу data->>'section'.
CREATE INDEX IF NOT EXISTS idx_listings_project_section ON listings (project_slug, (data->>'section'), created_at DESC);
-- Стрічка закритих і власних дописів, репости профілю
CREATE INDEX IF NOT EXISTS idx_posts_author_private_id ON posts (author_id, is_private, post_id DESC);
CREATE INDEX IF NOT EXISTS idx_posts_repost_of ON posts (repost_of_id);
