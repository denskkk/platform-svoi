/**
 * POST /api/paid-actions/charge
 * Списання коштів за платну дію
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-middleware'
import { chargePaidAction, PAID_ACTION_COSTS, PAID_ACTION_DESCRIPTIONS } from '@/lib/ucm'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth(request)
  if (error) return error

  const userId = Number(user.userId)

  try {

    const body = await request.json()
    const { actionType, relatedEntityType, relatedEntityId, description } = body

    // Валідація типу дії
    if (!actionType || !(actionType in PAID_ACTION_COSTS)) {
      return NextResponse.json(
        { error: 'Невірний тип платної дії' },
        { status: 400 }
      )
    }

    // Перевіряємо баланс користувача
    const userBalance = await prisma.user.findUnique({
      where: { id: userId },
      select: { balanceUcm: true }
    })

    if (!userBalance) {
      return NextResponse.json(
        { error: 'Користувача не знайдено' },
        { status: 404 }
      )
    }

    const cost = PAID_ACTION_COSTS[actionType as keyof typeof PAID_ACTION_COSTS]

    if (userBalance.balanceUcm < cost) {
      return NextResponse.json(
        {
          error: 'Недостатньо уцмок на балансі',
          required: cost,
          current: Number(userBalance.balanceUcm),
          missing: cost - Number(userBalance.balanceUcm)
        },
        { status: 402 } // Payment Required
      )
    }

    // Списуємо кошти
    const result = await chargePaidAction({
      userId: userId,
      actionType: actionType as keyof typeof PAID_ACTION_COSTS,
      relatedEntityType,
      relatedEntityId,
      description
    })

    // Отримуємо оновлений баланс
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { balanceUcm: true }
    })

    return NextResponse.json({
      success: true,
      message: 'Оплата успішна',
      charged: result.amount,
      newBalance: Number(updatedUser?.balanceUcm || 0),
      actionDescription: PAID_ACTION_DESCRIPTIONS[actionType as keyof typeof PAID_ACTION_DESCRIPTIONS]
    })

  } catch (error: any) {
    console.error('[paid-actions/charge] Error:', error)
    
    if (error.message === 'Недостатньо уцмок на балансі') {
      return NextResponse.json(
        { error: error.message },
        { status: 402 }
      )
    }

    return NextResponse.json(
      { error: 'Помилка обробки платежу' },
      { status: 500 }
    )
  }
}
