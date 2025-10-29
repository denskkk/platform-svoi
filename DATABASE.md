# 📊 База даних - СВІЙ ДЛЯ СВОЇХ

## Зміст
- [Огляд](#огляд)
- [ER Діаграма](#er-діаграма)
- [Структура таблиць](#структура-таблиць)
- [Зв'язки](#звязки)
- [Індекси](#індекси)
- [Тригери](#тригери)
- [Використання](#використання)

---

## Огляд

База даних розроблена для платформи "СВІЙ ДЛЯ СВОЇХ" - соціальної мережі для пошуку та пропозиції послуг.

### Технічні характеристики

- **СУБД**: PostgreSQL 12+
- **Кодування**: UTF-8 (підтримка українських символів)
- **Нормалізація**: 3NF
- **ORM**: Prisma
- **Розрахункова ємність**: до 10,000 користувачів

### Основні можливості

- ✅ Управління користувачами та ролями (user, business, viewer, admin)
- ✅ Каталог послуг з категоріями
- ✅ Система відгуків та рейтингів
- ✅ Обмін повідомленнями
- ✅ Обране та закладки
- ✅ Система сповіщень
- ✅ Скарги та модерація
- ✅ Аналітика пошуків

---

## ER Діаграма

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│   USERS     │───┬───│  SERVICES    │───────│ CATEGORIES  │
│             │   │   │              │       │             │
│ user_id (PK)│   │   │ service_id   │       │ category_id │
│ role        │   │   │ user_id (FK) │       │ name        │
│ email       │   │   │ category_id  │       │ slug        │
│ city        │   │   │ title        │       └─────────────┘
│ avg_rating  │   │   │ price        │
│ is_verified │   │   │              │
└─────────────┘   │   └──────────────┘
       │          │
       │          │   ┌──────────────┐
       │          └───│ BUSINESS_INFO│
       │              │              │
       │              │ user_id (FK) │
       │              │ company_name │
       │              │ work_hours   │
       │              └──────────────┘
       │
       ├──────────────┬──────────────┬──────────────┬──────────────┐
       │              │              │              │              │
       ▼              ▼              ▼              ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ REVIEWS  │   │ MESSAGES │   │FAVORITES │   │ REPORTS  │   │SESSIONS  │
│          │   │          │   │          │   │          │   │          │
│reviewer  │   │sender    │   │user_id   │   │reporter  │   │user_id   │
│reviewed  │   │receiver  │   │target    │   │reported  │   │token     │
│rating    │   │text      │   │          │   │reason    │   │          │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘

       │
       ▼
┌──────────────┐       ┌──────────────┐
│NOTIFICATIONS │       │  CITIES      │
│              │       │              │
│ user_id (FK) │       │ name         │
│ type         │       │ region       │
│ message      │       │ users_count  │
└──────────────┘       └──────────────┘

       │
       ▼
┌──────────────┐
│ SEARCH_LOGS  │
│              │
│ user_id (FK) │
│ query        │
│ results      │
└──────────────┘
```

---

## Структура таблиць

### 1. **users** - Користувачі
Основна таблиця з інформацією про всіх користувачів платформи.

| Поле | Тип | Опис |
|------|-----|------|
| `user_id` | SERIAL PRIMARY KEY | Унікальний ідентифікатор |
| `role` | VARCHAR(20) | Роль: user, business, viewer, admin |
| `first_name` | VARCHAR(100) | Ім'я |
| `last_name` | VARCHAR(100) | Прізвище |
| `email` | VARCHAR(255) UNIQUE | Email (унікальний) |
| `phone` | VARCHAR(20) | Телефон |
| `password_hash` | VARCHAR(255) | Хеш пароля (bcrypt) |
| `avatar_url` | TEXT | URL аватара |
| `city` | VARCHAR(100) | Місто |
| `region` | VARCHAR(100) | Район/область |
| `gender` | VARCHAR(10) | Стать |
| `age` | INTEGER | Вік |
| `bio` | TEXT | Біографія |
| `avg_rating` | DECIMAL(3,2) | Середній рейтинг (0.00-5.00) |
| `total_reviews` | INTEGER | Кількість відгуків |
| `is_verified` | BOOLEAN | Чи верифікований |
| `created_at` | TIMESTAMP | Дата реєстрації |
| `updated_at` | TIMESTAMP | Дата оновлення |

**Індекси:**
- `idx_users_email` - швидкий пошук по email
- `idx_users_city` - фільтрація по місту
- `idx_users_role` - фільтрація по ролі
- `idx_users_verified` - пошук верифікованих користувачів

---

### 2. **categories** - Категорії послуг
Довідник категорій для класифікації послуг.

| Поле | Тип | Опис |
|------|-----|------|
| `category_id` | SERIAL PRIMARY KEY | ID категорії |
| `name` | VARCHAR(100) UNIQUE | Назва (українською) |
| `slug` | VARCHAR(100) UNIQUE | URL-friendly назва |
| `emoji` | VARCHAR(10) | Емодзі для іконки |
| `description` | TEXT | Опис категорії |
| `sort_order` | INTEGER | Порядок сортування |

**Приклади категорій:**
- 🏠 Побут
- 🚗 Авто
- 💇 Краса
- 🎓 Освіта
- 🧰 Ремонт
- 💼 Бізнес
- 💻 IT
- ⚕️ Медицина
- 🎨 Творчість

---

### 3. **services** - Послуги
Оголошення про послуги від користувачів.

| Поле | Тип | Опис |
|------|-----|------|
| `service_id` | SERIAL PRIMARY KEY | ID послуги |
| `user_id` | INTEGER FK | Автор оголошення |
| `category_id` | INTEGER FK | Категорія |
| `title` | VARCHAR(255) | Назва послуги |
| `description` | TEXT | Детальний опис |
| `price_from` | DECIMAL(10,2) | Ціна від |
| `price_to` | DECIMAL(10,2) | Ціна до |
| `price_unit` | VARCHAR(50) | Одиниця виміру (грн, грн/год) |
| `city` | VARCHAR(100) | Місто надання послуги |
| `created_at` | TIMESTAMP | Дата створення |
| `updated_at` | TIMESTAMP | Дата оновлення |

**Індекси:**
- `idx_services_user` - послуги користувача
- `idx_services_category` - послуги в категорії
- `idx_services_city` - послуги в місті

---

### 4. **business_info** - Бізнес-профілі
Розширена інформація для бізнес-акаунтів.

| Поле | Тип | Опис |
|------|-----|------|
| `business_id` | SERIAL PRIMARY KEY | ID бізнесу |
| `user_id` | INTEGER FK UNIQUE | Власник (1:1) |
| `company_name` | VARCHAR(255) | Назва компанії |
| `description` | TEXT | Опис бізнесу |
| `address` | TEXT | Фізична адреса |
| `work_hours` | TEXT | Години роботи |
| `website` | VARCHAR(255) | Веб-сайт |
| `social_links` | JSONB | Соц. мережі |
| `gallery` | JSONB | Галерея фото (масив URL) |

**Приклад JSONB:**
```json
{
  "social_links": {
    "facebook": "cleanpro.ua",
    "instagram": "@cleanpro_kyiv"
  },
  "gallery": [
    "https://cdn.example.com/photo1.jpg",
    "https://cdn.example.com/photo2.jpg"
  ]
}
```

---

### 5. **reviews** - Відгуки
Система відгуків та оцінок користувачів.

| Поле | Тип | Опис |
|------|-----|------|
| `review_id` | SERIAL PRIMARY KEY | ID відгуку |
| `reviewer_id` | INTEGER FK | Хто залишив |
| `reviewed_id` | INTEGER FK | Кому залишили |
| `rating` | INTEGER (1-5) | Оцінка |
| `comment` | TEXT | Текст відгуку |
| `created_at` | TIMESTAMP | Дата створення |

**Унікальність:** Один користувач може залишити лише один відгук іншому.

**Індекси:**
- `idx_reviews_reviewed` - всі відгуки користувача
- `idx_reviews_rating` - сортування по рейтингу

**Тригер:** Автоматичне оновлення `avg_rating` та `total_reviews` в таблиці `users`.

---

### 6. **messages** - Повідомлення
Приватні повідомлення між користувачами.

| Поле | Тип | Опис |
|------|-----|------|
| `message_id` | SERIAL PRIMARY KEY | ID повідомлення |
| `sender_id` | INTEGER FK | Відправник |
| `receiver_id` | INTEGER FK | Отримувач |
| `text` | TEXT | Текст повідомлення |
| `is_read` | BOOLEAN | Чи прочитано |
| `created_at` | TIMESTAMP | Дата відправки |

**Індекси:**
- `idx_messages_sender` - повідомлення від користувача
- `idx_messages_receiver` - повідомлення до користувача
- `idx_messages_unread` - непрочитані повідомлення

---

### 7. **favorites** - Обране
Закладки користувачів.

| Поле | Тип | Опис |
|------|-----|------|
| `favorite_id` | SERIAL PRIMARY KEY | ID запису |
| `user_id` | INTEGER FK | Користувач |
| `target_user_id` | INTEGER FK | Збережений профіль |
| `created_at` | TIMESTAMP | Коли додано |

**Унікальність:** Не можна додати одного користувача двічі.

---

### 8. **reports** - Скарги
Система скарг на користувачів.

| Поле | Тип | Опис |
|------|-----|------|
| `report_id` | SERIAL PRIMARY KEY | ID скарги |
| `reporter_id` | INTEGER FK | Хто скаржиться |
| `reported_id` | INTEGER FK | На кого скарга |
| `reason` | TEXT | Причина скарги |
| `status` | VARCHAR(20) | pending/reviewed/resolved |
| `created_at` | TIMESTAMP | Дата створення |
| `resolved_at` | TIMESTAMP | Дата вирішення |

**Індекси:**
- `idx_reports_status` - фільтрація по статусу
- `idx_reports_reported` - всі скарги на користувача

---

### 9. **notifications** - Сповіщення
Системні сповіщення для користувачів.

| Поле | Тип | Опис |
|------|-----|------|
| `notification_id` | SERIAL PRIMARY KEY | ID сповіщення |
| `user_id` | INTEGER FK | Одержувач |
| `type` | VARCHAR(50) | Тип (new_message, new_review) |
| `title` | VARCHAR(255) | Заголовок |
| `message` | TEXT | Текст сповіщення |
| `related_user_id` | INTEGER FK | Пов'язаний користувач |
| `is_read` | BOOLEAN | Чи прочитано |
| `created_at` | TIMESTAMP | Дата створення |

**Індекси:**
- `idx_notifications_user` - сповіщення користувача
- `idx_notifications_unread` - непрочитані сповіщення

---

### 10. **sessions** - Сесії
Активні сесії користувачів (JWT токени).

| Поле | Тип | Опис |
|------|-----|------|
| `session_id` | SERIAL PRIMARY KEY | ID сесії |
| `user_id` | INTEGER FK | Користувач |
| `token` | VARCHAR(500) UNIQUE | JWT токен |
| `ip_address` | VARCHAR(45) | IP адреса |
| `user_agent` | TEXT | User Agent браузера |
| `expires_at` | TIMESTAMP | Термін дії |
| `created_at` | TIMESTAMP | Дата створення |

**Індекси:**
- `idx_sessions_token` - швидкий пошук по токену
- `idx_sessions_user` - всі сесії користувача

---

### 11. **search_logs** - Логи пошуку
Аналітика пошукових запитів.

| Поле | Тип | Опис |
|------|-----|------|
| `log_id` | SERIAL PRIMARY KEY | ID запису |
| `user_id` | INTEGER FK | Користувач (nullable) |
| `query` | VARCHAR(255) | Пошуковий запит |
| `category_id` | INTEGER FK | Категорія фільтра |
| `city` | VARCHAR(100) | Місто фільтра |
| `results_count` | INTEGER | Кількість результатів |
| `created_at` | TIMESTAMP | Дата пошуку |

**Використання:** Аналіз популярних запитів, покращення рекомендацій.

---

### 12. **cities** - Міста
Довідник міст України.

| Поле | Тип | Опис |
|------|-----|------|
| `city_id` | SERIAL PRIMARY KEY | ID міста |
| `name` | VARCHAR(100) UNIQUE | Назва міста |
| `region` | VARCHAR(100) | Область |
| `latitude` | DECIMAL(10,8) | Широта |
| `longitude` | DECIMAL(11,8) | Довгота |
| `users_count` | INTEGER | Кількість користувачів |
| `services_count` | INTEGER | Кількість послуг |

**Приклади:** Київ, Харків, Одеса, Дніпро, Львів...

---

## Зв'язки

### Один-до-багатьох (1:N)
- `users` → `services` (користувач має багато послуг)
- `users` → `reviews` (користувач написав багато відгуків)
- `categories` → `services` (категорія містить багато послуг)
- `users` → `messages` (користувач відправив багато повідомлень)

### Багато-до-багатьох (M:N)
- `users` ↔ `users` через `favorites` (користувач може мати багато обраних)
- `users` ↔ `users` через `reviews` (взаємні відгуки)

### Один-до-одного (1:1)
- `users` → `business_info` (бізнес-користувач має один розширений профіль)

---

## Індекси

### Критичні індекси для продуктивності

```sql
-- Пошук користувачів
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_city ON users(city);
CREATE INDEX idx_users_role ON users(role);

-- Каталог послуг
CREATE INDEX idx_services_category ON services(category_id);
CREATE INDEX idx_services_city ON services(city);
CREATE INDEX idx_services_user ON services(user_id);

-- Відгуки та рейтинги
CREATE INDEX idx_reviews_reviewed ON reviews(reviewed_id);
CREATE INDEX idx_reviews_rating ON reviews(rating DESC);

-- Повідомлення
CREATE INDEX idx_messages_receiver ON messages(receiver_id, is_read);
CREATE INDEX idx_messages_sender ON messages(sender_id);
```

---

## Тригери

### 1. Автоматичне оновлення `updated_at`

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';
```

**Застосовується до:** `users`, `services`

### 2. Оновлення рейтингу користувача

```sql
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users
    SET avg_rating = (
        SELECT AVG(rating)::DECIMAL(3,2)
        FROM reviews
        WHERE reviewed_id = NEW.reviewed_id
    ),
    total_reviews = (
        SELECT COUNT(*)
        FROM reviews
        WHERE reviewed_id = NEW.reviewed_id
    )
    WHERE user_id = NEW.reviewed_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';
```

**Тригер:** `trigger_update_rating` на `reviews` (AFTER INSERT/UPDATE)

---

## Використання

### Підключення до бази даних

**Налаштування `.env`:**
```env
DATABASE_URL="postgresql://username:password@localhost:5432/sviydliasvoyikh?schema=public"
```

### Ініціалізація бази даних

```bash
# 1. Створити базу даних
psql -U postgres -c "CREATE DATABASE sviydliasvoyikh;"

# 2. Виконати схему
psql -U postgres -d sviydliasvoyikh -f database/schema.sql

# 3. Завантажити seed дані
psql -U postgres -d sviydliasvoyikh -f database/seed.sql

# 4. Ініціалізувати Prisma
npx prisma generate
npx prisma db push
```

### Приклади запитів через Prisma

#### Отримати користувача з бізнес-інформацією

```typescript
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' },
  include: {
    businessInfo: true,
    services: {
      include: {
        category: true
      }
    },
    reviewsReceived: {
      include: {
        reviewer: {
          select: {
            firstName: true,
            lastName: true,
            avatarUrl: true
          }
        }
      }
    }
  }
});
```

#### Пошук послуг з фільтрами

```typescript
const services = await prisma.service.findMany({
  where: {
    city: 'Київ',
    categoryId: 1,
    priceFrom: { gte: 500 },
    priceTo: { lte: 2000 }
  },
  include: {
    user: {
      select: {
        firstName: true,
        lastName: true,
        avatarUrl: true,
        avgRating: true,
        isVerified: true
      }
    },
    category: true
  },
  orderBy: {
    user: {
      avgRating: 'desc'
    }
  }
});
```

#### Створення відгуку

```typescript
const review = await prisma.review.create({
  data: {
    reviewerId: currentUserId,
    reviewedId: targetUserId,
    rating: 5,
    comment: 'Чудовий майстер! Рекомендую!'
  }
});

// Рейтинг автоматично оновиться через тригер
```

#### Відправка повідомлення

```typescript
const message = await prisma.message.create({
  data: {
    senderId: currentUserId,
    receiverId: targetUserId,
    text: 'Доброго дня! Цікавить ваша послуга.'
  }
});

// Створити сповіщення
await prisma.notification.create({
  data: {
    userId: targetUserId,
    type: 'new_message',
    title: 'Нове повідомлення',
    message: `${senderName} надіслав вам повідомлення`,
    relatedUserId: currentUserId
  }
});
```

---

## Безпека

### 1. Паролі
- Використовується **bcrypt** для хешування
- Мінімум 10 rounds для salt
- Пароль ніколи не зберігається у відкритому вигляді

### 2. SQL Injection
- **Prisma ORM** автоматично захищає від SQL Injection
- Всі запити параметризовані

### 3. Приватність
- Номер телефону видимий тільки верифікованим користувачам
- Email не відображається публічно
- Можливість блокування користувачів

### 4. Автентифікація
- JWT токени з обмеженим терміном дії
- Refresh токени для оновлення
- Зберігання активних сесій у таблиці `sessions`

---

## Міграції

### Створення нової міграції

```bash
# Створити міграцію після змін в schema.prisma
npx prisma migrate dev --name add_new_field

# Застосувати міграції в production
npx prisma migrate deploy
```

### Відкат міграції

```bash
# Відкотити останню міграцію
npx prisma migrate resolve --rolled-back <migration_name>
```

---

## Оптимізація

### 1. Індекси
- Регулярно перевіряти використання індексів
- Видаляти невикористовувані індекси
- Додавати composite indexes для складних запитів

### 2. Кешування
- Redis для кешування популярних запитів
- Кеш списку категорій (змінюється рідко)
- Кеш топ-рейтингових користувачів

### 3. Партиціонування
При масштабуванні:
- Партиціонувати таблицю `messages` по датах
- Партиціонувати `search_logs` по місяцях
- Архівувати старі дані

---

## Моніторинг

### Критичні метрики

```sql
-- Кількість активних користувачів
SELECT COUNT(*) FROM users WHERE is_verified = TRUE;

-- Середній час відгуку
SELECT AVG(EXTRACT(EPOCH FROM (created_at - updated_at))) 
FROM messages 
WHERE is_read = TRUE;

-- Найпопулярніші категорії
SELECT c.name, COUNT(s.service_id) as services_count
FROM categories c
LEFT JOIN services s ON c.category_id = s.category_id
GROUP BY c.name
ORDER BY services_count DESC;

-- Топ міст по активності
SELECT city, COUNT(*) as user_count
FROM users
WHERE is_verified = TRUE
GROUP BY city
ORDER BY user_count DESC
LIMIT 10;
```

---

## Backup та Відновлення

### Створення backup

```bash
# Full backup
pg_dump -U postgres -d sviydliasvoyikh -F c -f backup_$(date +%Y%m%d).dump

# Тільки схема
pg_dump -U postgres -d sviydliasvoyikh --schema-only -f schema_backup.sql

# Тільки дані
pg_dump -U postgres -d sviydliasvoyikh --data-only -f data_backup.sql
```

### Відновлення

```bash
# З повного backup
pg_restore -U postgres -d sviydliasvoyikh -c backup_20240101.dump

# З SQL файлу
psql -U postgres -d sviydliasvoyikh -f schema_backup.sql
```

---

## Версіонування

- **Версія 1.0** (Поточна)
  - 12 основних таблиць
  - Підтримка ролей користувачів
  - Система відгуків та рейтингів
  - Приватні повідомлення

- **Запланована версія 1.1**
  - Додати таблицю `transactions` для платежів
  - Додати `user_settings` для налаштувань
  - Розширити `services` для підтримки варіантів послуг

---

## Підтримка

Для питань щодо бази даних:
- 📧 Email: dev@sviydliasvoyikh.ua
- 📖 Документація: [DATABASE.md](./DATABASE.md)
- 🔧 Prisma документація: https://www.prisma.io/docs/

---

**Остання оновлена:** 2024
**Автор:** СВІЙ ДЛЯ СВОЇХ Team
