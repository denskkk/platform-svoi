import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-middleware'
import { prisma } from '@/lib/prisma'
import { buildWayForPayFormPayload, makeOrderReference, WAYFORPAY_ENDPOINT } from '@/lib/wayforpay'

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth(request)
  if (error) return error

  try {
    const body = await request.json().catch(() => ({}))
    const amountRaw = body?.amount
    const description: string | undefined = body?.description || 'Поповнення балансу (уцмка)'

    const amount = Number(amountRaw)
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Невірна сума платежу' }, { status: 400 })
    }

    const orderReference = makeOrderReference('SVIY')

    // Створюємо запис платежу
    const payment = await prisma.payment.create({
      data: {
        userId: Number(user.userId),
        orderReference,
        amount,
        currency: process.env.WAYFORPAY_CURRENCY || 'UAH',
        description,
        status: 'new',
        provider: 'wayforpay',
      }
    })

    const payload = buildWayForPayFormPayload({ orderReference, amount, description })

    // Збережемо сирі дані запиту (payload) для аудиту
    await prisma.payment.update({
      where: { id: payment.id },
      data: { rawRequest: payload }
    })

    return NextResponse.json({
      payUrl: WAYFORPAY_ENDPOINT,
      payload,
      orderReference,
      paymentId: payment.id,
    })
  } catch (e: any) {
    console.error('[payments/create] error', e)
    return NextResponse.json({ error: 'Помилка створення платежу' }, { status: 500 })
  }
}
