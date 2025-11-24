import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/authMiddleware';

// Перевірка чи користувач адміністратор
async function checkAdmin(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true }
  });
  
  if (!user?.isAdmin) {
    throw new Error('Доступ заборонено. Тільки для адміністраторів.');
  }
  
  return true;
}

// GET /api/admin/conversations - Статистика переписок
async function handler(request: NextRequest) {
  const userId = (request as any).user?.userId;
  
  try {
    // Перевірити що userId існує
    if (!userId) {
      return NextResponse.json(
        { error: 'Необхідна авторизація' },
        { status: 401 }
      );
    }
    
    // Перевірити адмін права
    await checkAdmin(userId);
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Отримати всі бесіди
    const conversations = await prisma.conversation.findMany({
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        participants: {
          select: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                city: true
              }
            }
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
      take: limit
    });
    
    // Детальна статистика по повідомленнях
    const [
      totalMessages,
      messagesLast24h,
      messagesLast7d,
      topChatters
    ] = await Promise.all([
      // Всього повідомлень
      prisma.message.count(),
      
      // Повідомлень за останні 24 години
      prisma.message.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Повідомлень за останні 7 днів
      prisma.message.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Топ користувачів по відправленим повідомленням
      prisma.user.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          _count: {
            select: {
              sentMessages: true
            }
          }
        },
        orderBy: {
          sentMessages: {
            _count: 'desc'
          }
        },
        take: 10
      })
    ]);
    
    // Форматувати бесіди
    const formattedConversations = conversations.map((conv: any) => {
      const participantUsers = conv.participants.map((p: any) => p.user);
      
      return {
        id: conv.id,
        participants: participantUsers,
        messagesCount: conv._count.messages,
        createdAt: conv.createdAt,
        lastActivity: conv.updatedAt
      };
    });
    
    return NextResponse.json({
      success: true,
      stats: {
        totalMessages,
        messagesLast24h,
        messagesLast7d,
        totalConversations: conversations.length,
        topChatters
      },
      conversations: formattedConversations
    });
    
  } catch (error: any) {
    console.error('Admin conversations error:', error);
    return NextResponse.json(
      { error: error.message || 'Помилка отримання статистики переписок' },
      { status: error.message.includes('Доступ заборонено') ? 403 : 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return withAuth(request, handler);
}
