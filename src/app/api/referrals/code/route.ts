import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-middleware'
import { ensureUserReferralCode } from '@/lib/ucm'

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth(request)
  if (error) return error

  const userId = Number(user.userId)
  try {
    const code = await ensureUserReferralCode(userId)
    const origin = request.headers.get('origin') || ''
    const link = origin ? `${origin}/r/${code}` : `/r/${code}`
    return NextResponse.json({ code, link })
  } catch (e: any) {
    console.error('[referrals/code] error', e)
    return NextResponse.json({ error: 'Не вдалося отримати реферальний код' }, { status: 500 })
  }
}
