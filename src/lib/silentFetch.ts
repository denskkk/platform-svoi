/**
 * Клієнтська логіка сесії:
 *  - checkAuth() — перевірка сесії на сервері (один спільний запит, без лавини /me),
 *  - refreshSession() — оновлення токенів (один запит на всі вкладки та компоненти),
 *  - автоматичне відновлення після 401 для всіх /api/* запитів (fetch патчиться один раз).
 *
 * Все працює в самому веб-застосунку, тому оновлення доходить до APK (Capacitor server.url)
 * без перебирання застосунку.
 */

import { clearAuth, getToken, saveToken } from '@/lib/client-auth';

export type AuthCheckResult = {
  status: 'authed' | 'guest' | 'unavailable';
  isAuthed: boolean | null;
  user?: unknown;
};

type RefreshResult = 'refreshed' | 'guest' | 'unavailable';

declare global {
  interface Window {
    __sviyRawFetch?: typeof fetch;
    __sviyFetchPatched?: boolean;
  }
}

const LAST_REFRESH_KEY = 'sviy_last_refresh';
// Профілактичне оновлення при старті застосунку — не частіше ніж раз на 6 годин
const BOOTSTRAP_REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;
const AUTH_CACHE_MS = 1500;
const GUEST_REFRESH_BACKOFF_MS = 10_000;
// Ці маршрути самі керують авторизацією — автоповтор для них не потрібен
const NO_AUTO_REFRESH = /^\/api\/auth\/(me|login|register|register-business|refresh|logout)(\/|$)/;

const isBrowser = typeof window !== 'undefined';

// Оригінальний fetch зберігаємо до патчу, щоб оновлення токенів не зациклювалось на собі
const rawFetch: typeof fetch = isBrowser
  ? (window.__sviyRawFetch ??= window.fetch.bind(window))
  : (input, init) => fetch(input, init);

let refreshInFlight: Promise<RefreshResult> | null = null;
let authInFlight: Promise<AuthCheckResult> | null = null;
let lastAuth: { at: number; result: AuthCheckResult } | null = null;
let lastGuestAt = 0;

export async function silentFetch(url: string, options?: RequestInit): Promise<Response> {
  return fetch(url, options);
}

function readLastRefresh(): number {
  try {
    return Number(localStorage.getItem(LAST_REFRESH_KEY)) || 0;
  } catch {
    return 0;
  }
}

function writeLastRefresh() {
  try {
    localStorage.setItem(LAST_REFRESH_KEY, String(Date.now()));
  } catch {
    // localStorage може бути недоступний — не критично
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function attemptRefresh(): Promise<RefreshResult> {
  const legacyToken = getToken();

  // Мобільна мережа нестабільна: одна повторна спроба при обриві/5xx
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await rawFetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: legacyToken ? { Authorization: `Bearer ${legacyToken}` } : {},
      });

      // 401 — сесії справді більше немає (завершена, відкликана або минув строк)
      if (response.status === 401) return 'guest';
      if (response.ok) {
        const data = await response.json().catch(() => null);
        if (data && typeof data.token === 'string' && data.token) {
          // localStorage — лише кеш для старих запитів із Authorization; доказом входу він не є
          saveToken(data.token);
          writeLastRefresh();
          return 'refreshed';
        }
        return 'unavailable';
      }
      if (response.status < 500) return 'unavailable';
    } catch {
      // мережева помилка — пробуємо ще раз
    }
    if (attempt === 0) await sleep(800);
  }
  return 'unavailable';
}

export async function refreshSession(): Promise<RefreshResult> {
  if (!refreshInFlight) {
    const run = (async () => {
      if (isBrowser && 'locks' in navigator && navigator.locks) {
        return navigator.locks.request('sviy-auth-refresh', attemptRefresh);
      }
      return attemptRefresh();
    })();
    const tracked: Promise<RefreshResult> = run.finally(() => {
      if (refreshInFlight === tracked) refreshInFlight = null;
    });
    refreshInFlight = tracked;
  }
  return refreshInFlight;
}

/**
 * Токен для старих сторінок, що читають його з localStorage. Якщо там порожньо (очищене
 * сховище WebView), але cookie-сесія жива — отримуємо токен через refresh замість виходу на логін.
 * Повертає null лише коли сесії справді немає.
 */
export async function ensureToken(): Promise<string | null> {
  const existing = getToken();
  if (existing) return existing;
  const result = await refreshSession();
  return result === 'refreshed' ? getToken() : null;
}

function fetchMe() {
  return rawFetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
}

