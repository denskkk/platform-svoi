# 🚀 Швидкий старт для Windows

## Крок 1: Встановлення PostgreSQL

### Варіант A: Через офіційний інсталятор
1. Завантажте PostgreSQL з https://www.postgresql.org/download/windows/
2. Запустіть інсталятор
3. Під час встановлення запам'ятайте пароль для користувача `postgres`
4. Порт за замовчуванням: `5432`

### Варіант B: Через Chocolatey
```powershell
choco install postgresql
```

### Варіант C: Через Docker (рекомендовано для розробки)
```powershell
# Завантажити та запустити PostgreSQL в Docker
docker run --name sviy-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:14

# Перевірити що працює
docker ps
```

---

## Крок 2: Створення бази даних

### Через psql (командний рядок)
```powershell
# Підключитись до PostgreSQL
psql -U postgres

# В psql консолі:
CREATE DATABASE sviydliasvoyikh;
\q
```

### Через pgAdmin (GUI)
1. Відкрийте pgAdmin
2. Підключіться до локального сервера
3. Права кнопка на "Databases" → Create → Database
4. Ім'я: `sviydliasvoyikh`
5. Save

---

## Крок 3: Налаштування проєкту

### 1. Налаштувати .env
```powershell
# Скопіювати приклад
Copy-Item .env.example .env

# Відредагувати .env (відкрити в блокноті або VS Code)
notepad .env
```

**Замінити DATABASE_URL:**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sviydliasvoyikh?schema=public"
```

Де:
- `postgres:postgres` - username:password
- `localhost:5432` - host:port
- `sviydliasvoyikh` - назва бази даних

### 2. Встановити залежності
```powershell
npm install
```

### 3. Згенерувати Prisma Client
```powershell
npm run db:generate
```

### 4. Застосувати схему до БД
```powershell
npm run db:push
```

Ви побачите:
```
✔ Generated Prisma Client
✔ Schema applied to database
```

---

## Крок 4: Завантажити тестові дані

### Варіант A: Через psql
```powershell
psql -U postgres -d sviydliasvoyikh -f database/seed.sql
```

### Варіант B: Через pgAdmin
1. Відкрийте pgAdmin
2. Виберіть базу `sviydliasvoyikh`
3. Tools → Query Tool
4. File → Open → виберіть `database/seed.sql`
5. Execute (F5)

---

## Крок 5: Запустити проєкт

```powershell
npm run dev
```

Відкрийте браузер: **http://localhost:3000**

---

## 🧪 Тестування

### Тестові акаунти (після завантаження seed.sql):

**Користувач 1 (Сантехнік):**
- Email: `oleksandr.kovalenko@example.com`
- Пароль: `password123`

**Користувач 2 (Перукар):**
- Email: `maria.petrenko@example.com`
- Пароль: `password123`

**Адміністратор:**
- Email: `admin@sviydliasvoyikh.ua`
- Пароль: `password123`

### Тестування API через PowerShell:

#### Реєстрація
```powershell
$body = @{
    firstName = "Іван"
    lastName = "Тестовий"
    email = "ivan.test@example.com"
    password = "password123"
    city = "Київ"
} | ConvertTo-Json

$response = Invoke-WebRequest `
    -Uri http://localhost:3000/api/auth/register `
    -Method POST `
    -Body $body `
    -ContentType "application/json"

$response.Content | ConvertFrom-Json
```

#### Вхід
```powershell
$body = @{
    email = "ivan.test@example.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-WebRequest `
    -Uri http://localhost:3000/api/auth/login `
    -Method POST `
    -Body $body `
    -ContentType "application/json"

$data = $response.Content | ConvertFrom-Json
$token = $data.token
Write-Host "Token: $token"
```

#### Отримати профіль
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
}

$response = Invoke-WebRequest `
    -Uri http://localhost:3000/api/profile/1 `
    -Method GET `
    -Headers $headers

$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

---

## 🛠️ Корисні команди

### PostgreSQL
```powershell
# Перевірити чи працює PostgreSQL
Get-Service postgresql*

# Запустити службу
Start-Service postgresql-x64-14

# Зупинити службу
Stop-Service postgresql-x64-14

# Підключитись до БД
psql -U postgres -d sviydliasvoyikh

# Показати всі таблиці (в psql)
\dt

# Вийти з psql
\q
```

### Prisma
```powershell
# Відкрити Prisma Studio (GUI для БД)
npm run db:studio
# Відкриється на http://localhost:5555

# Створити нову міграцію
npm run db:migrate

# Скинути БД та застосувати схему заново
npx prisma migrate reset
```

### Next.js
```powershell
# Запустити dev сервер
npm run dev

# Збілдити для production
npm run build

# Запустити production сервер
npm run start

# Перевірити ESLint
npm run lint
```

---

## ❗ Вирішення проблем

### Помилка: "Port 5432 is already in use"
PostgreSQL вже запущено. Це нормально, використовуйте існуючий.

### Помилка: "password authentication failed"
Перевірте пароль в DATABASE_URL (.env файл)

### Помилка: "database does not exist"
Створіть базу даних:
```powershell
psql -U postgres -c "CREATE DATABASE sviydliasvoyikh;"
```

### Помилка: "Prisma Client not generated"
```powershell
npm run db:generate
```

### Помилка при seed.sql
Спочатку застосуйте схему:
```powershell
npm run db:push
```
Потім завантажте seed дані.

---

## 📊 Перевірка що все працює

### 1. PostgreSQL
```powershell
psql -U postgres -c "SELECT version();"
```

### 2. База даних
```powershell
psql -U postgres -c "\l" | Select-String "sviydliasvoyikh"
```

### 3. Таблиці
```powershell
psql -U postgres -d sviydliasvoyikh -c "\dt"
```

### 4. Кількість користувачів
```powershell
psql -U postgres -d sviydliasvoyikh -c "SELECT COUNT(*) FROM users;"
```

### 5. API
Відкрийте: http://localhost:3000/api/categories

---

## 🎯 Готово!

Якщо всі кроки виконані, ви побачите:
- ✅ Головна сторінка на http://localhost:3000
- ✅ Сторінка реєстрації на http://localhost:3000/auth/register
- ✅ API працює на http://localhost:3000/api
- ✅ База даних з тестовими даними

**Успіхів! 🚀**
