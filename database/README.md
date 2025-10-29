# 🗄️ База даних

## Швидкий старт

### 1. Встановлення PostgreSQL

**Windows:**
```bash
# Завантажити з офіційного сайту
https://www.postgresql.org/download/windows/

# Або через Chocolatey
choco install postgresql
```

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Створення бази даних

```bash
# Увійти в PostgreSQL
psql -U postgres

# Створити базу даних
CREATE DATABASE sviydliasvoyikh;

# Створити користувача (опціонально)
CREATE USER sviy_admin WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE sviydliasvoyikh TO sviy_admin;

# Вийти
\q
```

### 3. Налаштування проєкту

```bash
# 1. Копіювати .env.example в .env
cp .env.example .env

# 2. Редагувати .env та вказати DATABASE_URL
# DATABASE_URL="postgresql://postgres:password@localhost:5432/sviydliasvoyikh?schema=public"

# 3. Встановити залежності
npm install

# 4. Згенерувати Prisma Client
npm run db:generate

# 5. Застосувати схему до бази даних
npm run db:push
```

### 4. Завантаження тестових даних

```bash
# Виконати SQL seed файл
psql -U postgres -d sviydliasvoyikh -f database/seed.sql

# Або використати Prisma Studio для перегляду даних
npm run db:studio
```

---

## Структура директорії

```
database/
├── schema.sql          # Повна схема PostgreSQL
├── seed.sql           # Тестові дані
└── README.md          # Цей файл

prisma/
├── schema.prisma      # Prisma schema
└── migrations/        # Історія міграцій (auto-generated)

src/lib/
└── prisma.ts          # Prisma Client singleton
```

---

## Доступні команди

| Команда | Опис |
|---------|------|
| `npm run db:generate` | Генерує Prisma Client з schema.prisma |
| `npm run db:push` | Синхронізує Prisma schema з базою даних |
| `npm run db:migrate` | Створює нову міграцію |
| `npm run db:studio` | Відкриває Prisma Studio (GUI) |
| `npm run db:seed` | Завантажує seed дані |

---

## Міграції

### Створення міграції

```bash
# 1. Відредагувати prisma/schema.prisma
# 2. Створити міграцію
npm run db:migrate

# 3. Ввести назву міграції (наприклад: add_user_avatar)
```

### Застосування міграцій у production

```bash
npx prisma migrate deploy
```

### Відкат міграції

```bash
npx prisma migrate resolve --rolled-back <migration_name>
```

---

## Prisma Studio

Візуальний редактор бази даних:

```bash
npm run db:studio
```

Відкриється на `http://localhost:5555`

**Можливості:**
- ✅ Перегляд всіх таблиць
- ✅ Редагування даних
- ✅ Фільтрація та пошук
- ✅ Відносини між таблицями

---

## Приклади використання

### Отримати користувача з послугами

```typescript
import { prisma } from '@/lib/prisma';

const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' },
  include: {
    services: {
      include: {
        category: true
      }
    },
    reviewsReceived: true,
    businessInfo: true
  }
});
```

### Пошук послуг

```typescript
const services = await prisma.service.findMany({
  where: {
    city: 'Київ',
    categoryId: 1,
    AND: [
      { priceFrom: { gte: 500 } },
      { priceTo: { lte: 2000 } }
    ]
  },
  include: {
    user: {
      select: {
        firstName: true,
        lastName: true,
        avgRating: true,
        isVerified: true
      }
    }
  },
  orderBy: {
    user: {
      avgRating: 'desc'
    }
  },
  take: 20
});
```

### Створення користувача

```typescript
import bcrypt from 'bcrypt';

const hashedPassword = await bcrypt.hash('password123', 10);

const newUser = await prisma.user.create({
  data: {
    role: 'user',
    firstName: 'Іван',
    lastName: 'Іваненко',
    email: 'ivan@example.com',
    phone: '+380671234567',
    passwordHash: hashedPassword,
    city: 'Київ',
    isVerified: false
  }
});
```

### Додати відгук

