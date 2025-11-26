import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    return NextResponse.json({
      success: true,
      requests: publicRequests
    });
  } catch (error) {
    console.error('Помилка отримання публічних заявок:', error);
    return NextResponse.json(
      { error: 'Помилка сервера' },
      { status: 500 }
    );
  }
}
