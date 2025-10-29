# 🐳 Швидкий старт з Docker

## Крок 1: Запустіть Docker Desktop

1. Знайдіть **Docker Desktop** в меню Пуск
2. Запустіть програму
3. Почекайте поки з'явиться зелений статус "Docker Desktop is running"

---

## Крок 2: Запустіть проєкт

Відкрийте **PowerShell** (як адміністратор) та виконайте:

```powershell
.\start.ps1
```

Або виконайте команди вручну:

### 2.1. Запустити PostgreSQL
```powershell
docker run --name sviy-postgres `
    -e POSTGRES_USER=postgres `
    -e POSTGRES_PASSWORD=postgres `
    -e POSTGRES_DB=sviydliasvoyikh `
    -p 5432:5432 `
    -d postgres:14-alpine
```

### 2.2. Почекати 5 секунд
```powershell
Start-Sleep -Seconds 5
```

### 2.3. Застосувати схему БД
```powershell
npm run db:generate
npm run db:push
```

### 2.4. Завантажити тестові дані
```powershell
docker cp database/seed.sql sviy-postgres:/tmp/seed.sql
docker exec sviy-postgres psql -U postgres -d sviydliasvoyikh -f /tmp/seed.sql
```

### 2.5. Запустити Next.js
```powershell
npm run dev
```

---

## Крок 3: Відкрийте браузер

- **Frontend:** http://localhost:3000
- **API:** http://localhost:3000/api

---

## 🧪 Тестування

### Тестові акаунти:
- **Email:** oleksandr.kovalenko@example.com
- **Пароль:** password123

### Тестування реєстрації:
1. Відкрийте http://localhost:3000/auth/register
2. Заповніть форму
3. Після реєстрації ви отримаєте JWT токен

### Тестування API через PowerShell:
```powershell
# Реєстрація
$body = @{
    firstName = "Іван"
    lastName = "Тестовий"
    email = "ivan@test.com"
    password = "password123"
    city = "Київ"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:3000/api/auth/register `
    -Method POST -Body $body -ContentType "application/json" | 
    Select-Object -ExpandProperty Content
```

---

## 🛠️ Корисні команди

### Перевірити що PostgreSQL працює:
```powershell
docker ps | Select-String "sviy-postgres"
```

### Підключитись до БД:
```powershell
docker exec -it sviy-postgres psql -U postgres -d sviydliasvoyikh
```

В psql консолі:
```sql
-- Показати всі таблиці
\dt

-- Показати всіх користувачів
SELECT * FROM users;

-- Вийти
\q
```

### Зупинити PostgreSQL:
```powershell
docker stop sviy-postgres
```

### Запустити знову:
```powershell
docker start sviy-postgres
```

### Видалити контейнер:
```powershell
docker rm -f sviy-postgres
```

### Відкрити Prisma Studio (GUI для БД):
```powershell
npm run db:studio
```
Відкриється на http://localhost:5555

---

## ❗ Вирішення проблем

### Помилка: "docker: The system cannot find the file specified"
**Рішення:** Запустіть Docker Desktop

### Помилка: "port is already allocated"
**Рішення:**
```powershell
docker stop sviy-postgres
docker rm sviy-postgres
# Потім запустіть знову
```

### Помилка: "Prisma Client not generated"
**Рішення:**
```powershell
npm run db:generate
```

### Помилка при seed.sql
**Рішення:**
```powershell
# Спочатку застосуйте схему
npm run db:push

# Потім seed
docker exec sviy-postgres psql -U postgres -d sviydliasvoyikh -f /tmp/seed.sql
```

---

## ✅ Перевірка що все працює

1. **PostgreSQL:**
```powershell
docker exec sviy-postgres psql -U postgres -c "SELECT version();"
```

2. **База даних:**
```powershell
docker exec sviy-postgres psql -U postgres -d sviydliasvoyikh -c "\dt"
```

3. **Кількість користувачів:**
```powershell
docker exec sviy-postgres psql -U postgres -d sviydliasvoyikh -c "SELECT COUNT(*) FROM users;"
```

4. **API:**
Відкрийте: http://localhost:3000/api/categories

---

## 🎯 Готово!

Якщо все працює, ви маєте:
- ✅ PostgreSQL в Docker
- ✅ Next.js на http://localhost:3000
- ✅ API на http://localhost:3000/api
- ✅ Тестові дані в БД

**Успіхів! 🚀**
