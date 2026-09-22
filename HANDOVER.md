# Handover for Developer

## What this app does

This project is a marketplace/community platform with user profiles, public requests, business profiles, chat, service listings, referral logic, UCM balance transactions, and payment flows. The backend is implemented as Next.js API routes and Prisma models.

## Project type

- Frontend: Next.js App Router
- Backend: server routes inside `src/app/api`
- Database: PostgreSQL via Prisma
- Mobile wrapper: Capacitor Android
- Deployment target: production HTTPS URL, not localhost

## Where to change things

- App pages: `src/app`
- Shared UI: `src/components`
- Auth and cookie helpers: `src/lib/auth.ts`, `src/lib/cookies.ts`, `src/lib/client-auth.ts`
- Database access: `src/lib/prisma.ts`
- Prisma schema: `prisma/schema.prisma`
- Android wrapper: `android/`
- Production web config: `capacitor.config.ts`
- Environment variables: `.env` (local only)

## API and data flow

- The app reads and writes through Next.js `fetch` calls to local API routes.
- Those API routes use Prisma to access PostgreSQL.
- The mobile app is a web wrapper and points to the deployed HTTPS backend via `CAPACITOR_SERVER_URL`.
- Localhost is only valid in dev; production must use a domain that resolves over HTTPS.

## Required secrets to send privately

Send these outside GitHub, for example via secure file transfer or password manager:

- `.env` file
- `DATABASE_URL` value
- `JWT_SECRET`
- `REFRESH_TOKEN_SECRET`
- WayForPay credentials if enabled
- any Firebase `google-services.json` if later added
- any external SMTP or Cloudinary credentials

## Package name / app id

- Android applicationId: `com.svoi.platform`
- Config source: `android/app/build.gradle` and `capacitor.config.ts`

## Versioning

- Main version is defined in `package.json`
- Android versionCode and versionName are in `android/app/build.gradle`

## App name / branding

- Change in `capacitor.config.ts`
- Android app name resources live under `android/app/src/main/res/values`

## Build and run

```bash
git clone <repo-url>
cd platform-svoi
npm install
cp .env.example .env
# fill secrets
npx prisma generate
npx prisma db push
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
# or: ./gradlew bundleRelease
```

## Signing procedure

1. Create keystore.
2. Put it in a safe folder outside GitHub.
3. Create `android/key.properties` from the template.
4. Add signing config to release build if needed.
5. Build release AAB and upload to Google Play.

## Files that must not be in GitHub

- `.env`
- `.env.local`
- any `.env.*` with real secrets
- `*.jks`, `*.keystore`
- `key.properties`
- `google-services.json`
- API keys and payment credentials
- uploaded user files from `public/uploads/`

## What to hand over separately

- GitHub repo URL
- production `.env` file
- database credentials / database host
- JWT secrets
- Google Play access
- Firebase project access if used
- keystore file and passwords

## Google Play update note

If this app is already published in Google Play, the developer must use the same release signing key for every future update. Losing the key means future upgrades will fail.
