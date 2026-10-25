/**
 * Утіліти для роботи з httpOnly cookies (безпечніше ніж localStorage)
 */

import { NextResponse } from 'next/server';

// Use `token` for backward compatibility with existing middleware and routes
const COOKIE_NAME = 'token';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 днів в секундах
const REFRESH_COOKIE_NAME = 'refreshToken';
const LEGACY_REFRESH_COOKIE_NAME = 'sviy_refresh';
const REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge,
    path: '/',
  };
}

/**
 * Встановлює auth token в httpOnly cookie
 */
export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set(COOKIE_NAME, token, cookieOptions(COOKIE_MAX_AGE));
  
  return response;
}

export function setRefreshCookie(response: NextResponse, token: string) {
  response.cookies.set(REFRESH_COOKIE_NAME, token, cookieOptions(REFRESH_COOKIE_MAX_AGE));
  return response;
}

/**
 * Видаляє auth token з cookies
 */
export function removeAuthCookie(response: NextResponse) {
  response.cookies.delete(COOKIE_NAME);
  response.cookies.delete(REFRESH_COOKIE_NAME);
  response.cookies.delete(LEGACY_REFRESH_COOKIE_NAME);
  return response;
}

/**
 * Отримує auth token з cookies
 */
export function getAuthCookie(request: Request): string | undefined {
  return getCookie(request, COOKIE_NAME);
}

export function getRefreshCookie(request: Request): string | undefined {
  return getCookie(request, REFRESH_COOKIE_NAME)
    || getCookie(request, LEGACY_REFRESH_COOKIE_NAME);
}

function getCookie(request: Request, name: string): string | undefined {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return undefined;

  const cookies = cookieHeader.split(';').map(c => c.trim());
  const authCookie = cookies.find(c => c.startsWith(`${name}=`));
  
  if (!authCookie) return undefined;
  
  return authCookie.slice(name.length + 1);
}