async function runAuthCheck(): Promise<AuthCheckResult> {
  try {
    let response = await fetchMe();

    if (response.status === 401) {
      const refreshed = await refreshSession();
      if (refreshed === 'guest') {
        lastGuestAt = Date.now();
        clearAuth();
        return { status: 'guest', isAuthed: false };
      }
      if (refreshed === 'unavailable') return { status: 'unavailable', isAuthed: null };
      response = await fetchMe();
    } else if (response.ok && Date.now() - readLastRefresh() > BOOTSTRAP_REFRESH_INTERVAL_MS) {
      // Продовжуємо сесію у фоні; результат не блокує показ сторінки
      void refreshSession();
    }

    if (response.ok) {
      const data = await response.json();
      return { status: 'authed', isAuthed: true, user: data.user };
    }
    if (response.status === 401) {
      lastGuestAt = Date.now();
      clearAuth();
      return { status: 'guest', isAuthed: false };
    }
    return { status: 'unavailable', isAuthed: null };
  } catch {
    return { status: 'unavailable', isAuthed: null };
  }
}

/**
 * Перевіряє сесію на сервері. Одночасні виклики (Navbar, AuthGate, монітор...) ділять один запит,
 * а чинний результат кілька секунд перевикористовується. Тимчасова недоступність мережі
 * НЕ вважається виходом із системи.
 */
export function checkAuth(): Promise<AuthCheckResult> {
  if (lastAuth && lastAuth.result.status !== 'unavailable' && Date.now() - lastAuth.at < AUTH_CACHE_MS) {
    return Promise.resolve(lastAuth.result);
  }
  if (!authInFlight) {
    const run = runAuthCheck().then((result) => {
      lastAuth = { at: Date.now(), result };
      return result;
    });
    const tracked: Promise<AuthCheckResult> = run.finally(() => {
      if (authInFlight === tracked) authInFlight = null;
    });
    authInFlight = tracked;
  }
  return authInFlight;
}

function requestPathname(input: RequestInfo | URL): string | null {
  try {
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const url = new URL(raw, window.location.href);
    return url.origin === window.location.origin ? url.pathname : null;
  } catch {
    return null;
  }
}

function canAutoRefresh(input: RequestInfo | URL, init?: RequestInit): boolean {
  const pathname = requestPathname(input);
  if (!pathname || !pathname.startsWith('/api/') || NO_AUTO_REFRESH.test(pathname)) return false;
  if (typeof ReadableStream !== 'undefined' && init?.body instanceof ReadableStream) return false;
  return true;
}

function withFreshAuthHeader(init?: RequestInit): RequestInit | undefined {
  if (!init?.headers) return init;
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token && headers.has('authorization')) {
    headers.set('authorization', `Bearer ${token}`);
  }
  return { ...init, headers };
}

async function recoverSession(): Promise<boolean> {
  // Гість без сесії: не засипаємо сервер запитами /refresh
  if (Date.now() - lastGuestAt < GUEST_REFRESH_BACKOFF_MS) return false;

  const result = await refreshSession();
  if (result === 'refreshed') return true;

  if (result === 'guest') {
    lastGuestAt = Date.now();
    let hadSession = false;
    try {
      hadSession = Boolean(getToken() || localStorage.getItem('user'));
    } catch {
      // ignore
    }
    clearAuth();
    // Повідомляємо інтерфейс лише один раз — коли сесія справді щойно завершилась
    if (hadSession) setTimeout(() => window.dispatchEvent(new Event('auth:changed')), 0);
  }
  return false;
}

/**
 * Якщо будь-який /api/* запит отримав 401 (минув access-токен), один раз оновлюємо сесію
 * і повторюємо запит — користувач нічого не помічає.
 */
function installAuthFetch() {
  if (!isBrowser || window.__sviyFetchPatched) return;
  window.__sviyFetchPatched = true;

  window.fetch = async function patchedFetch(input: RequestInfo | URL, init?: RequestInit) {
    const retryable = canAutoRefresh(input, init);
    const retryInput = retryable && input instanceof Request ? input.clone() : input;

    const response = await rawFetch(input, init);
    if (response.status !== 401 || !retryable) return response;

    const recovered = await recoverSession();
    if (!recovered) return response;
    return rawFetch(retryInput, withFreshAuthHeader(init));
  };
}

if (isBrowser) {
  // Явна зміна авторизації (вхід/вихід/«Повторити») — результати кешу вже неактуальні
  window.addEventListener('auth:changed', () => {
    lastAuth = null;
    authInFlight = null;
    lastGuestAt = 0;
  });
  installAuthFetch();
}
