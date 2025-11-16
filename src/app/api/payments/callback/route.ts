import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyCallbackSignature, CallbackPayload } from '@/lib/wayforpay'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<CallbackPayload>
    if (!body || !body.orderReference || !body.merchantSignature) {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 })
    }

    const ok = verifyCallbackSignature(body as CallbackPayload)
    if (!ok) {
      console.warn('[payments/callback] invalid signature for', body.orderReference)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const payment = await prisma.payment.findUnique({
      where: { orderReference: body.orderReference as string }
    })

    if (!payment) {
      console.warn('[payments/callback] payment not found', body.orderReference)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const statusMap: Record<string, string> = {
      Approved: 'approved',
      Declined: 'declined',
      Expired: 'expired',
      InProcessing: 'pending',
      Pending: 'pending',
    }
    const newStatus = statusMap[(body.transactionStatus || '').toString()] || 'pending'

    // Транзакція: оновити платіж, за потреби зарахувати баланс
  await prisma.$transaction(async (tx: typeof prisma) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: newStatus,
          rawResponse: body as any,
        }
      })
      if (newStatus === 'approved' && payment.status !== 'approved') {
        await tx.user.update({
          where: { id: payment.userId },
          data: { balanceUcm: { increment: payment.amount } }
        })
      }
    })

    // WayForPay expects "accept" status response to stop retries
    return NextResponse.json({ orderReference: body.orderReference, status: 'accept' })
  } catch (e: any) {
    console.error('[payments/callback] error', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
