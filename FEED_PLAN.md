# Social feed (v1) — notes

Branch: `feature/social-feed`. Not deployed, not published.

## What it adds
- `/feed` (logged-in users): "For you" and "Following" tabs, composer (text + up to 6 photos), likes, comments, follow/unfollow, infinite scroll, pull-to-refresh. Private path (noindex). Mobile bottom nav's first item is now "Feed" (was "Home"); the logo still leads to the landing page.
- API: `GET /api/feed`, `POST /api/posts`, `DELETE /api/posts/:id`, `POST|DELETE /api/posts/:id/like`, `GET|POST|DELETE /api/posts/:id/comments`, `GET|POST|DELETE /api/follows`.
- Permissions: viewers can read the feed and follow; basic/business can post, like and comment (`CREATE_POST`, `INTERACT_POST`, `FOLLOW_USER`, `VIEW_FEED`).
- Also: edit own post (`PATCH /api/posts/:id`), single post page `/feed/:id`, posts block on profile pages (`/api/feed?authorId=`), reporting posts via the existing report flow (`contentType=post`), notifications (`/notifications`, bell in the navbar, `GET /api/notifications`, `POST /api/notifications/read`) for likes, comments and new followers. Notification text is built on the client by `type`, so it follows the viewer's language.
- Blocking (store-review requirement for user content): `GET|POST|DELETE /api/blocks`, page `/blocked`, "Block" in the post menu and on profiles. Blocking works both ways: hides posts/comments, forbids likes, comments, follows, messages, notifications; removes follows.
- Uploads: `/api/upload` accepts `type=posts` (aspect ratio kept, max 1440px).
- i18n: `messages/{uk,en}/feed.json`, `api.feed.*`, `layout.navbar.feed`, `layout.mobileNav.feed`.

## Database (additive only)
New tables: `posts`, `post_images`, `post_likes`, `post_comments`, `follows`, `user_blocks` (second file: `database/migrations/20261112_add_user_blocks.sql`). No existing table or column is changed.
Apply with either `npx prisma db push` (as in HANDOVER.md) or `database/migrations/20261112_add_social_feed.sql`. Back up first.
Rollback: `DROP TABLE follows, post_comments, post_likes, post_images, posts;`

## Mobile app (Capacitor)
The app is a WebView over the production site, so the feed reaches installed apps as soon as the web is deployed — no store update is required for it. Touch pull-to-refresh is implemented in JS (no native plugin). Test in the WebView: safe-area at top/bottom, keyboard over the composer/comment field, photo picker (camera/gallery) on Android and iOS, offline behaviour.
A store update is only needed when native parts change (icons, permissions, versions, plugins).

## Not verified here
`npm ci`, `prisma generate`, `next build` and the tests could not run in the agent environment (no package install). Run `npm ci && npx prisma generate && npm run build && npm run test:auth && npm run test:i18n` before merging.

## Known limits / next steps
- Notifications are pull-based (refresh every 60 s and when the app returns to foreground); no push notifications (FCM/APNs) yet — that needs a native plugin and a store update.
- Post images cannot be changed when editing (text only).
- Deleted posts remove their image files; comments/likes cascade in the DB.
- Feed ranking is chronological; "For you" = all public posts.

## Оголошення (Авто, Нерухомість)
- Міграція: `database/migrations/20261113_add_listings.sql` (listings, listing_images, saved_listings, audit_log; активує проєкти cars/real-estate).
- Публікація → модерація (`/admin/listings`) → каталог `/projects/<slug>`; кабінет `/my-listings`; картка `/listings/<id>`.

## Заявка бізнесу
- Міграція: `database/migrations/20261114_add_business_applications.sql`.
- Користувач: `/business/apply` (форма + статус). Адмін: `/admin/business-applications` (схвалення з необов’язковим орієнтовним % — лише пропозиція, не гарантія; відхилення з причиною). Дії пишуться в `audit_logs`, заявник отримує сповіщення.

## «Як заробити з нами?» і партнерські заявки
- Міграція: `database/migrations/20261115_add_partner_pages.sql` (project_earn_pages, partner_applications).
- Сторінка: `/projects/<slug>/earn` (кнопка на активних напрямках). Без запису в БД показується типовий текст з перекладів.
- Адмін: `/admin/partners` — вкладки «Заявки» (схвалення/відхилення з причиною, аудит, сповіщення) та «Тексти сторінок» (uk/en, звичайний текст без HTML).
