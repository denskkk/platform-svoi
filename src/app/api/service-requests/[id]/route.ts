import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { getApiT } from '@/i18n/server';

// GET /api/service-requests/[id] - Отримати деталі заявки
async function getHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const t = getApiT(request);
  try {
    const userId = (request as any).user?.userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: t('api.common.authRequired') },
        { status: 401 }
      );
    }

    const requestId = parseInt(params.id);

    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            city: true,
            avatarUrl: true,
            phone: true,
            avgRating: true,
            totalReviews: true
          }
        },
        executor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            city: true,
            avatarUrl: true,
            phone: true,
            avgRating: true,
            totalReviews: true,
            profession: true
          }
        },
        service: {
          select: {
            id: true,
            title: true,
            description: true,
            priceFrom: true,
            priceTo: true,
            category: {
              select: {
                name: true,
                emoji: true
              }
            }
          }
        },
        reviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        responses: {
          include: {
            executor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profession: true,
                avatarUrl: true,
                avgRating: true,
                totalReviews: true,
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (!serviceRequest) {
      return NextResponse.json(
        { error: t('api.serviceRequests.notFound') },
        { status: 404 }
      );
    }

    // Збільшити лічильник переглядів, якщо це не автор заявки
    if (userId !== serviceRequest.clientId) {
      await prisma.serviceRequest.update({
        where: { id: requestId },
        data: {
          viewsCount: { increment: 1 },
          // Якщо статус "new", змінити на "viewed"
          ...(serviceRequest.status === 'new' && { status: 'viewed' })
        }
      });
    }

    return NextResponse.json({ request: serviceRequest });

  } catch (error: any) {
    console.error('[service-requests/get] Error:', error);
    return NextResponse.json(
      { error: t('api.serviceRequests.getError'), details: process.env.NODE_ENV === 'production' ? undefined : error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/service-requests/[id] - Оновити статус або деталі заявки
async function updateHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const t = getApiT(request);
  try {
    const userId = (request as any).user?.userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: t('api.common.authRequired') },
        { status: 401 }
      );
    }

    const requestId = parseInt(params.id);
    const body = await request.json();

    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: requestId }
    });

    if (!serviceRequest) {
      return NextResponse.json(
        { error: t('api.serviceRequests.notFound') },
        { status: 404 }
      );
    }

    const isClient = serviceRequest.clientId === userId;
    const isExecutor = serviceRequest.executorId === userId;

    // Визначити, що можна оновлювати
    const updateData: any = {};

    // Клієнт може редагувати свою заявку, якщо вона ще не прийнята
    if (isClient && !['in_progress', 'completed', 'paid'].includes(serviceRequest.status)) {
      if (body.title) updateData.title = body.title;
      if (body.description) updateData.description = body.description;
      if (body.category) updateData.category = body.category;
      if (body.city) updateData.city = body.city;
      if (body.address) updateData.address = body.address;
      if (body.photos) updateData.photos = body.photos;
      if (body.budgetFrom !== undefined) updateData.budgetFrom = body.budgetFrom ? new Decimal(body.budgetFrom) : null;
      if (body.budgetTo !== undefined) updateData.budgetTo = body.budgetTo ? new Decimal(body.budgetTo) : null;
      if (body.desiredDate !== undefined) updateData.desiredDate = body.desiredDate ? new Date(body.desiredDate) : null;
      if (body.deadline !== undefined) updateData.deadline = body.deadline ? new Date(body.deadline) : null;
      if (body.priority) updateData.priority = body.priority;
    }

    // Клієнт може скасувати заявку
    if (isClient && body.action === 'cancel') {
      updateData.status = 'cancelled';
    }

    // Виконавець може прийняти заявку (тільки той, кому вона адресована)
    if (body.action === 'accept') {
      // Перевірка: заявка повинна бути адресована цьому користувачу
      if (serviceRequest.executorId !== userId) {
        return NextResponse.json(
          { error: t('api.serviceRequests.notAddressedToYou') },
          { status: 403 }
        );
      }
      
      if (!body.agreedPrice) {
        return NextResponse.json(
          { error: t('api.serviceRequests.priceRequired') },
          { status: 400 }
        );
      }
      
      updateData.status = 'accepted';
      updateData.acceptedAt = new Date();
      updateData.agreedPrice = new Decimal(body.agreedPrice);
      
      // Створити повідомлення клієнту
      await prisma.notification.create({
        data: {
          userId: serviceRequest.clientId,
          type: 'service_request_accepted',
          title: 'Заявку прийнято', // i18n-ignore
          message: `Виконавець прийняв вашу заявку "${serviceRequest.title}" за ціною ${body.agreedPrice} грн`, // i18n-ignore
          relatedEntityType: 'ServiceRequest',
          relatedEntityId: requestId
        }
      });
    }

    // Виконавець може відхилити заявку
    if (isExecutor && body.action === 'reject') {
      updateData.executorId = null;
      updateData.status = 'rejected';
    }

    // Виконавець може перевести в процес
    if (isExecutor && body.action === 'start') {
      updateData.status = 'in_progress';
    }

    // Виконавець може завершити роботу
    if (isExecutor && body.action === 'complete') {
      updateData.status = 'completed';
      updateData.completedAt = new Date();
      
      // Створити повідомлення клієнту
      await prisma.notification.create({
        data: {
          userId: serviceRequest.clientId,
          type: 'service_request_completed',
          title: 'Заявку виконано', // i18n-ignore
          message: `Виконавець завершив роботу за заявкою "${serviceRequest.title}". Будь ласка, оплатіть та залиште відгук.`, // i18n-ignore
          relatedEntityType: 'ServiceRequest',
          relatedEntityId: requestId
        }
      });
    }

    // Узгоджена ціна
    if ((isClient || isExecutor) && body.agreedPrice !== undefined) {
      updateData.agreedPrice = body.agreedPrice ? new Decimal(body.agreedPrice) : null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: t('api.serviceRequests.nothingToUpdate') },
        { status: 400 }
      );
    }

    const updated = await prisma.serviceRequest.update({
      where: { id: requestId },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true
          }
        },
        executor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      request: updated
    });

  } catch (error: any) {
    console.error('[service-requests/update] Error:', error);
    return NextResponse.json(
      { error: t('api.serviceRequests.updateError'), details: process.env.NODE_ENV === 'production' ? undefined : error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/service-requests/[id] - Видалити заявку
async function deleteHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const t = getApiT(request);
  try {
    const userId = (request as any).user?.userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: t('api.common.authRequired') },
        { status: 401 }
      );
    }

    const requestId = parseInt(params.id);

    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: requestId }
    });

    if (!serviceRequest) {
      return NextResponse.json(
        { error: t('api.serviceRequests.notFound') },
        { status: 404 }
      );
    }

    // Тільки автор може видалити заявку і тільки якщо вона не в процесі
    if (serviceRequest.clientId !== userId) {
      return NextResponse.json(
        { error: t('api.common.insufficientRights') },
        { status: 403 }
      );
    }

    if (['in_progress', 'completed', 'paid'].includes(serviceRequest.status)) {
      return NextResponse.json(
        { error: t('api.serviceRequests.cannotDeleteStatus') },
        { status: 400 }
      );
    }

    await prisma.serviceRequest.delete({
      where: { id: requestId }
    });

    return NextResponse.json({
      success: true,
      message: t('api.serviceRequests.deleted')
    });

  } catch (error: any) {
    console.error('[service-requests/delete] Error:', error);
    return NextResponse.json(
      { error: t('api.serviceRequests.deleteError'), details: process.env.NODE_ENV === 'production' ? undefined : error.message },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  return withAuth(request, (req) => getHandler(req, context));
}

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  return withAuth(request, (req) => updateHandler(req, context));
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  return withAuth(request, (req) => deleteHandler(req, context));
}
