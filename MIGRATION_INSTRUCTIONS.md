# Інструкція для застосування міграції на сервері

## Варіант 1: Через SSH на сервері

```bash
# 1. Підключитись до сервера
ssh root@45.130.43.116

# 2. Перейти в директорію проєкту
cd /var/www/sviydlyasvoih/platform-svoi

# 3. Скопіювати SQL файл (якщо потрібно через git pull або створити вручну)
git pull origin main

# 4. Застосувати міграцію
psql -U admin -d sviydliasvoyikh -f database/migrations/002_add_extended_profile_fields.sql

# Або прямо через psql:
psql -U admin -d sviydliasvoyikh

# В psql виконати:
\i database/migrations/002_add_extended_profile_fields.sql
```

## Варіант 2: Виконати SQL команди вручну

Підключитися до бази даних і виконати наступні команди:

```sql
-- Змінюємо тип полів УЦМ з boolean на varchar
ALTER TABLE users 
  ALTER COLUMN ucm_member TYPE VARCHAR(50),
  ALTER COLUMN ucm_supporter TYPE VARCHAR(50);

-- Змінюємо тип поля usesDelivery з boolean на varchar
ALTER TABLE users 
  ALTER COLUMN uses_delivery TYPE VARCHAR(50);

-- Змінюємо тип поля readyToSwitchToUCM з boolean на varchar  
ALTER TABLE users
  ALTER COLUMN ready_to_switch_ucm TYPE VARCHAR(50);

-- Додаємо нові поля
ALTER TABLE users ADD COLUMN IF NOT EXISTS seeking_specialty VARCHAR(200);
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_type VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS fop_group VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS tov_type VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_code VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_category VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS offer_type VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_children VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS uses_taxi BOOLEAN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_bicycle VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bicycle_info VARCHAR(200);
ALTER TABLE users ADD COLUMN IF NOT EXISTS uses_home_services JSONB DEFAULT '[]';
ALTER TABLE users ADD COLUMN IF NOT EXISTS site_usage_goal JSONB DEFAULT '[]';
```

## Варіант 3: Через Prisma на сервері

```bash
# На сервері
cd /var/www/sviydlyasvoih/platform-svoi

# Застосувати схему Prisma
npx prisma db push

# Або згенерувати та застосувати міграцію
npx prisma migrate deploy
```

## Після міграції

```bash
# Перегенерувати Prisma Client
npx prisma generate

# Перезапустити додаток
pm2 restart sviy-web
```
