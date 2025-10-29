# 🇺🇦 СВІЙ ДЛЯ СВОЇХ — Платформа українських послуг

Платформа для пошуку та пропозиції послуг від українців для українців.

## 🚀 Швидкий старт

### 1. Встановлення залежностей

```bash
# Клонувати репозиторій (якщо потрібно)
git clone https://github.com/your-username/sviy-dlya-svoyikh.git
cd sviy-dlya-svoyikh

# Встановити залежності
npm install
```

### 2. Налаштування бази даних

```bash
# Створити файл .env
cp .env.example .env

# Відредагувати .env та вказати DATABASE_URL
# DATABASE_URL="postgresql://username:password@localhost:5432/sviydliasvoyikh"

# Застосувати схему до бази даних
npm run db:push

# Завантажити тестові дані
psql -U postgres -d sviydliasvoyikh -f database/seed.sql
```

**Детальна інструкція:** [database/README.md](./database/README.md)

### 3. Запуск проєкту

```bash
# Запустити dev сервер
npm run dev

# Відкрити браузер на http://localhost:3000
```

## 📁 Структура проєкту

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Головна сторінка
│   ├── auth/              # Авторизація/реєстрація
│   ├── profile/           # Профілі користувачів
│   ├── catalog/           # Каталог послуг
│   ├── chat/              # Чат
│   └── api/               # API routes (майбутнє)
├── components/            # React компоненти
│   ├── layout/           # Layout компоненти
│   ├── ui/               # UI елементи
│   └── features/         # Функціональні компоненти
├── lib/                  # Утиліти та хелпери
│   └── prisma.ts         # Prisma Client
└── styles/              # Глобальні стилі

database/
├── schema.sql           # PostgreSQL схема
├── seed.sql            # Тестові дані
└── README.md           # Документація БД

prisma/
└── schema.prisma       # Prisma ORM схема
```

## 🎨 Дизайн-система

### Кольори
- **Жовтий** (#FFCA00) - головний акцент
- **Блакитний** (#007FE6) - додатковий акцент
- **Бежевий** (#F7F3EF) - фон

### Типографіка
- **Display**: Montserrat
- **Body**: Inter

## 🛠️ Технології

### Frontend
- Next.js 14 (App Router)
- React 18
- TypeScript 5
- Tailwind CSS 3.4
- Framer Motion (анімації)
- Lucide React (іконки)

### Backend & Database
- PostgreSQL 14+
- Prisma ORM 5
- bcrypt (хешування паролів)
- JWT (аутентифікація)

### Dev Tools
- ESLint
- TypeScript ESLint
- PostCSS
- Autoprefixer

## 📱 Особливості

### Frontend
- ✅ Адаптивний дизайн (mobile-first)
- ✅ Українська мова
- ✅ Плавні анімації (Framer Motion)
- ✅ SEO-оптимізація
- ✅ Швидке завантаження

### Database
- ✅ PostgreSQL з підтримкою UTF-8
- ✅ 12 нормалізованих таблиць (3NF)
- ✅ Автоматичні тригери для рейтингів
- ✅ Індекси для швидкого пошуку
- ✅ Розраховано на 10,000+ користувачів

### Функціонал
- 👤 Профілі користувачів з рейтингами
- 📋 Каталог послуг з 9 категоріями
- ⭐ Система відгуків та оцінок
- 💬 Приватні повідомлення
- 🔔 Сповіщення
- ❤️ Обрані профілі
- 🚩 Система скарг
- 🔍 Пошук та фільтрація

## 📊 База даних

### Структура
- **users** - Користувачі платформи
- **categories** - Категорії послуг
- **services** - Оголошення про послуги
- **business_info** - Розширені бізнес-профілі
- **reviews** - Відгуки та оцінки
- **messages** - Приватні повідомлення
- **favorites** - Обрані профілі
- **reports** - Скарги
- **notifications** - Сповіщення
- **sessions** - Активні сесії
- **search_logs** - Логи пошуку
- **cities** - Довідник міст України

**Детальна документація:** [DATABASE.md](./DATABASE.md)

## 🔧 Доступні команди

### Development
```bash
npm run dev          # Запустити dev сервер
npm run build        # Збілдити для production
npm run start        # Запустити production сервер
npm run lint         # Запустити ESLint
```

### Database
```bash
npm run db:generate  # Генерувати Prisma Client
npm run db:push      # Синхронізувати схему з БД
npm run db:migrate   # Створити міграцію
npm run db:studio    # Відкрити Prisma Studio (GUI)
npm run db:seed      # Завантажити тестові дані
```

## 🔌 API Endpoints

Платформа має повний REST API для всіх операцій:

### Аутентифікація
- `POST /api/auth/register` - Реєстрація
- `POST /api/auth/login` - Вхід
- `POST /api/auth/logout` - Вихід

### Профілі
- `GET /api/profile/:id` - Отримати профіль
- `PUT /api/profile/:id` - Оновити профіль

### Послуги
- `GET /api/services` - Список послуг з фільтрами
- `POST /api/services` - Створити послугу
- `GET /api/services/:id` - Деталі послуги
- `PUT /api/services/:id` - Оновити послугу
- `DELETE /api/services/:id` - Видалити послугу

### Відгуки
- `POST /api/reviews` - Створити відгук
- `GET /api/reviews?userId=:id` - Отримати відгуки

### Повідомлення
- `GET /api/messages` - Отримати повідомлення
- `POST /api/messages` - Відправити повідомлення

### Обране
- `GET /api/favorites` - Список обраних
- `POST /api/favorites` - Додати в обране
- `DELETE /api/favorites` - Видалити з обраного

### Довідники
- `GET /api/categories` - Всі категорії
- `GET /api/cities` - Всі міста

**Повна API документація:** [API.md](./API.md)

