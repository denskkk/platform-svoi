/**
 * Авторизація для серверних (SSR) сторінок.
 *
 * Access-cookie живе коротше за refresh-cookie. Якщо вона зникла, а refresh ще чинний,
 * не кидаємо людину на логін, а відправляємо на /auth/restore, де сесія тихо оновлюється.
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken, JWTPayload } from '@/lib/auth';

export function requireSsrAuth(returnPath: string): JWTPayload {
  const store = cookies();
  const token = store.get('token')?.value;
  const payload = token ? verifyToken(token) : null;
  if (payload) return payload;

  const hasRefresh = Boolean(store.get('refreshToken')?.value || store.get('sviy_refresh')?.value);
  const target = encodeURIComponent(returnPath);
  redirect(hasRefresh ? `/auth/restore?redirect=${target}` : `/auth/login?redirect=${target}`);
}
