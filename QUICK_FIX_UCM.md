# Швидке виправлення UCM Schema

## Проблема
```
Unknown argument `kind`. Did you mean `id`?
```

Prisma schema не містить поля `kind`, `relatedEntityType`, `relatedEntityId`, `meta` для моделі `UcmTransaction`.

## Виправлення

Оновлено `prisma/schema.prisma` - додано всі необхідні поля згідно з структурою таблиці в базі даних.

## Деплой (ТЕРМІНОВО)

```bash
# На VPS
cd /var/www/sviydlyasvoih/platform-svoy
git pull origin main

# ВАЖЛИВО: Регенерувати Prisma Client
npx prisma generate

# Перезібрати
npm run build

# Перезапустити
pm2 restart sviy-web

# Перевірити логи
pm2 logs sviy-web --lines 20
```

## Що змінилося

### До:
```prisma
model UcmTransaction {
  id          Int      @id @default(autoincrement())
  userId      Int      @map("user_id")
  amount      Decimal  @db.Decimal(12, 2)
  reason      String   @db.VarChar(100)
  description String?  @db.Text
  createdAt   DateTime @default(now()) @map("created_at")
  ...
}
```

### Після:
```prisma
model UcmTransaction {
  id                Int      @id @default(autoincrement()) @map("tx_id")
  userId            Int      @map("user_id")
  kind              String   @default("credit") @db.VarChar(50)
  amount            Decimal  @db.Decimal(12, 2)
  reason            String   @db.VarChar(50)
  relatedEntityType String?  @map("related_entity_type") @db.VarChar(50)
  relatedEntityId   Int?     @map("related_entity_id")
  meta              Json     @default("{}")
  description       String?  @db.Text
  createdAt         DateTime @default(now()) @map("created_at")
  ...
}
```

## Перевірка

Після деплою перевірити:
1. ✅ Сторінка завантажується без помилок
2. ✅ `/api/earning/progress` працює
3. ✅ Можна публікувати послуги
4. ✅ UCM списуються правильно
