import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-middleware'
import { UCM_COSTS, chargeForAction } from '@/lib/ucm'

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

    // Define pricing: currently charge only for partner searches
    const cost = String(type) === 'partner' ? UCM_COSTS.partnerRequest : 0

    // If cost > 0: try to charge before creating
    if (cost > 0) {
      try {
        await chargeForAction({ userId, amount: cost, reason: 'request_partner' })
      } catch (e: any) {
        if (e && e.message === 'INSUFFICIENT_UCM') {
          return NextResponse.json({
            error: 'Недостатньо уцмок на балансі. Поповніть баланс, щоб створити заявку.',
            required: cost,
          }, { status: 402 })
        }
        throw e
      }
    }

    // Create request
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
      }
    })

    return NextResponse.json({ success: true, requestId: created.id, cost })
  } catch (e: any) {
    console.error('[requests/create] error', e)
    return NextResponse.json({ error: 'Помилка створення заявки' }, { status: 500 })
  }
}
