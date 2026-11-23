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
  if (typeof window === 'undefined') return;
  // Усе, що належить конкретній людині, щоб наступний користувач цього пристрою не побачив чужого.
  // svoi_ref (код запрошення з посилання) лишаємо: він потрібен для реєстрації нової людини.
  try {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('sviy_last_refresh');
    sessionStorage.clear();
  } catch { /* сховище недоступне */ }
}

/**
 * Вийти з системи (видалити локальні дані + викликати API logout)
 */
export async function logout() {
  try {
    let token: string | null = null;
    try { token = localStorage.getItem('token'); } catch { /* noop */ }
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch { /* сервер недоступний: локально все одно виходимо */ } finally {
    // Локальні дані чистимо завжди
    clearAuth();
    try { window.dispatchEvent(new Event('auth:changed')); } catch { /* noop */ }
  }
}

/**
 * Повний вихід: сервер + локальні дані + жорстке перезавантаження сторінки,
 * щоб у пам'яті не лишилось нічого від попереднього користувача.
 */
export async function performLogout(to: string = '/') {
  await logout();
  window.location.assign(to);
}
