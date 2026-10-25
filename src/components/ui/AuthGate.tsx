'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth } from '@/lib/silentFetch';

type AuthStatus = 'loading' | 'authed' | 'guest' | 'unavailable';

export function useAuthStatus() {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    const detect = async () => {
      if (document.visibilityState !== 'visible') return;
      const result = await checkAuth();
      if (cancelled) return;
      if (result.status !== 'unavailable') {
        setUser(result.user || null);
        setStatus(result.status);
      } else {
        setStatus('unavailable');
      }
    };
    detect();
    window.addEventListener('auth:changed', detect);
    window.addEventListener('online', detect);
    window.addEventListener('focus', detect);
    document.addEventListener('visibilitychange', detect);
    return () => {
      cancelled = true;
      window.removeEventListener('auth:changed', detect);
      window.removeEventListener('online', detect);
      window.removeEventListener('focus', detect);
      document.removeEventListener('visibilitychange', detect);
    };
  }, []);

  return { status, user };
}

/** Показує вміст тільки гостям (незалогіненим). */
export function GuestOnly({ children }: { children: React.ReactNode }) {
  const { status } = useAuthStatus();
  if (status === 'guest') return <>{children}</>;
  if (status === 'unavailable') return <AuthUnavailable />;
  return null;
}

function AuthUnavailable() {
  return (
    <div role="status" className="mx-auto max-w-xl p-4 text-center text-neutral-700">
      <p>Не вдалося перевірити сесію. Перевірте з’єднання та повторіть спробу.</p>
      <button
        type="button"
        className="mt-2 text-primary-700 underline"
        onClick={() => window.dispatchEvent(new Event('auth:changed'))}
      >
        Повторити
      </button>
    </div>
  );
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
    const redirectIfAuthenticated = async () => {
      const result = await checkAuth();
      if (result.status !== 'authed' || cancelled) return;
      const target = getSafeRedirect(new URLSearchParams(window.location.search).get('redirect'));
      router.replace(target);
    };
    redirectIfAuthenticated();
    window.addEventListener('online', redirectIfAuthenticated);
    window.addEventListener('focus', redirectIfAuthenticated);
    return () => {
      cancelled = true;
      window.removeEventListener('online', redirectIfAuthenticated);
      window.removeEventListener('focus', redirectIfAuthenticated);
    };
  }, [router]);

  return null;
}

/** Показує вміст тільки залогіненим; viewerAllowed=false ховає його від акаунтів "Глядач". */
export function AuthOnly({ children, viewerAllowed = true }: { children: React.ReactNode; viewerAllowed?: boolean }) {
  const { status, user } = useAuthStatus();
  if (status === 'unavailable') return <AuthUnavailable />;
  if (status !== 'authed') return null;
  if (!viewerAllowed && user?.accountType === 'viewer') return null;
  return <>{children}</>;
}
