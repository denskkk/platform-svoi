/**
 * CSRF Protection для форм
 * Генерує та перевіряє CSRF токени
 */

import { randomBytes } from 'crypto';

interface CsrfStore {
  [token: string]: {
    createdAt: number;
    used: boolean;
  };
}

const csrfStore: CsrfStore = {};

// Очищення старих токенів кожні 10 хвилин
setInterval(() => {
  const now = Date.now();
  const maxAge = 60 * 60 * 1000; // 1 година
  
  Object.keys(csrfStore).forEach(token => {
    if (now - csrfStore[token].createdAt > maxAge) {
      delete csrfStore[token];
    }
  });
}, 10 * 60 * 1000);

/**
 * Генерує новий CSRF токен
 */
export function generateCsrfToken(): string {
  const token = randomBytes(32).toString('hex');
  
  csrfStore[token] = {
    createdAt: Date.now(),
    used: false
  };
  
  return token;
}

/**
 * Перевіряє валідність CSRF токена
 */
export function verifyCsrfToken(token: string | null): boolean {
  if (!token) {
    return false;
  }

  const stored = csrfStore[token];
  
  if (!stored) {
    return false;
  }

  // Перевірка що токен не застарілий (1 година)
  const maxAge = 60 * 60 * 1000;
  if (Date.now() - stored.createdAt > maxAge) {
    delete csrfStore[token];
    return false;
  }

  // Перевірка що токен не використаний (one-time use)
  if (stored.used) {
    return false;
  }

  // Позначити як використаний
  stored.used = true;
  
  return true;
}

/**
 * Middleware для перевірки CSRF токена в запитах
 */
export function withCsrfProtection(handler: Function) {
  return async (request: Request, ...args: any[]) => {
    const method = request.method;
    
    // CSRF перевірка тільки для небезпечних методів
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      const csrfToken = request.headers.get('x-csrf-token');
      
      if (!verifyCsrfToken(csrfToken)) {
        return new Response(
          JSON.stringify({
            error: 'Невалідний CSRF токен'
          }),
          {
            status: 403,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }
    }

    return handler(request, ...args);
  };
}
