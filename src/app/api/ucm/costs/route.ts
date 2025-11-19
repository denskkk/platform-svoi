import { NextResponse } from 'next/server'
import { PAID_ACTION_COSTS } from '@/lib/ucm'

export async function GET() {
  try {
    // Return server canonical prices for paid actions
    return NextResponse.json({ costs: PAID_ACTION_COSTS })
  } catch (e: any) {
    console.error('[api/ucm/costs] error', e)
    return NextResponse.json({ error: 'Не вдалося отримати ціни' }, { status: 500 })
  }
}
