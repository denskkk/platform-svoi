/**
 * GET /api/paid-actions/info
 * Отримання інформації про платні дії та ціни
 */

import { NextResponse } from 'next/server'
import { PAID_ACTION_COSTS, PAID_ACTION_DESCRIPTIONS } from '@/lib/ucm'

export async function GET() {
  try {
    const actions = Object.keys(PAID_ACTION_COSTS).map(key => ({
      type: key,
      cost: PAID_ACTION_COSTS[key as keyof typeof PAID_ACTION_COSTS],
      description: PAID_ACTION_DESCRIPTIONS[key as keyof typeof PAID_ACTION_DESCRIPTIONS]
    }))

    return NextResponse.json({
      actions,
      total: actions.length
    })
  } catch (error) {
    console.error('[paid-actions/info] Error:', error)
    return NextResponse.json(
      { error: 'Помилка отримання інформації' },
      { status: 500 }
    )
  }
}
