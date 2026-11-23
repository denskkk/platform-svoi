/**
 * Відкриття посилань у мобільному застосунку (universal links / app links) і посилання на магазини.
 * Усе налаштовується змінними середовища на VPS (див. docs/APP_LINKS.md); без них функції тихо вимикаються.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://sviydlyasvoih.com.ua').replace(/\/$/, '');
export const ANDROID_PACKAGE = 'com.sviy_dlya_svoih.android';
export const IOS_BUNDLE_ID = 'com.sviy-dlya-svoih.ios';

export const PLAY_STORE_URL = process.env.NEXT_PUBLIC_PLAY_STORE_URL || `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
/** https://apps.apple.com/app/id<число> — додайте в .env після публікації в App Store */
export const APP_STORE_URL = process.env.NEXT_PUBLIC_APP_STORE_URL || '';

/** Адреси, які мають відкриватися в застосунку (узгоджено з AndroidManifest і apple-app-site-association). */
export const APP_PATH_PREFIXES = ['/feed/', '/video', '/profile/', '/listings/', '/clubs/', '/companies/'];

export function isAppPath(pathname: string): boolean {
  return APP_PATH_PREFIXES.some((p) => pathname === p.replace(/\/$/, '') || pathname.startsWith(p));
}

/** Chrome на Android: відкриває застосунок, а якщо його немає — веде в Google Play. */
export function androidIntentUrl(pathAndQuery: string): string {
  const host = SITE_URL.replace(/^https?:\/\//, '');
  const fallback = encodeURIComponent(PLAY_STORE_URL);
  return `intent://${host}${pathAndQuery}#Intent;scheme=https;package=${ANDROID_PACKAGE};S.browser_fallback_url=${fallback};end`;
}
