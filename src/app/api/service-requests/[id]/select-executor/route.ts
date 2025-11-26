import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  return withAuth(req, async (authReq: AuthenticatedRequest) => {
    try {
      const { params } = context;
      const requestId = parseInt(params.id);
      const { responseId } = await req.json();

      if (!responseId) {
        return NextResponse.json(
          { error: 'Response ID is required' },
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
          { error: 'Service request not found' },
          { status: 404 }
        );
      }

      // Только клиент может выбрать исполнителя
      const userId = authReq.user?.userId;
      if (!userId || serviceRequest.clientId !== userId) {
        return NextResponse.json(
          { error: 'Only the client can select an executor' },
          { status: 403 }
        );
      }

      // Заявка должна быть открыта (new или viewed)
      if (!['new', 'viewed'].includes(serviceRequest.status)) {
        return NextResponse.json(
          { error: 'Request is no longer open' },
          { status: 400 }
        );
      }

      const selectedResponse = serviceRequest.responses[0];
      if (!selectedResponse) {
        return NextResponse.json(
          { error: 'Response not found' },
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
            executorId: selectedResponse.executorId,
            finalPrice: selectedResponse.proposedPrice
          }
        }),
        // Создаем уведомление исполнителю
        prisma.notification.create({
          data: {
            userId: selectedResponse.executorId,
            type: 'REQUEST_ACCEPTED',
            title: 'Вас обрали виконавцем!',
            message: `${serviceRequest.client.firstName} обрав ваше пропозицію на суму ${selectedResponse.proposedPrice} УЦМ`,
            relatedEntityType: 'ServiceRequest',
            relatedEntityId: requestId
          }
        })
      ]);

      return NextResponse.json({
        success: true,
        message: 'Executor selected successfully'
      });

    } catch (error) {
      console.error('Error selecting executor:', error);
      return NextResponse.json(
        { error: 'Failed to select executor' },
        { status: 500 }
      );
    }
  });
}
