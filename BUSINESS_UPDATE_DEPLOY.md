# Обновление бизнес-анкеты - Инструкции по развертыванию

## Что было сделано

### 1. База данных
Добавлены новые поля в `business_info`:
- `partner_search_details` (JSONB) - детали поиска партнера
- `investor_search_details` (JSONB) - детали поиска инвестора
- `customer_search_details` (JSONB) - детали поиска клиентов
- `employee_vacancies` (JSONB) - массив вакансий
- `banner_url` (VARCHAR) - URL банера компании

### 2. Форма регистрации бизнеса
Обновлена `src/app/auth/register/business/page.tsx`:
- Добавлены условные поля для каждого типа поиска:
  - **Партнер**: тип партнера, сфера сотрудничества, условия
  - **Инвестор**: сумма, срок окупаемости, цели инвестиций, что предлагается
  - **Потребитель**: целевая аудитория, что предлагается, преимущества
  - **Работник**: управление вакансиями (должность, обязанности, требования, зарплата, тип занятости, опыт)
- Добавлена загрузка логотипа и банера компании

### 3. API
- Обновлен `/api/auth/register-business` для обработки новых полей
- Создан `/api/upload/business-images` для загрузки изображений

## Шаги для развертывания на production

### 1. На локальной машине (Windows)

```powershell
# Убедитесь, что все изменения сохранены
git add .
git commit -m "feat: Enhanced business registration with detailed search fields and image uploads"
git push origin main
```

### 2. На production сервере

```bash
# 1. Перейти в директорию проекта
cd /var/www/sviydlyasvoih/platform-svoi

# 2. Получить последние изменения
git pull origin main

# 3. Применить миграцию базы данных
psql -U sviy_user -d sviy_db -f database/migrations/004_add_business_details.sql

# Или использовать скрипт:
chmod +x apply-migration-simple.sh
./apply-migration-simple.sh database/migrations/004_add_business_details.sql

# 4. Создать директории для загрузки изображений
mkdir -p public/uploads/logos
mkdir -p public/uploads/banners
chmod -R 755 public/uploads

# 5. Обновить Prisma Client
npx prisma generate

# 6. Пересобрать приложение
npm run build

# 7. Перезапустить приложение
pm2 restart sviy-web

# 8. Проверить логи
pm2 logs sviy-web --lines 50
```

### 3. Проверка

После развертывания проверьте:

1. **Форма регистрации**: Перейдите на `/auth/register`, выберите "Бізнес" или "Бізнес Преміум"
2. **Условные поля**: Убедитесь, что при выборе чекбоксов появляются соответствующие поля
3. **Загрузка изображений**: Попробуйте загрузить логотип и банер
4. **Вакансии**: Добавьте несколько вакансий через кнопку "Додати вакансію"
5. **Регистрация**: Попробуйте зарегистрировать тестовый бизнес-аккаунт

### 4. Структура данных

#### Partner Search Details (JSON)
```json
{
  "type": "investor|supplier|distributor|franchise|strategic|other",
  "sphere": "текст",
  "collaboration": "текст"
}
```

#### Investor Search Details (JSON)
```json
{
  "amount": "текст",
  "term": "текст",
  "goals": "текст",
  "offer": "текст"
}
```

#### Customer Search Details (JSON)
```json
{
  "target": "текст",
  "offer": "текст",
  "benefits": "текст"
}
```

#### Employee Vacancies (JSON Array)
```json
[
  {
    "position": "текст",
    "responsibilities": "текст",
    "requirements": "текст",
    "salary": "текст",
    "employmentType": "full-time|part-time|remote|contract|freelance",
    "experience": "текст"
  }
]
```

## Возможные проблемы и решения

### Проблема 1: Ошибка прав доступа к директориям
```bash
# Решение
sudo chown -R www-data:www-data public/uploads
sudo chmod -R 755 public/uploads
```

### Проблема 2: Миграция не применяется
```bash
# Проверить подключение к БД
psql -U sviy_user -d sviy_db -c "SELECT 1"

# Применить вручную
psql -U sviy_user -d sviy_db < database/migrations/004_add_business_details.sql
```

### Проблема 3: Изображения не загружаются
```bash
# Проверить существование директорий
ls -la public/uploads/

# Создать если нужно
mkdir -p public/uploads/{logos,banners}
chmod -R 755 public/uploads
```

### Проблема 4: Prisma Client не обновился
```bash
# Пересоздать Prisma Client
npx prisma generate --schema=./prisma/schema.prisma
```

## Откат изменений (если что-то пошло не так)

```bash
# Откат миграции
psql -U sviy_user -d sviy_db <<EOF
ALTER TABLE business_info DROP COLUMN IF EXISTS partner_search_details;
ALTER TABLE business_info DROP COLUMN IF EXISTS investor_search_details;
ALTER TABLE business_info DROP COLUMN IF EXISTS customer_search_details;
ALTER TABLE business_info DROP COLUMN IF EXISTS employee_vacancies;
ALTER TABLE business_info DROP COLUMN IF EXISTS banner_url;
EOF

# Откат кода
cd /var/www/sviydlyasvoih/platform-svoi
git reset --hard HEAD~1
npm run build
pm2 restart sviy-web
```

## Тестовые данные

Для тестирования используйте:
- Email: test-business@example.com
- Пароль: test123
- Название компании: Тестова Компанія
- Попробуйте заполнить все типы поиска и добавить вакансии

## Примечания

- Логотип рекомендуется 400x400px, максимум 5MB
- Банер рекомендуется 1200x400px, максимум 10MB
- Поддерживаемые форматы: JPG, PNG, GIF, WebP
- Вакансии можно добавлять и удалять динамически
- Детальные поля появляются только при выборе соответствующего типа поиска
