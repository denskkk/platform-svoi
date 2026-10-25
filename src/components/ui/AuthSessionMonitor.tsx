'use client';

import { useEffect } from 'react';
import { checkAuth } from '@/lib/silentFetch';

export function AuthSessionMonitor() {
  useEffect(() => {
    let active = true;
    let checking = false;

    const verifySession = async () => {
      if (!active || checking || !navigator.onLine || document.visibilityState !== 'visible') return;
      checking = true;
      try {
        await checkAuth();
      } finally {
        checking = false;
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void verifySession();
    };

    void verifySession();
    window.addEventListener('auth:changed', verifySession);
    window.addEventListener('online', verifySession);
    window.addEventListener('focus', verifySession);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      active = false;
      window.removeEventListener('auth:changed', verifySession);
      window.removeEventListener('online', verifySession);
      window.removeEventListener('focus', verifySession);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return null;
}
