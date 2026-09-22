# Свій для Своїх

## О проекті

Це веб-додаток на Next.js для платформи обміну послугами, профілями, заявками, оплатами та чатом. Проект також має Android-оболонку на Capacitor, яка запускає той самий веб-інтерфейс як мобільний додаток.

Основні функції:
- реєстрація та авторизація користувачів;
- профілі користувачів та бізнес-профілі;
- заявки, послуги, пошук, рекомендації;
- чат, повідомлення, перегляд лічильників;
- платіжний сценарій через WayForPay;
- управління через адміністративні сторінки;
- Prisma + PostgreSQL як основна база даних.

## Архітектура

UI
↓
Next.js App Router pages/components
↓
API routes (src/app/api)
↓
Prisma ORM
↓
PostgreSQL

Мобільна оболонка:
- Capacitor Android wrapper
- `capacitor.config.ts` points to the deployed HTTPS URL
- web assets are built by Next.js and synced into Android

## Технології

- Next.js 14.2.5
- React 18
- TypeScript
- Prisma ORM
- PostgreSQL
- Capacitor 7 + Android
- Tailwind CSS

## Вимоги

- Node.js 18+ or current LTS
- npm
- PostgreSQL 14+
- Android Studio + Android SDK (для мобільної збірки)
- Java JDK for Android builds

## Швидкий старт

```bash
git clone <repo-url>
cd platform-svoi
npm install
cp .env.example .env
# fill required values in .env
npx prisma generate
npx prisma db push
npm run dev
```

## Налаштування `.env`

Обов’язкові змінні:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/sviydlyasvoyikh?schema=public"
JWT_SECRET="replace-with-long-random-secret"
REFRESH_TOKEN_SECRET="replace-with-long-random-refresh-secret"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
CAPACITOR_SERVER_URL="http://localhost:3000"
NODE_ENV="development"
PORT="3000"
```

Для продакшну використовуйте реальні значення, HTTPS URL та сильні секрети.

## Firebase / Google services

У поточному стані проект не містить `google-services.json` або Firebase конфігурації. Якщо їх додати, вони повинні бути додані в `.gitignore` і передані окремо розробнику.

## Android / Capacitor

### Sync web assets to Android

```bash
npm run build
npx cap sync android
```

### Debug build

```bash
cd android
./gradlew assembleDebug
# or on Windows
./gradlew.bat assembleDebug
```

### Release build

```bash
cd android
./gradlew assembleRelease
# or generate AAB
./gradlew bundleRelease
```

Після генерації необхідно підписати AAB/APK через keystore.

## Signing / keystore

Для релізу потрібно створити keystore і файл `android/key.properties`.

Приклад:

```properties
storeFile=../release-keystore.jks
storePassword=YOUR_STORE_PASSWORD
keyAlias=release
keyPassword=YOUR_KEY_PASSWORD
```

Файл `key.properties` не повинен потрапляти в GitHub. Для шаблону використовуйте `android/key.properties.example`.

## Склад проекту

- `src/app` — Next.js маршрути та сторінки
- `src/app/api` — API route для бекенду
- `src/components` — UI компоненти
- `src/lib` — утиліти, auth, Prisma, API helpers
- `src/hooks` — React hooks
- `prisma/schema.prisma` — схема бази даних
- `database/` — SQL seed/migrations
- `android/` — Capacitor Android проект
- `public/` — статичні файли та assets
- `scripts/` — адміністративні та допоміжні скрипти

## Запуск перевірок

```bash
npm run build
npm run lint
npx prisma generate
```

## Release process

1. Перевірити `DATABASE_URL`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET`.
2. Перевірити production URL.
3. Синхронізувати Android з веб-ресурсами.
4. Зібрати release AAB.
5. Підписати keystore.
6. Завантажити в Google Play Console.

## Проект готовий до передачі

Після очищення репозиторія цей проект можна передати другому розробнику для клону, установки залежностей та сборки. Важливо передати секрети окремо, не через GitHub.
