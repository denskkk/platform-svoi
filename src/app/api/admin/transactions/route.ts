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

// GET /api/admin/transactions - Детальна статистика транзакцій УЦМ
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type') || 'all'; // all, transfer, grant, etc.
    const userIdFilter = searchParams.get('userId');
    
    const skip = (page - 1) * limit;
    
    // Фільтр по типу транзакції
    const where: any = {};
    
    if (type !== 'all') {
      where.reason = type;
    }
    
    if (userIdFilter) {
      where.userId = parseInt(userIdFilter);
    }
    
    // Отримати транзакції
    const [transactions, totalCount] = await Promise.all([
      prisma.ucmTransaction.findMany({
        where,
        select: {
          id: true,
          amount: true,
          reason: true,
          description: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              city: true,
              balanceUcm: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.ucmTransaction.count({ where })
    ]);
    
    // Статистика по типах транзакцій
    const transactionStats = await prisma.ucmTransaction.groupBy({
      by: ['reason'],
      _count: {
        id: true
      },
      _sum: {
        amount: true
      },
      _avg: {
        amount: true
      }
    });
    
    // Найбільші перекази
    const biggestTransfers = await prisma.ucmTransaction.findMany({
      where: {
        reason: {
          in: ['transfer_sent', 'transfer_received']
        }
      },
      select: {
        id: true,
        amount: true,
        reason: true,
        description: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            city: true
          }
        }
      },
      orderBy: {
        amount: 'desc'
      },
      take: 10
    });
    
    // Статистика за період
    const [
      transactionsToday,
      transactionsWeek,
      transactionsMonth
    ] = await Promise.all([
      prisma.ucmTransaction.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      prisma.ucmTransaction.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.ucmTransaction.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);
    
    return NextResponse.json({
      success: true,
      transactions,
      stats: {
        byType: transactionStats,
        byPeriod: {
          today: transactionsToday,
          week: transactionsWeek,
          month: transactionsMonth
        },
        biggestTransfers
      },
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
    
  } catch (error: any) {
    console.error('Admin transactions error:', error);
    return NextResponse.json(
      { error: error.message || 'Помилка отримання статистики транзакцій' },
      { status: error.message.includes('Доступ заборонено') ? 403 : 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return withAuth(request, handler);
}
