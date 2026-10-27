# App Store listing — Свій для Своїх

Draft texts for App Store Connect → My Apps → app → iOS App version → App Information / Prepare for Submission. Review before submitting.

## Assets

| App Store Connect field | File | Spec |
|---|---|---|
| App icon | `app_icon_1024.png` | 1024×1024, PNG, no alpha, no rounded corners (same file as the Xcode `AppIcon` asset; embedded in the IPA, shown here for reference) |
| iPhone screenshots, 6.9" display (upload in order) | `screenshots/iphone_6.9/01_home.png` … `08_login.png` | 1290×2796, PNG, no alpha |
| iPad screenshots, 13" display (upload in order) | `screenshots/ipad_13/01_home.png` … `08_login.png` | 2064×2752, PNG, no alpha |

Screenshots are derived from `../google_play/screenshots/` (same artwork and captions). The 9:16 originals were scaled to fit and the gradient background was extended at the edges to reach the iPhone/iPad aspect ratios. The 6.9" set is accepted for all smaller iPhone sizes; the 13" set is accepted for all smaller iPad sizes. App Store Connect allows 1–10 screenshots per set. No app preview video.

If you ship iPhone-only (`TARGETED_DEVICE_FAMILY = 1` in the Xcode project), the iPad folder is not needed.

## URLs

| App Store Connect field | URL |
|---|---|
| Privacy Policy URL (App Information) | https://sviydlyasvoih.com.ua/privacy |
| Support URL (required) | https://sviydlyasvoih.com.ua |
| Marketing URL (optional) | https://sviydlyasvoih.com.ua |
| Terms of Use (add to the end of the description, or in EULA field) | https://sviydlyasvoih.com.ua/terms-of-use |
| Account deletion (reference for review notes) | https://sviydlyasvoih.com.ua/account-deletion |
| Support contacts | support@sviydlyasvoih.com.ua, https://t.me/sviydlyasvoih |

## App Information

| Field | Value |
|---|---|
| Bundle ID | `com.svoi.platform` (from Xcode project — see note below) |
| SKU | `sviy-dlya-svoih-ios` |
| Primary language | Ukrainian |
| Primary category | Lifestyle |
| Secondary category | Business |
| Price | Free |
| Copyright | 2026 Свій для Своїх |
| Version | 1.0.1 (build 2) |
| Availability | All countries and regions (the audience includes the Ukrainian diaspora) |

## Texts

Name, subtitle, promotional text, keywords, description and What's New are in `listing_texts.txt`.

## App Review Information

| Field | Value |
|---|---|
| Sign-in required | Yes |
| Demo account | Username/password: see `../google_play/test_users_credentials.csv` (gitignored; use the same test accounts, enter them in the "User name" / "Password" fields) |
| Contact | support@sviydlyasvoih.com.ua (add a phone number in the form — it is required) |

Notes for the reviewer: see `listing_texts.txt` ("App Review Information → Notes").

## Age Rating questionnaire

| Question | Answer |
|---|---|
| Cartoon or fantasy violence, realistic violence, sexual content or nudity, profanity, horror, alcohol/tobacco/drugs, gambling, medical info | None |
| Unrestricted web access | No |
| User-generated content / messaging | Yes (profiles, requests, reviews, chat; with reporting) |
| Expected rating | 12+ or 17+ is computed by Apple from UGC/chat answers; check the result before submitting |

## App Privacy (nutrition label)

Data is linked to the user's identity; none is used for tracking (no ATT prompt, no third-party ad SDKs), so answer **"No" to "Do you or your third-party partners use data for tracking"**.

| Data type | Collected | Purpose | Linked to user | Tracking |
|---|---|---|---|---|
| Contact info → Name | Yes | App functionality | Yes | No |
| Contact info → Email address | Yes | App functionality, account management | Yes | No |
| Contact info → Phone number (optional) | Yes | App functionality | Yes | No |
| Location → Coarse location (city entered by user, not GPS) | Yes | App functionality | Yes | No |
| User content → Photos (profile photo) | Yes | App functionality | Yes | No |
| User content → Other user content (profiles, requests, reviews) | Yes | App functionality | Yes | No |
| User content → Messages (chat) | Yes | App functionality | Yes | No |
| Identifiers → User ID | Yes | App functionality | Yes | No |
| Usage data → Search history (search queries) | Yes | App functionality | Yes | No |
| Diagnostics → IP address / session data | Yes | Security, app functionality | Yes | No |
| Financial info, health, contacts, browsing history, purchases | No | — | — | — |

Cross-check against https://sviydlyasvoih.com.ua/privacy before submitting; it must match.

## Compliance notes

- **Export compliance:** the app uses only standard HTTPS. `ITSAppUsesNonExemptEncryption` is **not** set in `ios/App/App/Info.plist`, so App Store Connect will ask on each build. Answer "Yes, uses encryption" → "exempt (standard HTTPS only)", or add `<key>ITSAppUsesNonExemptEncryption</key><false/>` to Info.plist.
- **Content rights:** the app contains no third-party content beyond user-generated content.
- **Advertising identifier (IDFA):** not used.
- **Guideline 1.2 (UGC):** report button, Terms of Use acceptance, and contact details are in place (see notes above). Apple also expects a way to block abusive users and a published moderation contact; confirm both exist in the app.
- **Guideline 5.1.1(v):** in-app account deletion exists.
- **Guideline 4.2 (minimum functionality):** the app wraps a website. Mention native features in the review notes if you add any (push notifications, etc.); otherwise be ready for a reviewer question.

## Things to verify before submitting

1. **Bundle ID mismatch.** The Xcode project uses `com.svoi.platform`, but `ios_distribution/README.md` says the App Store Connect record is `com.sviy-dlya-svoih.ios`. The two must match.
2. **Home-screen name.** `CFBundleDisplayName` in Info.plist is now "СвійДляСвоїх" (no spaces), while the store name is "Свій для Своїх". Decide whether they should match.
3. **"5 UCM" in the screenshots.** The public requests screenshot shows "Створити публічну заявку (5 UCM)", which looks like an in-app currency. If UCM can be bought, Apple requires In-App Purchase (Guideline 3.1.1). If it is only earned or granted, say so in the review notes; otherwise retake the screenshot.
4. **Screenshots show web content.** Retake them from a real iPhone 6.9" simulator or device if you want status bar and safe-area fidelity; the current set reuses the Google Play artwork.
