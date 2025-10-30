/**
 * Клієнтські функції для роботи з аутентифікацією
 */

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  city?: string;
  avatarUrl?: string;
  isVerified: boolean;
}

/**
 * Зберегти користувача в localStorage
 */
export function saveUser(user: User) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user));
  }
}

/**
 * Зберегти токен в localStorage
 */
export function saveToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
}

/**
 * Отримати користувача з localStorage
 */
export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * Отримати токен з localStorage
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

/**
 * Очистити всі дані користувача
 */
export function clearAuth() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }
}

/**
 * Перевірити чи користувач залогінений
 */
export function isAuthenticated(): boolean {
  return getUser() !== null && getToken() !== null;
}

/**
 * Вийти з системи (видалити локальні дані + викликати API logout)
 */
export async function logout() {
  try {
    // Викликати API для видалення сесії
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include', // Відправити cookie
    });
  } catch (error) {
    console.error('Logout API error:', error);
  } finally {
    // Очистити локальне сховище в будь-якому випадку
    clearAuth();
  }
}
