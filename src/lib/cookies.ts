/**
 * Утіліти для роботи з httpOnly cookies (безпечніше ніж localStorage)
 */

import { NextResponse } from 'next/server';

// Use `token` for backward compatibility with existing middleware and routes
const COOKIE_NAME = 'token';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 днів в секундах

/**
 * Встановлює auth token в httpOnly cookie
 */
export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true, // Не доступний через JavaScript (захист від XSS)
    secure: process.env.NODE_ENV === 'production', // Тільки HTTPS в production
    sameSite: 'lax', // Захист від CSRF
    maxAge: COOKIE_MAX_AGE,
    path: '/'
  });
  
  return response;
}

/**
 * Видаляє auth token з cookies
 */
export function removeAuthCookie(response: NextResponse) {
  response.cookies.delete(COOKIE_NAME);
  return response;
}

/**
 * Отримує auth token з cookies
 */
export function getAuthCookie(request: Request): string | undefined {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return undefined;

  const cookies = cookieHeader.split(';').map(c => c.trim());
  const authCookie = cookies.find(c => c.startsWith(`${COOKIE_NAME}=`));
  
  if (!authCookie) return undefined;
  
  return authCookie.split('=')[1];
}
