import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { hasUcmTransactionsTable, hasUcmKindColumn } from '@/lib/ucm';

// POST /api/service-requests/[id]/pay - Оплатити заявку в УЦМ
async function handler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = (request as any).user?.userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Необхідна авторизація' },
        { status: 401 }
      );
    }

    const requestId = parseInt(params.id);

    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: {
        executor: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!serviceRequest) {
      return NextResponse.json(
        { error: 'Заявку не знайдено' },
        { status: 404 }
      );
    }

    // Перевірка прав
    if (serviceRequest.clientId !== userId) {
      return NextResponse.json(
        { error: 'Тільки автор заявки може її оплатити' },
        { status: 403 }
      );
    }

    // Перевірка статусу
    if (serviceRequest.status !== 'completed') {
      return NextResponse.json(
        { error: 'Заявка має бути виконана перед оплатою' },
        { status: 400 }
      );
    }

    if (serviceRequest.isPaid) {
      return NextResponse.json(
        { error: 'Заявка вже оплачена' },
        { status: 400 }
      );
    }

    if (!serviceRequest.executorId || !serviceRequest.agreedPrice) {
      return NextResponse.json(
        { error: 'Не вказано виконавця або ціну' },
        { status: 400 }
      );
    }

    const amount = Number(serviceRequest.agreedPrice);

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Невірна сума оплати' },
        { status: 400 }
      );
    }

    // Перевірка балансу клієнта
    const client = await prisma.user.findUnique({
      where: { id: userId },
      select: { balanceUcm: true }
    });

    if (!client || Number(client.balanceUcm) < amount) {
      return NextResponse.json(
        { error: 'Недостатньо УЦМок на балансі' },
        { status: 400 }
      );
    }

    // Виконати транзакцію
    await prisma.$transaction(async (tx: any) => {
      // Списати з клієнта
      await tx.user.update({
        where: { id: userId },
        data: {
          balanceUcm: {
            decrement: new Decimal(amount)
          }
        }
      });

      // Нарахувати виконавцю
      await tx.user.update({
        where: { id: serviceRequest.executorId! },
        data: {
          balanceUcm: {
            increment: new Decimal(amount)
          }
        }
      });

      // Записати в ledger
      const hasLedger = await hasUcmTransactionsTable();
      const hasKind = await hasUcmKindColumn();

      if (hasLedger) {
        // Списання клієнта
        await (tx as any).ucmTransaction.create({
          data: {
            userId,
            amount: new Decimal(amount),
            ...(hasKind && { kind: 'debit' }),
            reason: 'service_payment',
            relatedEntityType: 'ServiceRequest',
            relatedEntityId: requestId,
            meta: {
              executorId: serviceRequest.executorId,
              requestTitle: serviceRequest.title
            },
            description: `Оплата за послугу: ${serviceRequest.title}`
          }
        });

        // Нарахування виконавцю
        await (tx as any).ucmTransaction.create({
          data: {
            userId: serviceRequest.executorId,
            amount: new Decimal(amount),
            ...(hasKind && { kind: 'credit' }),
            reason: 'service_earning',
            relatedEntityType: 'ServiceRequest',
            relatedEntityId: requestId,
            meta: {
              clientId: userId,
              requestTitle: serviceRequest.title
            },
            description: `Оплата від клієнта за: ${serviceRequest.title}`
          }
        });
      }

      // Оновити статус заявки
      await tx.serviceRequest.update({
        where: { id: requestId },
        data: {
          isPaid: true,
          paidAt: new Date(),
          status: 'paid',
          priceUcm: new Decimal(amount)
        }
      });

      // Сповістити виконавця
      await tx.notification.create({
        data: {
          userId: serviceRequest.executorId!,
          type: 'service_payment_received',
          title: 'Отримано оплату',
          message: `Клієнт оплатив ${amount} УЦМок за заявку "${serviceRequest.title}"`,
          relatedEntityType: 'ServiceRequest',
          relatedEntityId: requestId
        }
      });
    });

    return NextResponse.json({
      success: true,
      message: `Оплачено ${amount} УЦМок`,
      request: {
        id: requestId,
        isPaid: true,
        paidAt: new Date(),
        priceUcm: amount
      }
    });

  } catch (error: any) {
    console.error('[service-requests/pay] Error:', error);
    return NextResponse.json(
      { error: 'Помилка оплати', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  return withAuth(request, (req) => handler(req, context));
}
