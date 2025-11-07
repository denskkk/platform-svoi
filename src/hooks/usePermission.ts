/**
 * React hooks для перевірки прав доступу на клієнті
 */

'use client';

import { useState, useEffect } from 'react';
import { hasPermission, getPermissionError, PERMISSIONS, AccountType } from '@/lib/permissions';

/**
 * Hook для отримання поточного користувача
 */
export function useCurrentUser() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem('user');
        setUser(storedUser ? JSON.parse(storedUser) : null);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    // Soft sync with server to avoid stale accountType/status
    const sync = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          try {
            localStorage.setItem('user', JSON.stringify(data.user));
          } catch {}
        }
      } catch {}
    };
    sync();

    // Слухати зміни в інших вкладках
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        loadUser();
      }
    };

    const handleAuthChange = () => {
      loadUser();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth:changed', handleAuthChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth:changed', handleAuthChange as EventListener);
    };
  }, []);

  return { user, loading, accountType: user?.accountType as AccountType | null };
}

/**
 * Hook для перевірки прав доступу
 */
export function usePermission(permission: keyof typeof PERMISSIONS) {
  const { user, loading, accountType } = useCurrentUser();
  
  const hasAccess = hasPermission(accountType, permission);
  const errorMessage = hasAccess ? null : getPermissionError(permission);

  return {
    hasAccess,
    errorMessage,
    loading,
    accountType,
    user
  };
}

/**
 * Hook для перевірки чи користувач має бізнес акаунт
 */
export function useIsBusiness() {
  const { accountType } = useCurrentUser();
  return accountType === 'business' || accountType === 'business_premium';
}

/**
 * Hook для перевірки чи користувач має преміум
 */
export function useIsPremium() {
  const { accountType } = useCurrentUser();
  return accountType === 'business_premium';
}
