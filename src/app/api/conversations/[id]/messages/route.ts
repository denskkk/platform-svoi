/**
 * GET /api/conversations/[id]/messages
 * Получить все сообщения в диалоге
 * 
 * POST /api/conversations/[id]/messages
 * Отправить сообщение в диалог
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { getAuthCookie } from '@/lib/cookies';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET - Получить все сообщения диалога
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
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
    const conversationId = parseInt(params.id);

    if (isNaN(conversationId)) {
      return NextResponse.json(
        { error: 'Невірний ID діалогу' },
        { status: 400 }
      );
    }

    // Проверяем доступ к диалогу
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Діалог не знайдено або немає доступу' },
        { status: 404 }
      );
    }

    // Получаем сообщения
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const messages = await prisma.message.findMany({
      where: {
        conversationId
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      skip: offset,
      take: limit,
    });

    // Помечаем непрочитанные сообщения как прочитанные
    await prisma.message.updateMany({
      where: {
        conversationId,
        receiverId: userId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return NextResponse.json({
      messages,
      total: await prisma.message.count({ where: { conversationId } })
    });

  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Помилка сервера' },
      { status: 500 }
    );
  }
}

// POST - Отправить сообщение
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
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
    const conversationId = parseInt(params.id);

    if (isNaN(conversationId)) {
      return NextResponse.json(
        { error: 'Невірний ID діалогу' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Повідомлення не може бути порожнім' },
        { status: 400 }
      );
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: 'Повідомлення занадто довге (максимум 5000 символів)' },
        { status: 400 }
      );
    }

    // Проверяем доступ к диалогу
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Діалог не знайдено або немає доступу' },
        { status: 404 }
      );
    }

    // Определяем получателя
    const receiverId = conversation.user1Id === userId ? conversation.user2Id : conversation.user1Id;

    // Создаем сообщение
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        receiverId,
        content: content.trim()
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          }
        }
      }
    });

    // Обновляем время последнего сообщения в диалоге
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() }
    });

    return NextResponse.json({
      message
    }, { status: 201 });

  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Помилка сервера' },
      { status: 500 }
    );
  }
}
