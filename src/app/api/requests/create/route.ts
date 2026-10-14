import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-middleware'

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
        metadata: imageUrl ? { imageUrl } : {},
      }
    })

    return NextResponse.json({ success: true, requestId: created.id })
  } catch (e: any) {
    console.error('[requests/create] error', e)
    return NextResponse.json({ error: 'Помилка створення заявки' }, { status: 500 })
  }
}
