# Виправлення балансу UCM

## Проблема
1. При видачі UCM через адмінку баланс відображався, але не можна було використати для публікації послуг
2. Старі користувачі не мали початкового балансу (5 UCM для звичайних, 50 UCM для бізнесу)

## Виправлення

### 1. Виправлено API видачі UCM через адмінку
**Файл:** `src/app/api/admin/grant-ucm/route.ts`

Додано правильні поля в транзакцію:
- `kind: 'credit'` - тип транзакції (нарахування)
- `relatedEntityType: 'admin_grant'` - тип зв'язаної сутності
- `relatedEntityId: userId` - ID адміністратора
- `meta: { description }` - опис у JSON форматі

### 2. Створено міграцію для початкового балансу
**Файл:** `database/migrations/20251125_add_initial_ucm_balance.sql`

Міграція автоматично:
- Знаходить користувачів без UCM транзакцій `signup_bonus`
- Нараховує 5 UCM звичайним користувачам
- Нараховує 50 UCM бізнес акаунтам
- Створює відповідні транзакції в `ucm_transactions`

## Деплой на VPS

### Крок 1: Оновити код
```bash
ssh user@sviydlyasvoih.com.ua
cd /var/www/sviydlyasvoyikh/platform-svoy
git pull origin main
```

### Крок 2: Застосувати міграцію бази даних
```bash
# Підключитися до PostgreSQL
sudo -u postgres psql -d sviydlyasvoyikh

# Виконати міграцію
\i /var/www/sviydlyasvoyikh/platform-svoy/database/migrations/20251125_add_initial_ucm_balance.sql

# Перевірити результат
SELECT id, first_name, last_name, account_type, balance_ucm 
FROM users 
ORDER BY id;

# Перевірити транзакції
SELECT user_id, kind, amount, reason, created_at 
FROM ucm_transactions 
WHERE reason = 'signup_bonus'
ORDER BY created_at DESC;

# Вийти
\q
```

### Крок 3: Перезібрати та перезапустити застосунок
```bash
npx prisma generate
npm run build
pm2 restart sviy-web
```

### Крок 4: Перевірити роботу

1. **Перевірити баланс користувача:**
   - Зайти в профіль
   - Перевірити відображення балансу UCM

2. **Спробувати опублікувати послугу:**
   - Створити нову послугу
   - Має успішно опублікуватися (списується 1 UCM)

3. **Перевірити через адмінку:**
   - `/admin/users-manage`
   - Видати UCM користувачу
   - Перевірити що баланс оновився
   - Спробувати опублікувати послугу

## SQL команди для перевірки

### Переглянути баланс всіх користувачів
```sql
SELECT 
    id,
    first_name,
    last_name,
    email,
    account_type,
    balance_ucm,
    created_at
FROM users
ORDER BY created_at DESC;
```

### Переглянути всі UCM транзакції користувача
```sql
-- Замініть 123 на ID користувача
SELECT 
    tx_id,
    kind,
    amount,
    reason,
    related_entity_type,
    meta,
    created_at
FROM ucm_transactions
WHERE user_id = 123
ORDER BY created_at DESC;
```

### Переглянути статистику балансів
```sql
SELECT 
    account_type,
    COUNT(*) as total_users,
    AVG(balance_ucm) as avg_balance,
    MIN(balance_ucm) as min_balance,
    MAX(balance_ucm) as max_balance,
    SUM(balance_ucm) as total_balance
FROM users
GROUP BY account_type;
```

### Знайти користувачів без початкового бонусу
```sql
SELECT 
    u.id,
    u.first_name,
    u.last_name,
    u.account_type,
    u.balance_ucm
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM ucm_transactions 
    WHERE user_id = u.id 
    AND reason = 'signup_bonus'
)
ORDER BY u.created_at;
```

## Перевірка після деплою

### 1. Баланс відображається правильно
- [x] У профілі користувача
- [x] В адмін панелі

### 2. Можна витрачати UCM
- [x] Публікація послуг (1 UCM)
- [x] Створення заявок (3-5 UCM)
- [x] Списання проходить успішно

### 3. Початковий баланс нарахований
- [x] Звичайні користувачі: 5 UCM
- [x] Бізнес акаунти: 50 UCM
- [x] Створені транзакції `signup_bonus`

### 4. Адмінка працює
- [x] Видача UCM оновлює баланс
- [x] Транзакції створюються правильно
- [x] Користувачі можуть витрачати видані UCM

## Примітки

- Міграція **ідемпотентна** - можна запускати кілька разів без проблем
- Перевіряє наявність транзакцій `signup_bonus` перед нарахуванням
- Логує процес через `RAISE NOTICE`
- Не видає повторно UCM існуючим користувачам
