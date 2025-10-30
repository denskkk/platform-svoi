/**
 * POST /api/auth/logout
 * Вихід користувача: видаляє httpOnly cookie і (опційно) сесію
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthCookie } from '@/lib/cookies';
import { removeAuthCookie } from '@/lib/cookies';

export async function POST(request: NextRequest) {
  try {
    const token = getAuthCookie(request);

    // Створюємо відповідь одразу, cookie будемо видаляти на ній
    const response = NextResponse.json({ success: true });

    // Видаляємо cookie незалежно від наявності сесії
    removeAuthCookie(response);

    // Якщо є токен — спробуємо видалити сесію (не критично, якщо не знайдено)
    if (token) {
      try {
        await prisma.session.deleteMany({ where: { tokenHash: token } });
      } catch (e) {
        // Ігноруємо помилку видалення сесії, вихід все одно відбудеться
        console.warn('Logout: failed to delete session by tokenHash');
      }
    }

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    // Навіть у випадку помилки спробуємо віддати відповідь із видаленою cookie
    const response = NextResponse.json({ success: false }, { status: 500 });
    removeAuthCookie(response);
    return response;
  }
}
 
