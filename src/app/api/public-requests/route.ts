import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Форсувати завжди динамічне виконання (уникнути статичного кешу)
export const dynamic = 'force-dynamic';

// GET /api/public-requests - Отримати всі публічні заявки
export async function GET(request: NextRequest) {
  try {
    const publicRequests = await prisma.serviceRequest.findMany({
      where: {
        isPublic: true,
        status: {
          notIn: ['completed', 'paid', 'cancelled', 'rejected']
        }
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            city: true,
            avatarUrl: true
          }
        }
      },
      orderBy: [
        { isPromoted: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    console.log(`[public-requests] Знайдено публічних заявок: ${publicRequests.length}`);

    const res = NextResponse.json({
      success: true,
      requests: publicRequests
    });
    // Відключити будь-яке HTTP кешування на рівні CDN/браузера
    res.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    return res;
  } catch (error) {
    console.error('Помилка отримання публічних заявок:', error);
    return NextResponse.json(
      { error: 'Помилка сервера' },
      { status: 500 }
    );
  }
}
