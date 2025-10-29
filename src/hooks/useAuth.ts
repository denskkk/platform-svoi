/**
 * Клієнтський hook для роботи з автентифікацією (httpOnly cookies)
 * 
 * ВАЖЛИВО: Токени більше НЕ зберігаються в localStorage (захист від XSS)
 * Замість цього використовуються httpOnly cookies
 */

'use client';

import { useState, useEffect } from 'react';

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

  // Перевіряємо чи є користувач залогінений (токен в httpOnly cookie)
  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      // Робимо запит на перевірку токена
      // Cookie автоматично відправляється браузером
      const response = await fetch('/api/auth/me', {
        credentials: 'include' // ВАЖЛИВО: включаємо cookies
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
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
    return data;
  }

  async function logout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include' // ВАЖЛИВО: включаємо cookies
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  }

  return {
    user,
    loading,
    isAuthenticated: !!user,
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
