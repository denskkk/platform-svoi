import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';

// GET /api/public-requests - Отримати всі публічні заявки
async function getHandler(request: NextRequest) {
  try {
    const publicRequests = await prisma.serviceRequest.findMany({
      where: {
        isPublic: true,
        status: {
          in: ['new', 'viewed']
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

export const GET = withAuth(getHandler);
