/**
 * Кнопка «назад» у шапці на телефоні. Сторінки з власною стрілкою (меню кабінету, проєкти, сервіси, чати...) сюди не входять —
 * тут лише ті, де власної немає. Кореневі вкладки нижнього меню (стрічка, рілси, проєкти, чати, кабінет) теж без «назад».
 */
import { splitLocalePrefix } from '@/i18n/routes';

const WITH_BACK = [
  '/about', '/account-deletion', '/auth/restore', '/auth/questionnaire', '/auth/business-questionnaire',
  '/blocked', '/business', '/catalog', '/clubs/new', '/companies', '/contacts', '/earnings', '/favorites',
  '/friends', '/invite', '/my-listings', '/notifications', '/organizations', '/privacy', '/profile/',
  '/public-requests', '/requests/create', '/search', '/service-requests', '/services', '/support', '/terms-of-use',
];

/** Сторінки зі своєю стрілкою всередині (виключення з префіксів вище). */
const OWN_BACK = ['/service-requests/create', '/public-requests/create', '/profile/edit', '/services/create'];

export function needsBackButton(pathname: string): boolean {
  const { path } = splitLocalePrefix(pathname || '/');
  const p = path.replace(/\/+$/, '') || '/';
  if (OWN_BACK.some((o) => p === o || p.startsWith(`${o}/`))) return false;
  if (/^\/services\/[^/]+/.test(p)) return false; // /services/[id] має власну
  return WITH_BACK.some((w) => (w.endsWith('/') ? p.startsWith(w) : p === w || p.startsWith(`${w}/`)));
}

/** Назад по історії; якщо історії немає (відкрили посилання) — на головну сторінку стрічки. */
export function goBack(router: { back: () => void; push: (href: string) => void }, signedIn: boolean): void {
  try {
    if (typeof window !== 'undefined' && window.history.length > 1) { router.back(); return; }
  } catch { /* ignore */ }
  router.push(signedIn ? '/feed' : '/');
}
