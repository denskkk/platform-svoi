# Social feed (v1) — notes

Branch: `feature/social-feed`. Not deployed, not published.

## What it adds
- `/feed` (logged-in users): "For you" and "Following" tabs, composer (text + up to 6 photos), likes, comments, follow/unfollow, infinite scroll, pull-to-refresh. Private path (noindex). Mobile bottom nav's first item is now "Feed" (was "Home"); the logo still leads to the landing page.
- API: `GET /api/feed`, `POST /api/posts`, `DELETE /api/posts/:id`, `POST|DELETE /api/posts/:id/like`, `GET|POST|DELETE /api/posts/:id/comments`, `GET|POST|DELETE /api/follows`.
- Permissions: viewers can read the feed and follow; basic/business can post, like and comment (`CREATE_POST`, `INTERACT_POST`, `FOLLOW_USER`, `VIEW_FEED`).
- Uploads: `/api/upload` accepts `type=posts` (aspect ratio kept, max 1440px).
- i18n: `messages/{uk,en}/feed.json`, `api.feed.*`, `layout.navbar.feed`, `layout.mobileNav.feed`.

## Database (additive only)
New tables: `posts`, `post_images`, `post_likes`, `post_comments`, `follows`. No existing table or column is changed.
Apply with either `npx prisma db push` (as in HANDOVER.md) or `database/migrations/20261112_add_social_feed.sql`. Back up first.
Rollback: `DROP TABLE follows, post_comments, post_likes, post_images, posts;`

## Mobile app (Capacitor)
The app is a WebView over the production site, so the feed reaches installed apps as soon as the web is deployed — no store update is required for it. Touch pull-to-refresh is implemented in JS (no native plugin). Test in the WebView: safe-area at top/bottom, keyboard over the composer/comment field, photo picker (camera/gallery) on Android and iOS, offline behaviour.
A store update is only needed when native parts change (icons, permissions, versions, plugins).

## Not verified here
`npm ci`, `prisma generate`, `next build` and the tests could not run in the agent environment (no package install). Run `npm ci && npx prisma generate && npm run build && npm run test:auth && npm run test:i18n` before merging.

## Known limits / next steps
- Deleting a post leaves its uploaded files on disk (no cleanup job yet).
- No notifications for likes/comments/follows yet, no reporting of posts (use existing `Report` flow later), no edit of posts.
- Feed ranking is chronological; "For you" = all public posts.
