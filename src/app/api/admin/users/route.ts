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

// GET /api/admin/users - Список всіх користувачів з детальною статистикою
async function handler(request: NextRequest) {
  const userId = (request as any).userId;
  
  try {
    // Перевірити що userId існує
    if (!userId) {
      return NextResponse.json(
        { error: 'Необхідна авторізація' },
        { status: 401 }
      );
    }
    
    // Перевірити адмін права
    await checkAdmin(userId);
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const order = searchParams.get('order') || 'desc';
    
    const skip = (page - 1) * limit;
    
    // Фільтр пошуку
    const where: any = search ? {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } }
      ]
    } : {};
    
    // Отримати користувачів
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          city: true,
          region: true,
          balanceUcm: true,
          isAdmin: true,
          isVerified: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
          avatarUrl: true,
          avgRating: true,
          totalReviews: true,
          _count: {
            select: {
              services: true,
              sentMessages: true,
              receivedMessages: true,
              ucmTransactions: true
            }
          }
        },
        orderBy: {
          [sortBy]: order
        },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ]);
    
    // Для кожного користувача отримати детальну статистику транзакцій
    const usersWithStats = await Promise.all(
      users.map(async (user: any) => {
        const [
          ucmSent,
          ucmReceived,
          recentTransactions
        ] = await Promise.all([
          // Скільки УЦМ відправлено
          prisma.ucmTransaction.aggregate({
            where: {
              userId: user.id,
              amount: { lt: 0 }
            },
            _sum: { amount: true }
          }),
          
          // Скільки УЦМ отримано
          prisma.ucmTransaction.aggregate({
            where: {
              userId: user.id,
              amount: { gt: 0 }
            },
            _sum: { amount: true }
          }),
          
          // Останні 5 транзакцій
          prisma.ucmTransaction.findMany({
            where: { userId: user.id },
            select: {
              id: true,
              amount: true,
              reason: true,
              description: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 5
          })
        ]);
        
        return {
          ...user,
          stats: {
            servicesCount: user._count.services,
            messagesSent: user._count.sentMessages,
            messagesReceived: user._count.receivedMessages,
            transactionsCount: user._count.ucmTransactions,
            ucmSent: Math.abs(ucmSent._sum.amount || 0),
            ucmReceived: ucmReceived._sum.amount || 0,
            recentTransactions
          }
        };
      })
    );
    
    return NextResponse.json({
      success: true,
      users: usersWithStats,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
    
  } catch (error: any) {
    console.error('Admin users error:', error);
    return NextResponse.json(
      { error: error.message || 'Помилка отримання списку користувачів' },
      { status: error.message.includes('Доступ заборонено') ? 403 : 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return withAuth(request, handler);
}
