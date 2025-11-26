import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';

// Перевірка доступу адміністратора
async function checkAdmin(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!(user as any)?.isAdmin) {
    throw new Error('Доступ заборонено. Тільки для адміністраторів.');
  }
}

// GET /api/admin/messages - Отримати всі переписки
async function handler(request: NextRequest) {
  try {
    const userId = (request as any).user?.userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Необхідна авторизація' },
        { status: 401 }
      );
    }

    await checkAdmin(userId);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const conversationId = searchParams.get('conversationId');

    const skip = (page - 1) * limit;

    // Якщо вказано conversationId, повернути повідомлення з цієї переписки
    if (conversationId) {
      const messages = await prisma.message.findMany({
        where: {
          conversationId: Number(conversationId)
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true
            }
          },
          receiver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      const conversation = await prisma.conversation.findUnique({
        where: { id: Number(conversationId) },
        include: {
          user1: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true
            }
          },
          user2: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true
            }
          }
        }
      });

      return NextResponse.json({
        conversation,
        messages,
        total: messages.length
      });
    }

    // Інакше повернути список переписок
    const where: any = {};

    // Пошук за іменем користувача
    if (search) {
      where.OR = [
        {
          user1: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } }
            ]
          }
        },
        {
          user2: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } }
            ]
          }
        }
      ];
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        include: {
          user1: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              city: true,
              avatarUrl: true
            }
          },
          user2: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              city: true,
              avatarUrl: true
            }
          },
          _count: {
            select: {
              messages: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.conversation.count({ where })
    ]);

    // Отримати останнє повідомлення для кожної переписки
    const conversationsWithLastMessage = await Promise.all(
      conversations.map(async (conv: any) => {
        const lastMessage = await prisma.message.findFirst({
          where: { conversationId: conv.id },
          orderBy: { createdAt: 'desc' },
          select: {
            content: true,
            createdAt: true,
            isRead: true
          } as any
        });

        return {
          ...conv,
          lastMessage,
          messageCount: conv._count.messages
        };
      })
    );

    return NextResponse.json({
      conversations: conversationsWithLastMessage,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error('Помилка отримання переписок:', error);
    
    if (error.message.includes('Доступ заборонено')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Помилка отримання переписок', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return withAuth(request, handler);
}
