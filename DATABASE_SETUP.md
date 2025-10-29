# 🚀 База даних готова до використання!

## ✅ Що вже створено

### 1. **Схема бази даних**
- ✅ `database/schema.sql` - Повна PostgreSQL схема
- ✅ `prisma/schema.prisma` - Prisma ORM схема
- ✅ `database/migrations/001_initial_schema.sql` - Початкова міграція

### 2. **Тестові дані**
- ✅ `database/seed.sql` - Готові дані для розробки
  - 9 категорій послуг
  - 10 міст України
  - 8 користувачів (включно з admin)
  - 10 послуг
  - 9 відгуків
  - 7 повідомлень

### 3. **Документація**
- ✅ `DATABASE.md` - Повна документація БД
- ✅ `database/README.md` - Інструкції та приклади
- ✅ `.env.example` - Налаштування середовища

### 4. **Інтеграція з Next.js**
- ✅ `src/lib/prisma.ts` - Prisma Client singleton
- ✅ `package.json` - Додано Prisma залежності та скрипти

---

## 📋 Наступні кроки

### Крок 1: Встановити залежності

```bash
npm install
```

Це встановить:
- `@prisma/client` - Prisma ORM клієнт
- `prisma` - Prisma CLI
- `bcrypt` - Хешування паролів
- `jsonwebtoken` - JWT токени

### Крок 2: Налаштувати базу даних

#### 2.1 Встановити PostgreSQL

**Якщо ще не встановлено:**

Windows:
```bash
# Завантажити з https://www.postgresql.org/download/windows/
# Або через Chocolatey:
choco install postgresql
```

macOS:
```bash
brew install postgresql@14
brew services start postgresql@14
```

Linux:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### 2.2 Створити базу даних

```bash
# Увійти в PostgreSQL
psql -U postgres

# В psql консолі:
CREATE DATABASE sviydliasvoyikh;

# Вийти
\q
```

#### 2.3 Налаштувати .env

```bash
# Скопіювати приклад
cp .env.example .env

# Відредагувати .env та вказати:
DATABASE_URL="postgresql://postgres:ваш_пароль@localhost:5432/sviydliasvoyikh"
JWT_SECRET="ваш-секретний-ключ-змініть-у-продакшн"
```

### Крок 3: Застосувати схему

**Варіант A - Через Prisma (рекомендовано):**

```bash
# Згенерувати Prisma Client
npm run db:generate

# Застосувати схему до БД
npm run db:push
```

**Варіант B - Прямий SQL:**

```bash
# Виконати SQL схему
psql -U postgres -d sviydliasvoyikh -f database/schema.sql
```

### Крок 4: Завантажити тестові дані

```bash
# Виконати seed файл
psql -U postgres -d sviydliasvoyikh -f database/seed.sql
```

Або через Node.js (якщо створите prisma/seed.ts):
```bash
npm run db:seed
```

### Крок 5: Перевірити результат

```bash
# Відкрити Prisma Studio
npm run db:studio
```

Відкриється GUI на `http://localhost:5555` де можна:
- Переглянути всі таблиці
- Перевірити тестові дані
- Редагувати записи

---

## 🎯 Тестові облікові записи

Після завантаження seed даних доступні:

### Звичайні користувачі (role: user)
| Email | Пароль | Професія |
|-------|--------|----------|
| oleksandr.kovalenko@example.com | password123 | Сантехнік |
| maria.petrenko@example.com | password123 | Перукар |
| viktor.shevchenko@example.com | password123 | Автомеханік |
| anna.sydorenko@example.com | password123 | Репетитор |
| dmytro.boyko@example.com | password123 | Веб-розробник |

### Бізнес-користувачі (role: business)
| Email | Пароль | Компанія |
|-------|--------|----------|
| ivan.melnyk@cleanpro.ua | password123 | CleanPro |
| oksana.lysenko@beautyspace.ua | password123 | Beauty Space |

### Адміністратор (role: admin)
| Email | Пароль |
|-------|--------|
| admin@sviydliasvoyikh.ua | password123 |

---

## 🛠️ Корисні команди

### Development
```bash
npm run dev          # Запустити Next.js сервер
npm run build        # Збілдити проєкт
npm run start        # Запустити production
```

