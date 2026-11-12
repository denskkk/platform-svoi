/**
 * Клієнтські хелпери стрічки (працюють і в браузері, і в Capacitor WebView).
 */

export function authHeaders(): Record<string, string> {
  try {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export function jsonHeaders(): Record<string, string> {
  return { 'Content-Type': 'application/json', ...authHeaders() };
}

export interface FeedAuthor {
  id: number;
  name: string;
  avatarUrl: string | null;
  city: string | null;
  profession: string | null;
  isVerified: boolean;
  accountType: string;
}

export interface FeedPost {
  id: number;
  content: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  edited?: boolean;
  images: { id: number; url: string }[];
  author: FeedAuthor;
  viewer: { liked: boolean; isOwn: boolean; following: boolean; saved?: boolean };
}

export interface FeedComment {
  id: number;
  content: string;
  createdAt: string;
  isOwn: boolean;
  author: { id: number; name: string; avatarUrl: string | null; isVerified: boolean };
}

export function readStoredUser(): { id: number; accountType: string; firstName?: string; lastName?: string; avatarUrl?: string | null } | null {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const u = JSON.parse(raw);
    const id = Number(u?.id ?? u?.userId);
    return id ? { ...u, id, accountType: u.accountType } : null;
  } catch {
    return null;
  }
}

/** «5 хв тому» / «5 min ago» — через Intl, без залежності від рядків перекладу. */
export function timeAgo(iso: string, locale: string, justNow: string): string {
  const diffSec = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 45) return justNow;
  const rtf = new Intl.RelativeTimeFormat(locale === 'uk' ? 'uk-UA' : 'en', { numeric: 'auto' });
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour');
  if (abs < 86400 * 7) return rtf.format(Math.round(diffSec / 86400), 'day');
  return new Date(iso).toLocaleDateString(locale === 'uk' ? 'uk-UA' : 'en', { day: 'numeric', month: 'short', year: 'numeric' });
}
