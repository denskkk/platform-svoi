/**
 * GET /api/conversations/unread-count
 * Получить количество непрочитанных сообщений
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { getAuthCookie } from '@/lib/cookies';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Проверка авторизации
    let token = getAuthCookie(request);
    
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return NextResponse.json(
        { error: 'Не авторизовано' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Невалідний токен' },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // Считаем непрочитанные сообщения
    const unreadCount = await prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false
      }
    });

    return NextResponse.json({
      unreadCount
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    return NextResponse.json(
      { error: 'Помилка сервера' },
      { status: 500 }
    );
  }
}
