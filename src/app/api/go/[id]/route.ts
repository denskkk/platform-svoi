/**
 * GET /api/go/:listingId — перехід з вітрини інтернет-магазину на зовнішній сайт.
 * Фіксує перехід (джерело і користувач) і перенаправляє. Працює лише для схвалених вітрин напрямку «shops».
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { checkRateLimit } from '@/lib/rateLimit';
import { parseId } from '@/lib/feed';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const back = new URL('/projects/shops', request.url);
  try {
    const auth = await requireAuth(request);
    if (auth.error) return NextResponse.redirect(new URL(`/auth/login?returnUrl=/listings/${encodeURIComponent(params.id)}`, request.url));
    const userId = Number(auth.user.userId);
    if (!checkRateLimit(`go:${userId}`, { interval: 60 * 1000, maxRequests: 60 }).allowed) return NextResponse.redirect(back);

    const id = parseId(params.id);
    const listing = id
      ? await prisma.listing.findFirst({ where: { id, projectSlug: 'shops', status: 'approved' }, select: { id: true, data: true } })
      : null;
    const url = listing && typeof (listing.data as any)?.shopUrl === 'string' ? ((listing.data as any).shopUrl as string) : '';
    if (!listing || !/^https?:\/\/[^\s]+$/i.test(url)) return NextResponse.redirect(back);

    try {
      await prisma.outboundClick.create({ data: { listingId: listing.id, userId, source: 'storefront' } });
    } catch (e) {
      console.error('Outbound click log error:', e); // перехід не блокуємо
    }
    return NextResponse.redirect(url, 302);
  } catch (error) {
    console.error('Outbound redirect error:', error);
    return NextResponse.redirect(back);
  }
}
