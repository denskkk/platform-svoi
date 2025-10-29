/**
 * POST /api/auth/logout
 * Вихід користувача (видалення сесії та cookie)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromHeader } from '@/lib/auth';
import { removeAuthCookie, getAuthCookie } from '@/lib/cookies';

export async function POST(request: NextRequest) {
  try {
    // Спробувати отримати токен з cookie (новий метод)
    let token = getAuthCookie(request);
    
    // Якщо немає в cookie, спробувати з header (старий метод)
    if (!token) {
      const authorization = request.headers.get('authorization');
      const headerToken = getTokenFromHeader(authorization);
      if (headerToken) {
        token = headerToken;
      }
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Токен не надано' },
        { status: 401 }
      );
    }

    // Видалити сесію з бази
    await prisma.session.deleteMany({
      where: { tokenHash: token }
    });

    // Створити відповідь та видалити cookie
    const response = NextResponse.json({
      success: true,
      message: 'Вихід успішний!',
    });

    removeAuthCookie(response);

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Помилка сервера' },
      { status: 500 }
    );
  }
}
