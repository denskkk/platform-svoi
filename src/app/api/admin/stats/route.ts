import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/authMiddleware';
import { getApiT } from '@/i18n/server';
import { AdminForbiddenError } from '@/lib/api-middleware';

// Перевірка чи користувач адміністратор
async function checkAdmin(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  
  if (!(user as any)?.isAdmin) {
    throw new AdminForbiddenError();
  }
  
  return true;
}

// GET /api/admin/stats - Загальна статистика
async function handler(request: NextRequest) {
  const t = getApiT(request);
  const userId = (request as any).user?.userId;
  
  try {
    // Перевірити що userId існує
    if (!userId) {
      return NextResponse.json(
        { error: t('api.common.authRequired') },
        { status: 401 }
      );
    }
    
    // Перевірити адмін права
    await checkAdmin(userId);
    
    // Загальна статистика платформи
    const [
      totalUsers,
      activeUsers,
      totalServices,
      totalMessages,
      recentUsers
    ] = await Promise.all([
      // Всього користувачів
      prisma.user.count(),
      
      // Активні користувачі (за останні 30 днів)
      prisma.user.count({
        where: {
          lastLogin: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Всього послуг
      prisma.service.count(),
      
      // Всього повідомлень
      prisma.message.count(),
      
      // Нові користувачі (за останні 7 днів)
      prisma.user.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          createdAt: true,
          city: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      })
    ]);
    
    return NextResponse.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          recent: recentUsers
        },
        services: {
          total: totalServices
        },
        messages: {
          total: totalMessages
        }
      }
    });
    
  } catch (error: any) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: error instanceof AdminForbiddenError ? t('api.common.adminOnly') : t('api.admin.statsError') },
      { status: error instanceof AdminForbiddenError ? 403 : 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return withAuth(request, handler);
}
