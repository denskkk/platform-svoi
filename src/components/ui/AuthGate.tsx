'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth } from '@/lib/silentFetch';

type AuthStatus = 'loading' | 'authed' | 'guest';

export function useAuthStatus() {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    const detect = async () => {
      const result = await checkAuth();
      if (cancelled) return;
      setUser(result.user || null);
      setStatus(result.isAuthed ? 'authed' : 'guest');
    };
    detect();
    window.addEventListener('auth:changed', detect);
    return () => {
      cancelled = true;
      window.removeEventListener('auth:changed', detect);
    };
  }, []);

  return { status, user };
}

/** Показує вміст тільки гостям (незалогіненим). */
export function GuestOnly({ children }: { children: React.ReactNode }) {
  const { status } = useAuthStatus();
  return status === 'guest' ? <>{children}</> : null;
}

/** Безпечний шлях для повернення після входу (тільки відносні адреси цього сайту). */
export function getSafeRedirect(raw: string | null | undefined, fallback = '/'): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) return fallback;
  return raw;
}

/** Якщо сесія вже активна (перевіряємо cookie на сервері) — переводить далі зі сторінок входу/реєстрації. */
export function RedirectIfAuthed() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (!res.ok || cancelled) return;
        const target = getSafeRedirect(new URLSearchParams(window.location.search).get('redirect'));
        router.replace(target);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}

/** Показує вміст тільки залогіненим; viewerAllowed=false ховає його від акаунтів "Глядач". */
export function AuthOnly({ children, viewerAllowed = true }: { children: React.ReactNode; viewerAllowed?: boolean }) {
  const { status, user } = useAuthStatus();
  if (status !== 'authed') return null;
  if (!viewerAllowed && user?.accountType === 'viewer') return null;
  return <>{children}</>;
}
