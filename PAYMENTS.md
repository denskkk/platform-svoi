# Payments integration (WayForPay) + внутрішня валюта «уцмка»

Цей модуль додає поповнення балансу через WayForPay. Усі суми в інтерфейсі показуємо у «уцмка», при цьому у платіжний шлюз передаємо валюту WayForPay (за замовчуванням UAH).

## Конфігурація середовища

Додайте змінні у `.env` (на проді — у pm2 ecosystem або .env):

- WAYFORPAY_MERCHANT_ACCOUNT=your_account
- WAYFORPAY_MERCHANT_SECRET=your_secret
- WAYFORPAY_DOMAIN_NAME=sviydlyasvoih.com.ua
- WAYFORPAY_CURRENCY=UAH
- WAYFORPAY_SERVICE_URL=https://sviydlyasvoih.com.ua/api/payments/callback
- WAYFORPAY_RETURN_URL=https://sviydlyasvoih.com.ua/payments/checkout

Додатково: NEXT_PUBLIC_SITE_URL=https://sviydlyasvoih.com.ua

## Схема БД

- Модель `Payment` додано у `prisma/schema.prisma` (таблиця `payments`).
- Для прод-сервера створено idempotent SQL: `database/migrations/20251113_add_payments.sql`.

Після оновлення схеми обовʼязково:

1) npx prisma generate
2) застосувати SQL-патч (якщо ви керуєте БД вручну):
	- psql -d <db> -f database/migrations/20251113_add_payments.sql

## API

- POST /api/payments/create — створює запис платежу та повертає дані для WayForPay форми.
- POST /api/payments/callback — приймає callback від WayForPay, перевіряє підпис та оновлює статус платежу.

Callback очікує JSON з полями WayForPay. Відповідь `{ status: "accept" }` зупиняє повторні спроби.

## UI

- Компонент `PayButton` створює платіж та редіректить на WayForPay (формою POST).
- Сторінка `/payments/checkout` для тесту поповнення.

## Валюта «уцмка»

- Хелпер `formatUCM(amount)` у `src/lib/utils.ts` — показує суму як `123,45 уцмка`.
- У WayForPay передаємо валюту `WAYFORPAY_CURRENCY` (наприклад, UAH). Назва «уцмка» — лише для відображення.

## Примітки

- Підпис WayForPay обчислюється за MD5 HMAC по певних полях (див. `src/lib/wayforpay.ts`). Якщо у вашому акаунті вимога інша (sha1), оновіть `SignatureAlgo` у хелпері або через змінну середовища та перезапустіть.
- Обовʼязково відкрийте публічно `POST /api/payments/callback` для WayForPay.
- Далі можна додати нарахування балансу користувача після `Approved` (зараз лише оновлюємо статус платежу).

***

Оновлено: додано моделі, маршрути, UI і документацію для запуску WayForPay.