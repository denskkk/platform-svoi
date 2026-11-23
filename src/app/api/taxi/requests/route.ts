/**
 * POST /api/taxi/requests { city, fromAddress?, toAddress?, lat?, lng?, driverPref, kind: order|waitlist,
 *                           rideType?, carClass?, scheduledAt?, wishes?, passengers? }
 * Поки таксі не запущено в місті — запит зберігається як підписка на місто (ми повідомимо, коли запрацює).
 * GET — мої запити (історія поїздок).
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { isTaxiActiveIn } from '@/lib/taxi';

export const dynamic = 'force-dynamic';
const PREFS = ['any', 'ukrainian', 'slavic', 'local'];
const CLASSES = ['economy', 'comfort', 'business', 'minivan'];
const RIDES = ['airport', 'station', 'intercity', 'international', 'group', 'special'];

export async function GET(request: NextRequest) {
  const t = getApiT(request);
  const { user, error } = await requireAuth(request);
  if (error) return error;
  try {
    const requests = await prisma.taxiRequest.findMany({
      where: { userId: Number(user.userId) },
      orderBy: { id: 'desc' },
      take: 50,
      select: { id: true, kind: true, city: true, fromAddress: true, toAddress: true, rideType: true, carClass: true, scheduledAt: true, status: true, createdAt: true },
    });
    return NextResponse.json({ requests });
  } catch (e) {
    console.error('[taxi GET]', e);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

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
    const carClass = CLASSES.includes(b.carClass) ? b.carClass : null;
    const rideType = RIDES.includes(b.rideType) ? b.rideType : null;
    const wishes = str(b.wishes, 255);
    const passengers = Number.isInteger(b.passengers) && b.passengers >= 1 && b.passengers <= 50 ? b.passengers : null;
    let scheduledAt: Date | null = null;
    if (typeof b.scheduledAt === 'string' && b.scheduledAt) {
      const d = new Date(b.scheduledAt);
      const now = Date.now();
      // Попереднє замовлення: у майбутньому, не далі ніж на рік
      if (isNaN(d.getTime()) || d.getTime() < now - 5 * 60 * 1000 || d.getTime() > now + 366 * 24 * 3600 * 1000) {
        return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
      }
      scheduledAt = d;
    }
    const num = (v: any, lim: number) => (typeof v === 'number' && Math.abs(v) <= lim ? v : null);
    if (city.length < 2) return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
    const active = isTaxiActiveIn(city);
    const kind = active && b.kind === 'order' ? 'order' : 'waitlist';
    await prisma.taxiRequest.create({
      data: { userId, kind, city, fromAddress: fromAddress || null, toAddress: toAddress || null, lat: num(b.lat, 90), lng: num(b.lng, 180), driverPref, rideType, carClass, scheduledAt, wishes: wishes || null, passengers },
    });
    // дублюємо в «Пропозиції» для адміністратора
    const extra = [rideType && `ride=${rideType}`, carClass && `class=${carClass}`, scheduledAt && `at=${scheduledAt.toISOString()}`, passengers && `pax=${passengers}`, wishes && `wishes=${wishes}`].filter(Boolean).join(', ');
    await prisma.projectSuggestion.create({ data: { userId, projectSlug: 'taxi', kind: 'taxi', text: `${kind}: ${city}; ${fromAddress || '—'} → ${toAddress || '—'}; ${driverPref}${extra ? `; ${extra}` : ''}`.slice(0, 1000) } }).catch(() => undefined);
    return NextResponse.json({ success: true, active, kind }, { status: 201 });
  } catch (e) {
    console.error('[taxi POST]', e);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
