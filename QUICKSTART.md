# Швидкий старт проєкту

## Windows (PowerShell)

### Метод 1: Використання скрипту
```powershell
# Запустіть скрипт
.\start.ps1

# Або право кнопкою миші -> "Виконати з PowerShell"
```

### Метод 2: Вручну
```powershell
# Встановити залежності
npm install

# Запустити dev сервер
npm run dev
```

## Після запуску

Відкрийте браузер на: **http://localhost:3000**

## Структура навігації

- **Головна** (`/`) - Hero, Категорії, Популярні профілі
- **Каталог** (`/catalog`) - Пошук послуг з фільтрами
- **Профіль** (`/profile/1`) - Детальна інформація про користувача
- **Реєстрація** (`/auth/register`) - Вибір типу профілю
- **Вхід** (`/auth/login`) - Авторизація
- **Чат** (`/chat`) - Система повідомлень

## Якщо виникли проблеми

### Порт зайнято
```powershell
# Змініть порт
$env:PORT=3001; npm run dev
```

### Помилки встановлення
```powershell
# Очистіть кеш та переустановіть
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

### Помилки TypeScript
Це нормально до встановлення залежностей. Після `npm install` всі помилки зникнуть.

## Корисні команди

```powershell
npm run dev      # Розробка
npm run build    # Білд для production
npm run start    # Запуск production
npm run lint     # Перевірка коду
```

---

Успіхів! 🚀