### Database
```bash
npm run db:generate  # Згенерувати Prisma Client
npm run db:push      # Синхронізувати схему
npm run db:migrate   # Створити міграцію
npm run db:studio    # Відкрити GUI
```

### Prisma CLI
```bash
npx prisma format    # Форматувати schema.prisma
npx prisma validate  # Перевірити схему
npx prisma db pull   # Імпорт існуючої БД
```

---

## 📖 Приклади використання

### 1. Отримати користувача

```typescript
import { prisma } from '@/lib/prisma';

const user = await prisma.user.findUnique({
  where: { email: 'maria.petrenko@example.com' },
  include: {
    services: true,
    reviewsReceived: {
      include: {
        reviewer: true
      }
    }
  }
});
```

### 2. Пошук послуг

```typescript
const services = await prisma.service.findMany({
  where: {
    city: 'Київ',
    categoryId: 1
  },
  include: {
    user: true,
    category: true
  }
});
```

### 3. Створити відгук

```typescript
const review = await prisma.review.create({
  data: {
    reviewerId: 1,
    reviewedId: 2,
    rating: 5,
    comment: 'Чудовий майстер!'
  }
});
```

---

## 🔍 Перевірка

### SQL запити для перевірки

```sql
-- Кількість користувачів
SELECT COUNT(*) FROM users;

-- Топ користувачів по рейтингу
SELECT first_name, last_name, avg_rating, total_reviews
FROM users
WHERE is_verified = TRUE
ORDER BY avg_rating DESC
LIMIT 5;

-- Послуги по категоріях
SELECT c.name, COUNT(s.service_id) as services_count
FROM categories c
LEFT JOIN services s ON c.category_id = s.category_id
GROUP BY c.name;

-- Найактивніші міста
SELECT city, COUNT(*) as user_count
FROM users
WHERE is_verified = TRUE
GROUP BY city
ORDER BY user_count DESC;
```

---

## ❗ Можливі проблеми

### Помилка: "password authentication failed"

**Рішення:**
```bash
# 1. Перевірити пароль PostgreSQL
psql -U postgres

# 2. Змінити пароль
ALTER USER postgres WITH PASSWORD 'новий_пароль';

# 3. Оновити .env
DATABASE_URL="postgresql://postgres:новий_пароль@localhost:5432/sviydliasvoyikh"
```

### Помилка: "database does not exist"

**Рішення:**
```bash
psql -U postgres -c "CREATE DATABASE sviydliasvoyikh;"
```

### Помилка: "Prisma Client not generated"

**Рішення:**
```bash
npm run db:generate
```

### Помилка: TypeScript errors

**Це нормально!** Помилки зникнуть після `npm install`

---

## 📚 Документація

- [DATABASE.md](./DATABASE.md) - Повна документація БД
- [database/README.md](./database/README.md) - Інструкції БД
- [Prisma Docs](https://www.prisma.io/docs/) - Документація Prisma
- [PostgreSQL Docs](https://www.postgresql.org/docs/) - Документація PostgreSQL

---

## ✅ Чек-лист готовності

- [ ] PostgreSQL встановлено і запущено
- [ ] База даних `sviydliasvoyikh` створена
- [ ] Файл `.env` налаштовано
- [ ] Залежності встановлено (`npm install`)
- [ ] Prisma Client згенеровано (`npm run db:generate`)
- [ ] Схема застосована (`npm run db:push`)
- [ ] Seed дані завантажені
- [ ] Prisma Studio відкривається (`npm run db:studio`)
- [ ] Тестові користувачі доступні

---

## 🎉 Готово!

База даних повністю налаштована та готова до використання!

**Наступний крок:** Почати розробку API endpoints в `src/app/api/`

### Рекомендовані перші API маршрути:

1. **Auth API**
   - `POST /api/auth/register` - Реєстрація
   - `POST /api/auth/login` - Вхід
   - `POST /api/auth/logout` - Вихід
   - `GET /api/auth/me` - Поточний користувач

2. **Users API**
   - `GET /api/users` - Список користувачів
   - `GET /api/users/:id` - Профіль користувача
   - `PUT /api/users/:id` - Оновити профіль

3. **Services API**
   - `GET /api/services` - Каталог послуг
   - `GET /api/services/:id` - Деталі послуги
   - `POST /api/services` - Створити послугу

---

**Успіхів у розробці! 🚀🇺🇦**
