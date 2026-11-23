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
  // Відносні перенаправлення: за reverse-proxy request.url може містити внутрішній хост
  const rel = (to: string) => new NextResponse(null, { status: 302, headers: { Location: to } });
  const back = '/projects/shops';
  try {
    const auth = await requireAuth(request);
    if (auth.error) return rel(`/auth/login?returnUrl=/listings/${encodeURIComponent(params.id)}`);
    const userId = Number(auth.user.userId);
    if (!checkRateLimit(`go:${userId}`, { interval: 60 * 1000, maxRequests: 60 }).allowed) return rel(back);

    const id = parseId(params.id);
    const listing = id
      ? await prisma.listing.findFirst({ where: { id, projectSlug: 'shops', status: 'approved' }, select: { id: true, data: true } })
      : null;
    const url = listing && typeof (listing.data as any)?.shopUrl === 'string' ? ((listing.data as any).shopUrl as string) : '';
    if (!listing || !/^https?:\/\/[^\s]+$/i.test(url)) return rel(back);

    try {
      await prisma.outboundClick.create({ data: { listingId: listing.id, userId, source: 'storefront' } });
    } catch (e) {
      console.error('Outbound click log error:', e); // перехід не блокуємо
    }
    return NextResponse.redirect(url, 302);
  } catch (error) {
    console.error('Outbound redirect error:', error);
    return rel(back);
  }
}
