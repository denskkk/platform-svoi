/**
 * Клієнтський hook для роботи з автентифікацією (httpOnly cookies)
 * 
 * ВАЖЛИВО: Токени більше НЕ зберігаються в localStorage (захист від XSS)
 * Замість цього використовуються httpOnly cookies
 */

'use client';

import { useState, useEffect } from 'react';
import { checkAuth as checkAuthSession } from '@/lib/silentFetch';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  city?: string;
  avatarUrl?: string;
  isVerified: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'authed' | 'guest' | 'unavailable'>('guest');

  // Перевіряємо чи є користувач залогінений (токен в httpOnly cookie)
  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const result = await checkAuthSession();
    setStatus(result.status);
    if (result.status !== 'unavailable') {
      setUser((result.user as User | undefined) ?? null);
    }
    setLoading(false);
  }

  async function login(email: string, password: string) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // ВАЖЛИВО: включаємо cookies
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Помилка входу');
    }

    // Токен НЕ повертається в JSON - він вже в httpOnly cookie
    setUser(data.user);
    setStatus('authed');
    return data;
  }

  async function register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    city?: string;
    role?: string;
  }) {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // ВАЖЛИВО: включаємо cookies
      body: JSON.stringify(userData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Помилка реєстрації');
    }

    // Токен НЕ повертається в JSON - він вже в httpOnly cookie
    setUser(data.user);
    setStatus('authed');
    return data;
  }

  async function logout() {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Не вдалося завершити сесію на сервері');
      setUser(null);
      setStatus('guest');
    } catch (error) {
      setStatus('unavailable');
      throw error;
    }
  }

  return {
    user,
    loading,
    isAuthenticated: status === 'authed',
    status,
    login,
    register,
    logout,
    checkAuth
  };
}

/**
 * Утілітна функція для виконання автентифікованих запитів
 * ВАЖЛИВО: завжди передавайте credentials: 'include'
 */
export async function authFetch(url: string, options: RequestInit = {}) {
  return fetch(url, {
    ...options,
    credentials: 'include', // Автоматично включає cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
}
