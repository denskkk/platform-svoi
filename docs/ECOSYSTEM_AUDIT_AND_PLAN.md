# «Свій для Своїх» — audit of the repository against the ecosystem TZ, and the plan

Status: proposal for approval. No database or production changes are made by this document.

## 1. Audit: what exists vs what the TZ needs

| Area | State in the repository | What is required |
|---|---|---|
| Registration, accounts | Three separate flows (`viewer`, `basic`, `business`) as `AccountType` on `User`; role enum has `admin`. Login, refresh tokens, sessions, CSRF exist. | Keep. Add *attached* profile types (organization) and an "apply for business" path on top of one account; do not force re-registration. |
| Business profile | `BusinessInfo` (1:1 with user) is very rich: company data, logo, banner, gallery, video URL, hours, socials, "seeking" flags. Admin can verify (`isVerified`). | Missing: application status and moderation queue, reward-percent field, contact person, map coordinates, contract status. |
| Organizations | None. | New model + moderated application. |
| Business catalog | `/catalog`, `/services`, profile page, reviews, favorites. City is free text; categories are flat. | Search by category/city, business page polish, coordinates + map, rating aggregate, "partner program" flag. |
| Social feed | Built in this branch: posts, photos, likes, comments, follows, notifications, reports. | Missing: video, stories, reposts, saved posts, user/business recommendations, block user. |
| Short video | None. Uploads are stored on the app server disk (`public/uploads`). | Needs object storage + transcoding/CDN before any video. Large. |
| Projects (directions) | None. `Category` is flat and tied to `Service`. | `Project` + hierarchical categories, configurable from admin. |
| Listings / moderation | `Service` (active flag, no moderation), `Request`, `PublicRequest`, `ServiceRequest`. No statuses, expiry, dynamic fields. | One generic `Listing` module with config-driven fields, statuses, expiry, moderation. |
| Search | `/services` filters, `SearchLog`. No global search, no full-text, no geo. | Unified search over people/business/listings (Postgres first). |
| Referrals, deals, earnings | Nothing in code or schema. | Whole module: program terms, referral, deal, commission, payout, ledger, audit. Large + legal. |
| Online-store showcases | None. | `Storefront` + `Product` + tracked outbound click. Medium. |
| Events, clubs, health, sport, cars, real estate, trade | None. | Built on `Project` + `Listing` (+ `ProfessionalProfile` for health/sport). |
| Admin panel | Users, reports, messages, stats, verify. Only one admin level; `api/admin/clear-db` exists (risk). | Roles (Moderator, Business Manager, Support), `AuditLog`, queues for applications/listings/deals. |
| Notifications | In-app (this branch). No push. | Push needs Firebase + APNs + a native plugin = store update. |
| i18n | uk + en, ~24 namespaces, `check-i18n` script. | Keep; every new key in both languages. |
| Mobile shell | Capacitor 7 WebView on the production site; no native plugins. | Web changes ship instantly. Push/NFC/native camera need a store release. QR via browser camera does not. |
| Payments | `Subscription` rows exist; no payment provider code. | A licensed provider/POS integration only; never store card data. |

## 2. Risks and open decisions
1. **Monetisation conflict.** Current model: paid subscriptions ("all functions paid"). TZ: free listing, earn on referred deals. Needs an explicit decision before building referrals.
2. **Store review.** User-generated content requires report + block + moderation (App Store 1.2 / Play UGC policy). Report exists; **block user is missing and should be added before the feed is released.**
3. **File storage.** Local disk does not scale and cannot carry video. Choose object storage/CDN.
4. **Money logic** needs contracts, tax treatment and payout rules reviewed by a lawyer/accountant; the code can enforce idempotency and audit but not legality.
5. **Regulated categories** (health, finance): verification of documents before publication.
6. `api/admin/clear-db` should be removed or hard-gated in production.
7. No automated tests for the new modules; critical flows (moderation, money) need them.

## 3. Proposed architecture (additive only)
- `Project(slug, nameUk, nameEn, icon, banner, status: active|coming_soon, sortOrder, fieldSchema JSON)` and `ProjectCategory(projectId, parentId, …)`.
- `Listing(projectId, categoryId, ownerId, data JSON validated by project schema, status: draft|pending|approved|rejected|expired, rejectReason, expiresAt)` + `ListingImage`.
- `BusinessApplication(userId, businessInfoId, status, proposedRewardPercent, adminNote)`; `Organization` + `OrganizationApplication`.
- `EarnPage(projectId, locale, title, body, media, steps JSON)` editable in admin; `PartnerApplication`.
- Later: `ReferralProgram`, `Referral`, `Deal`, `Commission`, `Payout`, `Contract`, `AuditLog` (append-only ledger, unique operation ids, transactions).
- Admin: `adminRole` on `User`; `AuditLog` from the start.
- All migrations additive; existing tables only get new nullable columns.

## 4. Phasing
**Now (stage 1 + finish the feed):**
1. Block user + content filter basics (store-review requirement).
2. `Project` catalogue screen ("Проєкти") with cards; projects not ready show a **"Скоро"** badge and a placeholder page.
3. Generic `Listing` + moderation queue in admin; first live projects: Cars and Real estate.
4. Business application flow with reward percent (as a proposal only, never shown as guaranteed) + admin queue; Organization application.
5. "Як заробити з нами?" pages per project, editable in admin; "Подати заявку" creates a `PartnerApplication` (no payouts).
6. Unified search (people, business, listings).
7. Admin roles + `AuditLog`.
8. Feed: "possible friends" (same city/interests), recommended business, saved posts.

**"Скоро" (visible, not functional):** Відео/Reels, Історії, Здоров'я, Спорт, Китай і торгівля, Інтернет-магазини (second wave, relatively cheap), Події, Клуби, «Мій заробіток», «Залучені клієнти», QR/NFC, термінал/POS, виплати, push.

**Later stages:** referrals/deals/commissions (after the monetisation and legal decisions), offline infrastructure (QR first, NFC only via native plugin).
