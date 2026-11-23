/** GET/PUT /api/settings — налаштування приватності, показу та таргетингу поточного користувача. */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { getSettings, saveSettings } from '@/lib/userSettings';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const t = getApiT(request);
  const { user, error } = await requireAuth(request);
  if (error) return error;
  try {
    return NextResponse.json({ settings: await getSettings(Number(user.userId)) });
  } catch (e) {
    console.error('[settings GET]', e);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const t = getApiT(request);
  const { user, error } = await requireAuth(request);
  if (error) return error;
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
    return NextResponse.json({ settings: await saveSettings(Number(user.userId), body) });
  } catch (e) {
    console.error('[settings PUT]', e);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
