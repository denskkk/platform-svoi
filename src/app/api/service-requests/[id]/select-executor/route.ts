import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { getApiT } from '@/i18n/server';

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const t = getApiT(req);
  return withAuth(req, async (authReq: AuthenticatedRequest) => {
    try {
      const { params } = context;
      const requestId = parseInt(params.id);
      const { responseId } = await req.json();

      if (!responseId) {
        return NextResponse.json(
          { error: t('api.serviceRequests.selectExecutor.responseIdRequired') },
          { status: 400 }
        );
      }

      // Проверяем заявку и отклик
      const serviceRequest = await prisma.serviceRequest.findUnique({
        where: { id: requestId },
        include: {
          client: true,
          responses: {
            where: { id: responseId },
            include: { executor: true }
          }
        }
      });

      if (!serviceRequest) {
        return NextResponse.json(
          { error: t('api.serviceRequests.notFound') },
          { status: 404 }
        );
      }

      // Только клиент может выбрать исполнителя
      const userId = authReq.user?.userId;
      if (!userId || serviceRequest.clientId !== userId) {
        return NextResponse.json(
          { error: t('api.serviceRequests.selectExecutor.clientOnly') },
          { status: 403 }
        );
      }

      // Заявка должна быть открыта (new или viewed)
      if (!['new', 'viewed'].includes(serviceRequest.status)) {
        return NextResponse.json(
          { error: t('api.serviceRequests.selectExecutor.notOpen') },
          { status: 400 }
        );
      }

      const selectedResponse = serviceRequest.responses[0];
      if (!selectedResponse) {
        return NextResponse.json(
          { error: t('api.serviceRequests.selectExecutor.responseNotFound') },
          { status: 404 }
        );
      }

      // Обновляем заявку и отклик в транзакции
      await prisma.$transaction([
        // Помечаем выбранный отклик
        prisma.serviceRequestResponse.update({
          where: { id: responseId },
          data: { 
            status: 'accepted',
            isSelected: true
          }
        }),
        // Отклоняем остальные отклики
        prisma.serviceRequestResponse.updateMany({
          where: {
            requestId,
            id: { not: responseId }
          },
          data: { status: 'rejected' }
        }),
        // Обновляем заявку
        prisma.serviceRequest.update({
          where: { id: requestId },
          data: {
            status: 'in_progress',
            executor: {
              connect: { id: selectedResponse.executorId }
            },
            agreedPrice: selectedResponse.proposedPrice
          }
        }),
        // Создаем уведомление исполнителю
        prisma.notification.create({
          data: {
            userId: selectedResponse.executorId,
            type: 'REQUEST_ACCEPTED',
            title: 'Вас обрали виконавцем!', // i18n-ignore (stored notification)
            message: `${serviceRequest.client.firstName} обрав ваше пропозицію на суму ${selectedResponse.proposedPrice} грн`, // i18n-ignore
            relatedEntityType: 'ServiceRequest',
            relatedEntityId: requestId
          }
        })
      ]);

      return NextResponse.json({
        success: true,
        message: t('api.serviceRequests.selectExecutor.success')
      });

    } catch (error) {
      console.error('Error selecting executor:', error);
      return NextResponse.json(
        { error: t('api.serviceRequests.selectExecutor.failed') },
        { status: 500 }
      );
    }
  });
}
