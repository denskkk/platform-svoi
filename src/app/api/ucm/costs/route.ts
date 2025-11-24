import { NextResponse } from 'next/server'
import { PAID_ACTION_COSTS, PROMO_ACTION_EXTRAS } from '@/lib/ucm'

export async function GET() {
  try {
    // Return server canonical prices for paid actions and promo extras
    return NextResponse.json({ costs: PAID_ACTION_COSTS, promoExtras: PROMO_ACTION_EXTRAS })
  } catch (e: any) {
    console.error('[api/ucm/costs] error', e)
    return NextResponse.json({ error: 'Не вдалося отримати ціни' }, { status: 500 })
  }
}
