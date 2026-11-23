# Открытие ссылок (рилсы, профили, объявления) в приложении

Ссылка на рилс: `https://sviydlyasvoih.com.ua/feed/<id>`.

## Что работает без пересборки приложения (сайт)
- **Превью в мессенджерах** (Telegram, Viber, WhatsApp, iMessage): автор, текст, постер. Только для публичных постов.
- **Полоса «Відкрити в застосунку»** в мобильном браузере: Android — открывает приложение или Google Play; iPhone — App Store (после добавления `NEXT_PUBLIC_APP_STORE_URL`).

## Что нужно, чтобы ссылка сама открывала установленное приложение (нужна новая сборка)

### Android (App Links)
1. В манифесте уже есть intent-filter с `autoVerify` (после пересборки).
2. В Play Console → Цілісність застосунку → «Ключ підпису» скопируйте **SHA-256** отпечаток (и, при желании, отпечаток ключа загрузки).
3. На VPS в `.env`: `ANDROID_CERT_SHA256=AA:BB:...:ZZ` (несколько — через запятую), затем `pm2 restart sviy --update-env`.
4. Проверка: `curl -s https://sviydlyasvoih.com.ua/.well-known/assetlinks.json` — должен вернуть JSON.

### iPhone (Universal Links)
1. Team ID: developer.apple.com → Membership. На VPS в `.env`: `APPLE_TEAM_ID=XXXXXXXXXX`, `pm2 restart sviy --update-env`.
2. Проверка: `curl -s https://sviydlyasvoih.com.ua/.well-known/apple-app-site-association` — JSON (без редиректа, Content-Type application/json).
3. В Xcode: Target App → Signing & Capabilities → **+ Capability → Associated Domains** → добавить `applinks:sviydlyasvoih.com.ua`.
4. `NEXT_PUBLIC_APP_STORE_URL=https://apps.apple.com/app/id<число>` в `.env` (для баннера и Smart App Banner), затем пересборка сайта (`bash scripts/deploy.sh`), так как это `NEXT_PUBLIC_`.

### Оба: чтобы приложение открывало именно ту страницу
```
npm install @capacitor/app
npm run build
npx cap sync android      # и на Mac: npx cap sync ios
```
Закоммитьте `package.json` и `package-lock.json` (иначе `npm ci` на VPS упадёт). Обработчик `NativeLinkHandler` уже в сайте.

### nginx
Если на сервере есть правило, закрывающее скрытые пути (`location ~ /\.`), добавьте исключение для `/.well-known/`.
