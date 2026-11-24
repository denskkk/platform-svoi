# Свій для Своїх

## О проекті

Це веб-додаток на Next.js для безкоштовної платформи обміну послугами, профілями, заявками та чатом. Проект також має Android-оболонку на Capacitor, яка запускає той самий веб-інтерфейс як мобільний додаток.

Основні функції:
- реєстрація та авторизація користувачів;
- профілі користувачів та бізнес-профілі;
- заявки, послуги, пошук, рекомендації;
- чат, повідомлення, перегляд лічильників;
- відгуки та рейтинги;
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

## Скрипти збірки та публікації

Усі скрипти запускаються з кореня репозиторію. Деталі та автентифікація — у `android_distribution/README.md` та `ios_distribution/README.md`.

### Android (`android_distribution/`)

| Скрипт | Призначення |
|---|---|
| `android_apk_build.py` | підписаний release APK для прямого встановлення → `binaries/` |
| `android_play_store_build.py` | підписаний AAB для Google Play → `binaries/` |
| `android_bump.py build [N]` / `version major\|minor\|patch\|X.Y` | змінює `versionCode` / `versionName` у `android/app/build.gradle` і перейменовує файли в `binaries/` |
| `upload_to_google_play.py app.aab [--track internal] [--status draft]` | завантажує AAB через Play Developer API |
| `upload_listing_to_google_play.py [--lang uk\|en-US] [--only texts\|screenshots] [--dry-run]` | завантажує назву, описи та скриншоти з `materials/google_play/` |
| `android_screenshots.py [--install] [-s SERIAL]` | знімає скриншоти з підключеного Android-пристрою |

### iOS (`ios_distribution/`)

| Скрипт | Призначення |
|---|---|
| `ios_app_store_build_and_archive.py` | підписаний App Store IPA → `binaries/` |
| `ios_ad_hoc_build_and_archive.py` | підписаний Ad Hoc IPA → `binaries/` |
| `ios_bump.py build [N]` / `version major\|minor\|patch\|X.Y.Z` | змінює номер збірки / версію в `project.pbxproj` і перейменовує IPA |
| `ios_run_on_device.py [-d UDID\|name] [--console]` | збирає Debug, встановлює та запускає застосунок на підключеному iPhone/iPad |
| `upload_to_appstore.py app.ipa [--apple-id]` | завантажує IPA в App Store Connect |
| `upload_listing_to_appstore.py [--version X.Y] [--only texts\|screenshots] [--dry-run]` | завантажує тексти та скриншоти з `materials/app_store/` |
| `ios_screenshots.py [-d UDID\|name] [--only 03 05]` | керований знімок екранів з iPhone |

### Матеріали (`materials/`)

| Скрипт | Призначення |
|---|---|
| `google_play/compose_screenshots.mjs` | оформлені скриншоти Google Play (1080×1920) з `screenshots/v2/source/` |
| `app_store/compose_screenshots.mjs` | оформлені скриншоти App Store (iPhone 6.9″ та iPad 13″) з `screenshots/v2/source/` |

Обидва `.mjs` запускаються з `FONT_DIR=<папка з Roboto-Bold.ttf> node materials/<store>/compose_screenshots.mjs`.

## Проект готовий до передачі

Після очищення репозиторія цей проект можна передати другому розробнику для клону, установки залежностей та сборки. Важливо передати секрети окремо, не через GitHub.
