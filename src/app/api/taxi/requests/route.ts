/**
 * POST /api/taxi/requests { city, fromAddress?, toAddress?, lat?, lng?, driverPref: any|ukrainian|slavic|local, kind: order|waitlist }
 * Поки таксі не запущено в жодному місті — запит зберігається як підписка на місто (ми повідомимо, коли запрацює).
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { isTaxiActiveIn } from '@/lib/taxi';

export const dynamic = 'force-dynamic';
const PREFS = ['any', 'ukrainian', 'slavic', 'local'];

export async function POST(request: NextRequest) {
  const t = getApiT(request);
  const { user, error } = await requireAuth(request);
  if (error) return error;
  try {
    const userId = Number(user.userId);
    if (!checkRateLimit(`taxi:${userId}`, { interval: 60 * 60 * 1000, maxRequests: 20 }).allowed) {
      return NextResponse.json({ error: t('api.common.tooManyRequests') }, { status: 429 });
    }
    const b = await request.json().catch(() => ({}));
    const str = (v: any, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
    const city = str(b.city, 120);
    const fromAddress = str(b.fromAddress, 255);
    const toAddress = str(b.toAddress, 255);
    const driverPref = PREFS.includes(b.driverPref) ? b.driverPref : 'any';
    const num = (v: any, lim: number) => (typeof v === 'number' && Math.abs(v) <= lim ? v : null);
    if (city.length < 2) return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
    const active = isTaxiActiveIn(city);
    const kind = active && b.kind === 'order' ? 'order' : 'waitlist';
    await prisma.taxiRequest.create({ data: { userId, kind, city, fromAddress: fromAddress || null, toAddress: toAddress || null, lat: num(b.lat, 90), lng: num(b.lng, 180), driverPref } });
    // дублюємо в «Пропозиції» для адміністратора
    await prisma.projectSuggestion.create({ data: { userId, projectSlug: 'taxi', kind: 'taxi', text: `${kind}: ${city}; ${fromAddress || '—'} → ${toAddress || '—'}; ${driverPref}`.slice(0, 1000) } }).catch(() => undefined);
    return NextResponse.json({ success: true, active, kind }, { status: 201 });
  } catch (e) {
    console.error('[taxi POST]', e);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
