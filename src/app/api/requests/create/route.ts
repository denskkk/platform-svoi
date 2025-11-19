import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-middleware'
import { chargePaidAction, PAID_ACTION_COSTS } from '@/lib/ucm'

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

    const created = await prisma.request.create({
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
        metadata: {},
      }
    })

    const cost = paidAmount || 0
    return NextResponse.json({ success: true, requestId: created.id, cost })
  } catch (e: any) {
    console.error('[requests/create] error', e)
    return NextResponse.json({ error: 'Помилка створення заявки' }, { status: 500 })
  }
}
