import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';

// GET /api/service-requests/new-count - Отримати кількість нових заявок для виконавця
async function getHandler(request: NextRequest) {
  try {
    const userId = (request as any).user?.userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Необхідна авторизація' },
        { status: 401 }
      );
    }

    // Порахувати нові заявки, що адресовані цьому користувачу
    const count = await prisma.serviceRequest.count({
      where: {
        executorId: userId,
        status: { in: ['new', 'viewed'] }
      }
    });

    return NextResponse.json({ count });

  } catch (error: any) {
    console.error('[service-requests/new-count] Error:', error);
    return NextResponse.json(
      { error: 'Помилка отримання кількості заявок', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return withAuth(request, getHandler);
}