```typescript
const review = await prisma.review.create({
  data: {
    reviewerId: 1,
    reviewedId: 2,
    rating: 5,
    comment: 'Чудовий майстер!'
  }
});

// Рейтинг користувача оновиться автоматично через тригер
```

### Відправити повідомлення

```typescript
const message = await prisma.message.create({
  data: {
    senderId: 1,
    receiverId: 2,
    text: 'Доброго дня! Цікавить ваша послуга.',
    isRead: false
  }
});

// Створити сповіщення
await prisma.notification.create({
  data: {
    userId: 2,
    type: 'new_message',
    title: 'Нове повідомлення',
    message: 'Іван надіслав вам повідомлення',
    relatedUserId: 1,
    isRead: false
  }
});
```

---

## Тестові дані

Після виконання `seed.sql` ви матимете:

- **9 категорій послуг** (Побут, Авто, Краса, etc.)
- **10 міст України** (Київ, Харків, Одеса, etc.)
- **8 користувачів**:
  - 5 звичайних (user)
  - 2 бізнес-акаунти (business)
  - 1 адміністратор (admin)
- **10 послуг**
- **9 відгуків**
- **7 повідомлень**
- **6 обраних профілів**
- **4 сповіщення**

**Тестовий пароль для всіх користувачів:** `password123`

---

## Backup і Restore

### Створення backup

```bash
# Повний backup
pg_dump -U postgres -d sviydliasvoyikh -F c -f backup.dump

# Тільки структура
pg_dump -U postgres -d sviydliasvoyikh --schema-only -f schema.sql

# Тільки дані
pg_dump -U postgres -d sviydliasvoyikh --data-only -f data.sql
```

### Відновлення

```bash
# З dump файлу
pg_restore -U postgres -d sviydliasvoyikh -c backup.dump

# З SQL файлу
psql -U postgres -d sviydliasvoyikh -f schema.sql
```

---

## Налагодження

### Перевірка підключення

```bash
# Спробувати підключитися
psql $DATABASE_URL

# Або
psql -U postgres -d sviydliasvoyikh
```

### Типові помилки

**Помилка: `password authentication failed`**
```bash
# Редагувати pg_hba.conf
# Змінити метод аутентифікації на 'md5'
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Перезапустити PostgreSQL
sudo systemctl restart postgresql
```

**Помилка: `database does not exist`**
```bash
# Створити базу даних
psql -U postgres -c "CREATE DATABASE sviydliasvoyikh;"
```

**Помилка: Prisma Client not generated**
```bash
# Згенерувати Prisma Client
npm run db:generate
```

---

## Моніторинг

### Активні з'єднання

```sql
SELECT count(*) FROM pg_stat_activity 
WHERE datname = 'sviydliasvoyikh';
```

### Розмір бази даних

```sql
SELECT pg_size_pretty(pg_database_size('sviydliasvoyikh'));
```

### Найповільніші запити

```sql
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## Production

### Оптимізація

```sql
-- Увімкнути автовакуумування
ALTER TABLE users SET (autovacuum_enabled = true);

-- Аналізувати таблиці
ANALYZE users;
ANALYZE services;

-- Перебудувати індекси
REINDEX DATABASE sviydliasvoyikh;
```

### Безпека

1. **Використовувати окремого користувача:**
```sql
CREATE USER app_user WITH PASSWORD 'strong_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
```

2. **Обмежити доступ:**
```bash
# pg_hba.conf
host sviydliasvoyikh app_user 127.0.0.1/32 md5
```

3. **SSL з'єднання:**
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/db?sslmode=require"
```

---

## Додаткові ресурси

- 📖 [Повна документація бази даних](./DATABASE.md)
- 🔧 [Prisma документація](https://www.prisma.io/docs/)
- 🐘 [PostgreSQL документація](https://www.postgresql.org/docs/)
- 🎥 [Prisma YouTube Channel](https://www.youtube.com/c/PrismaData)

---

**Потрібна допомога?**
- 📧 Email: dev@sviydliasvoyikh.ua
- 💬 Telegram: @sviy_support
