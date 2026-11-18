'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStatus } from '@/components/ui/AuthGate';

/** Авторизованих користувачів з головної сторінки відправляємо у стрічку; гості бачать лендинг. */
export function HomeRedirect() {
  const router = useRouter();
  const { status } = useAuthStatus();
  useEffect(() => {
    if (status === 'authed') router.replace('/feed');
  }, [status, router]);
  return null;
}
