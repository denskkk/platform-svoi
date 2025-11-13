/**
 * GET /api/conversations
 * Получить список всех диалогов текущего пользователя
 * 
 * POST /api/conversations
 * Создать новый диалог или получить существующий
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { getAuthCookie } from '@/lib/cookies';

export const dynamic = 'force-dynamic';

// GET - Получить все диалоги текущего пользователя
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

    // Получаем все диалоги пользователя
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      },
      include: {
        user1: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            role: true,
            isActive: true,
          }
        },
        user2: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            role: true,
            isActive: true,
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1, // Последнее сообщение
          select: {
            id: true,
            content: true,
            senderId: true,
            isRead: true,
            createdAt: true,
          }
        },
        _count: {
          select: {
            messages: {
              where: {
                receiverId: userId,
                isRead: false
              }
            }
          }
        }
      },
      orderBy: {
        lastMessageAt: 'desc'
      }
    });

    // Форматируем ответ
    const formattedConversations = conversations.map((conv: any) => {
      const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1;
      const lastMessage = conv.messages[0] || null;
      const unreadCount = conv._count.messages;

      return {
        id: conv.id,
        otherUser,
        lastMessage,
        unreadCount,
        lastMessageAt: conv.lastMessageAt,
        createdAt: conv.createdAt,
      };
    });

    return NextResponse.json({
      conversations: formattedConversations
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json(
      { error: 'Помилка сервера' },
      { status: 500 }
    );
  }
}

// POST - Создать новый диалог или получить существующий
export async function POST(request: NextRequest) {
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
    const body = await request.json();
    const { otherUserId } = body;

    if (!otherUserId) {
      return NextResponse.json(
        { error: 'Не вказано ID співрозмовника' },
        { status: 400 }
      );
    }

    if (otherUserId === userId) {
      return NextResponse.json(
        { error: 'Не можна створити діалог з самим собою' },
        { status: 400 }
      );
    }

    // Проверяем существование пользователя
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        isActive: true,
      }
    });

    if (!otherUser) {
      return NextResponse.json(
        { error: 'Користувача не знайдено' },
        { status: 404 }
      );
    }

    if (!otherUser.isActive) {
      return NextResponse.json(
        { error: 'Користувач не активний' },
        { status: 400 }
      );
    }

    // Проверяем, существует ли уже диалог
    // Нужно учесть оба порядка пользователей
    const [user1Id, user2Id] = userId < otherUserId ? [userId, otherUserId] : [otherUserId, userId];

    let conversation = await prisma.conversation.findFirst({
      where: {
        user1Id: user1Id,
        user2Id: user2Id
      },
      include: {
        user1: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          }
        },
        user2: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          }
        }
      }
    });

    // Если диалога нет - создаем
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          user1Id,
          user2Id,
        },
        include: {
          user1: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            }
          },
          user2: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            }
          }
        }
      });
    }

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        otherUser: conversation.user1Id === userId ? conversation.user2 : conversation.user1,
        createdAt: conversation.createdAt,
      }
    }, { status: conversation ? 200 : 201 });

  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json(
      { error: 'Помилка сервера' },
      { status: 500 }
    );
  }
}
