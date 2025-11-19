import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-middleware'
import { chargePaidAction, PAID_ACTION_COSTS, hasUcmTransactionsTable } from '@/lib/ucm'

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth(request)
  if (error) return error
  const userId = Number(user.userId)

  try {
    const body = await request.json()
    const {
      type, // 'partner' | 'job' | 'service' | ...
      title,
      description,
      city,
      region,
      categoryId,
      budgetFrom,
      budgetTo,
      deadlineAt,
      criteria,
      imageUrl,
    } = body || {}

    if (!type || !title || !description) {
      return NextResponse.json({ error: 'Заповніть обовʼязкові поля (type, title, description)' }, { status: 400 })
    }

    // Define pricing based on request type
    let actionType: keyof typeof PAID_ACTION_COSTS | null = null
    
    if (type === 'partner') {
      actionType = 'partner_search'
    } else if (type === 'job') {
      actionType = 'job_request'
    } else if (type === 'service') {
      actionType = 'service_request'
    } else if (type === 'employee') {
      actionType = 'employee_search'
    } else if (type === 'investor') {
      actionType = 'investor_search'
    }

    // If cost > 0: try to charge before creating
    let paid = false
    let paidAmount: number | null = null
    if (actionType) {
      try {
        const chargeResult = await chargePaidAction({ 
          userId, 
          actionType,
          description: `Заявка: ${title}`
        })
        paid = true
        paidAmount = chargeResult.amount
      } catch (e: any) {
        return NextResponse.json({
          error: e.message || 'Недостатньо уцмок на балансі',
          required: PAID_ACTION_COSTS[actionType],
        }, { status: 402 })
      }
    }

    // Create request (store paid metadata if any)
    const now = new Date()
    const defaultExpiry = new Date(now)
    defaultExpiry.setDate(defaultExpiry.getDate() + 14) // paid requests promoted for 14 days

    let created
    try {
      created = await prisma.request.create({
      data: {
        userId,
        type,
        title,
        description,
        city: city || null,
        region: region || null,
        categoryId: categoryId || null,
        budgetFrom: budgetFrom ?? null,
        budgetTo: budgetTo ?? null,
        deadlineAt: deadlineAt ? new Date(deadlineAt) : null,
        criteria: criteria ?? {},
        isPaid: paid,
        priceUcm: paidAmount ?? null,
        promoted: paid,
        expiresAt: paid ? defaultExpiry : null,
        metadata: imageUrl ? { imageUrl } : {},
      }
      })
    } catch (createErr: any) {
      console.error('[requests/create] failed to create request after charging:', createErr)
      // Attempt to refund the user if we already charged
      if (paid && paidAmount && paidAmount > 0) {
        try {
          const hasLedger = await hasUcmTransactionsTable()
          await prisma.$transaction(async (tx: typeof prisma) => {
            await tx.user.update({ where: { id: userId }, data: { balanceUcm: { increment: paidAmount } } })
            if (hasLedger) {
              await tx.ucmTransaction.create({
                data: {
                  userId,
                  kind: 'credit',
                  amount: paidAmount,
                  reason: 'refund_request_failure',
                  relatedEntityType: 'request',
                  relatedEntityId: null,
                }
              })
            }
          })
          console.log(`[requests/create] refunded ${paidAmount} to user ${userId} after failed request creation`)
        } catch (refundErr: any) {
          console.error('[requests/create] failed to refund user after request creation error:', refundErr)
        }
      }

      return NextResponse.json({ error: 'Помилка створення заявки' }, { status: 500 })
    }

    const cost = paidAmount || 0
    return NextResponse.json({ success: true, requestId: created.id, cost })
  } catch (e: any) {
    console.error('[requests/create] error', e)
    return NextResponse.json({ error: 'Помилка створення заявки' }, { status: 500 })
  }
}
