# Release 1.1 (versionCode 4) — bilingual (uk/en) release plan

Branch: `feature/english-localization`. Nothing has been deployed or published; both steps need explicit approval.

## What changes

- Web: full Ukrainian/English UI (`messages/<locale>/*.json`, `src/i18n/*`, `src/middleware.ts`). Public pages also live under `/en/...` (`/en`, `/en/about`, `/en/privacy`, `/en/terms-of-use`, `/en/account-deletion`, `/en/support`, `/en/contacts`). All existing URLs keep working. New page: `/support`.
- Language selection: explicit choice is stored in the `sviy_locale` cookie (1 year); otherwise `Accept-Language`; otherwise Ukrainian. Public pages are redirected to `/en/...` for English visitors.
- API: user-visible messages are localized by request locale (cookie / Accept-Language). Response shapes, status codes and error codes are unchanged. Ukrainian text is unchanged.
- SEO: per-page title/description, canonical, hreflang, Open Graph/Twitter, `sitemap.xml`, `robots.txt`; private pages get `X-Robots-Tag: noindex`.
- Security headers added in `next.config.js`: `Permissions-Policy`, a minimal `Content-Security-Policy` (frame-ancestors/base-uri/object-src/form-action), `Strict-Transport-Security`.
- Android: English default resources + Ukrainian (`values-uk`), per-app language list (`locales_config.xml`), `versionCode 4` / `versionName 1.1`, bilingual local error page (`mobile-web/error.html`), production server URL is now the default in `capacitor.config.ts` (no more accidental placeholder build). `applicationId`, signing and Play app ID are unchanged.
- No database schema change. No data migration.

## Backward compatibility

The installed Android app (1.0 / versionCode 3) is a WebView over the production site, so it receives the new web UI as soon as the site is deployed. Its WebView sends the system language in `Accept-Language`, so English phones see English immediately and Ukrainian phones keep Ukrainian. Cookies, tokens and sessions are untouched.

## Deploy (web) — needs approval

1. Back up: `pg_dump` of the production database and a copy of `public/uploads` (or the uploads dir) and `.env`.
2. `git pull` the branch on the server, `npm ci`, `npx prisma generate` (no `db push`/`migrate` needed), `npm run build`.
3. `pm2 reload ecosystem.config.js`.
4. Smoke tests: `/`, `/en`, `/en/about`, `/en/privacy`, `/en/account-deletion`, `/en/support`, `/sitemap.xml`, `/robots.txt`, login/logout, refresh, language switch, `/api/health`.
5. Check that nginx passes `Cookie` and `Accept-Language` (it does by default) and does not cache HTML pages.

## Rollback

- Web: `git checkout <previous commit>` (the last production commit is `232e665`), `npm ci && npm run build && pm2 reload`. The database was never changed, so no DB rollback is required. The `sviy_locale` cookie is harmless to the old build.
- Android: do not roll out to 100% at once — use a staged rollout in Play Console and halt it if crashes/ANR rise. versionCode 3 can't be re-uploaded; a rollback is a new build with a higher versionCode, but since the app is a thin WebView, a web rollback is normally enough.

## Android build — needs a machine with JDK 17+ and Android SDK (not available in the agent environment)

```
npm ci
npx cap sync android            # copies mobile-web/ and writes capacitor.config.json
cd android
copy key.properties.example key.properties   # fill in the REAL upload keystore, never commit it
gradlew.bat bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`. Do not generate a new keystore — use the existing upload key. Test on devices: Ukrainian system language, English system language, per-app language (Android 13+), offline start (bilingual error page), update over version 3.

## Play Console actions

1. Upload the `.aab` (versionCode 4) to Production (staged rollout).
2. Add the English store listing from `materials/google_play/listing_en.md`.
3. Privacy policy URL: keep one URL (recommend `https://sviydlyasvoih.com.ua/en/privacy` or the Ukrainian one; both are public). Data deletion URL: `https://sviydlyasvoih.com.ua/en/account-deletion`.
4. App access: provide reviewer credentials (created by you, kept out of Git) with the instructions in `listing_en.md`.
5. Re-check Data safety, Content rating and Target audience (no feature changes in this release).

## Known limitations / open items

- There is no self-service password reset (no e-mail infrastructure in the project). `/auth/restore` only restores a session. Users who forget a password must contact support; the Support FAQ says so. Consider adding e-mail based reset in a later release.
- Notification texts stored in the database (created by the API) stay in Ukrainian; they are stored per recipient, not per locale.
- Handlers that returned `details: error.message` on 500 now omit it in production.
- `withRateLimit` trusts `x-forwarded-for`; keep nginx overwriting it (`proxy_add_x_forwarded_for` appends — set `X-Forwarded-For $remote_addr` if the app is directly reachable).
- Login accepts a few forgiving password variants (trimmed, first letter case flipped) to compensate for mobile keyboards; this slightly reduces password strength and is rate limited.
