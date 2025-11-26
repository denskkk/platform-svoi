import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware'

/**
 * POST /api/ucm/transfer
 * Переказ УЦМ від одного користувача іншому
 */
async function handler(request: AuthenticatedRequest) {
  try {
    if (!request.user?.userId) {
      return NextResponse.json(
        { error: 'Необхідна авторизація' },
        { status: 401 }
      )
    }

    const senderId = request.user.userId
    const body = await request.json()
    const { recipientId, amount, message } = body

    // Валідація
    if (!recipientId) {
      return NextResponse.json(
        { error: 'Вкажіть отримувача' },
        { status: 400 }
      )
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Сума повинна бути більше 0' },
        { status: 400 }
      )
    }

    // Не можна переказувати самому собі
    if (senderId === recipientId) {
      return NextResponse.json(
        { error: 'Не можна переказувати уцмки самому собі' },
        { status: 400 }
      )
    }

    // Перевірка існування отримувача
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true, firstName: true, lastName: true, email: true }
    })

    if (!recipient) {
      return NextResponse.json(
        { error: 'Отримувача не знайдено' },
        { status: 404 }
      )
    }

    // Отримати баланс відправника
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { 
        id: true, 
        balanceUcm: true, 
        firstName: true, 
        lastName: true 
      }
    })

    if (!sender) {
      return NextResponse.json(
        { error: 'Відправника не знайдено' },
        { status: 404 }
      )
    }

    const senderBalance = Number(sender.balanceUcm || 0)

    // Перевірка достатності коштів
    if (senderBalance < amount) {
      return NextResponse.json(
        { 
          error: 'Недостатньо коштів',
          current: senderBalance,
          required: amount,
          missing: amount - senderBalance
        },
        { status: 400 }
      )
    }

    // Виконати переказ в транзакції
    const result = await prisma.$transaction(async (tx: typeof prisma) => {
      // Зняти кошти з відправника
      const updatedSender = await tx.user.update({
        where: { id: senderId },
        data: { balanceUcm: { decrement: amount } },
        select: { balanceUcm: true }
      })

      // Додати кошти отримувачу
      const updatedRecipient = await tx.user.update({
        where: { id: recipientId },
        data: { balanceUcm: { increment: amount } },
        select: { balanceUcm: true }
      })

      // Записати транзакції в історію (якщо таблиця існує)
      const hasUcmTransactions = await tx.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema='public' AND table_name='ucm_transactions'
        ) as exists
      `

      if (hasUcmTransactions[0]?.exists) {
        // Транзакція відправника (списання)
        await tx.ucmTransaction.create({
          data: {
            userId: senderId,
            amount: -amount,
            reason: 'transfer_sent',
            description: message 
              ? `Переказ для ${recipient.firstName} ${recipient.lastName}: ${message}`
              : `Переказ для ${recipient.firstName} ${recipient.lastName}`,
            meta: {
              recipientId,
              recipientName: `${recipient.firstName} ${recipient.lastName}`,
              type: 'transfer_sent'
            }
          }
        })

        // Транзакція отримувача (зарахування)
        await tx.ucmTransaction.create({
          data: {
            userId: recipientId,
            amount: amount,
            reason: 'transfer_received',
            description: message
              ? `Переказ від ${sender.firstName} ${sender.lastName}: ${message}`
              : `Переказ від ${sender.firstName} ${sender.lastName}`,
            meta: {
              senderId,
              senderName: `${sender.firstName} ${sender.lastName}`,
              type: 'transfer_received'
            }
          }
        })
      }

      return {
        senderBalance: Number(updatedSender.balanceUcm),
        recipientBalance: Number(updatedRecipient.balanceUcm)
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Переказ виконано успішно',
      transfer: {
        amount,
        sender: {
          id: senderId,
          name: `${sender.firstName} ${sender.lastName}`,
          newBalance: result.senderBalance
        },
        recipient: {
          id: recipientId,
          name: `${recipient.firstName} ${recipient.lastName}`,
          newBalance: result.recipientBalance
        }
      }
    })
  } catch (error) {
    console.error('Error transferring UCM:', error)
    return NextResponse.json(
      { error: 'Помилка при переказі коштів' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return withAuth(request, handler)
}
