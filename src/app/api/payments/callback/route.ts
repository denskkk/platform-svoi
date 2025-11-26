import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hasUcmKindColumn } from '@/lib/ucm'
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
  const hasLedger = await (async () => {
    try {
      const r: any = await prisma.$queryRaw`SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='ucm_transactions') as exists`;
      if (Array.isArray(r) && r[0] && typeof r[0].exists === 'boolean') return r[0].exists
      if (r && typeof r.exists === 'boolean') return r.exists
    } catch (e) {
      return false
    }
    return false
  })()

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
        if (hasLedger) {
          const hasKind = await hasUcmKindColumn()
          await tx.ucmTransaction.create({
            data: {
              userId: payment.userId,
              ...(hasKind ? { kind: 'credit' as const } : {}),
              amount: payment.amount,
              reason: 'topup',
              relatedEntityType: 'payment',
              relatedEntityId: payment.id,
            }
          })
        }
      }
    })

    // WayForPay expects "accept" status response to stop retries
    return NextResponse.json({ orderReference: body.orderReference, status: 'accept' })
  } catch (e: any) {
    console.error('[payments/callback] error', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
