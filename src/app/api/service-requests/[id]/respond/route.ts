import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/auth-middleware';

// POST /api/service-requests/[id]/respond - Відгукнутись на публічну заявку
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authMiddleware(request);
  if (authResult.error || !authResult.user) {
    return NextResponse.json(
      { error: authResult.error || 'Необхідна авторизація' },
      { status: 401 }
    );
  }

  try {
    const requestId = parseInt(params.id);
    const body = await request.json();
    const { proposedPrice, comment, estimatedDays } = body;

    if (!proposedPrice || !comment) {
      return NextResponse.json(
        { error: 'Заповніть всі обов\'язкові поля' },
        { status: 400 }
      );
    }

    if (comment.length < 20) {
      return NextResponse.json(
        { error: 'Коментар має бути мінімум 20 символів' },
        { status: 400 }
      );
    }

    // Перевірити, чи існує заявка і чи вона публічна
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: requestId }
    });

    if (!serviceRequest) {
      return NextResponse.json(
        { error: 'Заявку не знайдено' },
        { status: 404 }
      );
    }

    if (!serviceRequest.isPublic) {
      return NextResponse.json(
        { error: 'Це приватна заявка, відгуки недоступні' },
        { status: 403 }
      );
    }

    if (serviceRequest.clientId === authResult.user.id) {
      return NextResponse.json(
        { error: 'Ви не можете відгукнутись на власну заявку' },
        { status: 403 }
      );
    }

    if (serviceRequest.executorId) {
      return NextResponse.json(
        { error: 'Виконавець вже обраний для цієї заявки' },
        { status: 403 }
      );
    }

    // Перевірити, чи користувач вже відгукнувся
    const existingResponse = await prisma.serviceRequestResponse.findUnique({
      where: {
        requestId_executorId: {
          requestId,
          executorId: authResult.user.id
        }
      }
    });

    if (existingResponse) {
      return NextResponse.json(
        { error: 'Ви вже відгукнулись на цю заявку' },
        { status: 400 }
      );
    }

    // Створити відгук
    const response = await prisma.serviceRequestResponse.create({
      data: {
        requestId,
        executorId: authResult.user.id,
        proposedPrice,
        comment,
        estimatedDays,
        status: 'pending'
      },
      include: {
        executor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profession: true,
            avgRating: true,
            totalReviews: true,
            avatarUrl: true
          }
        }
      }
    });

    // Оновити статус заявки на "viewed", якщо вона ще "new"
    if (serviceRequest.status === 'new') {
      await prisma.serviceRequest.update({
        where: { id: requestId },
        data: { status: 'viewed' }
      });
    }

    // Створити сповіщення для клієнта
    await prisma.notification.create({
      data: {
        userId: serviceRequest.clientId,
        type: 'request_response_new',
        title: 'Новий відгук на заявку',
        message: `${authResult.user.firstName} ${authResult.user.lastName} запропонував ціну ${proposedPrice} УЦМ на вашу заявку "${serviceRequest.title}"`,
        relatedEntityType: 'ServiceRequest',
        relatedEntityId: requestId
      }
    });

    return NextResponse.json({
      success: true,
      response
    });
  } catch (error) {
    console.error('[service-requests/respond] Помилка:', error);
    return NextResponse.json(
      { error: 'Помилка сервера' },
      { status: 500 }
    );
  }
}
