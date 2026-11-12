/**
 * GET /api/search?q=<text>&type=all|people|business|listings
 * Єдиний пошук по людях, бізнесах і оголошеннях. Лише для авторизованих.
 * Повертає тільки публічні поля; заблоковані (в обидва боки) та неактивні акаунти не показуються.
 * type=all — по 5 результатів на групу; конкретний type — до 20.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { getBlockedIds } from '@/lib/blocks';
import { listingInclude, loadSavedIds, publicWhere, serializeListing } from '@/lib/listings';

export const dynamic = 'force-dynamic';

const TYPES = ['all', 'people', 'business', 'listings'] as const;
type SearchType = (typeof TYPES)[number];

export async function GET(request: NextRequest) {
  const t = getApiT(request);
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);

    const limitCheck = checkRateLimit(`search:${userId}`, { interval: 60 * 1000, maxRequests: 60 });
    if (!limitCheck.allowed) return NextResponse.json({ error: t('api.common.tooManyRequestsShort') }, { status: 429 });

    const params = new URL(request.url).searchParams;
    const q = (params.get('q') || '').trim().slice(0, 80);
    const rawType = params.get('type') || 'all';
    const type: SearchType = (TYPES as readonly string[]).includes(rawType) ? (rawType as SearchType) : 'all';
    if (q.length < 2) return NextResponse.json({ q, people: [], business: [], listings: [] });

    const take = type === 'all' ? 5 : 20;
    const blocked = await getBlockedIds(userId);
    const excluded = [...blocked, userId];
    const contains = (field: string) => ({ [field]: { contains: q, mode: 'insensitive' as const } });

    const wantPeople = type === 'all' || type === 'people';
    const wantBusiness = type === 'all' || type === 'business';
    const wantListings = type === 'all' || type === 'listings';

    const [people, business, listings] = await Promise.all([
      wantPeople
        ? prisma.user.findMany({
            where: {
              isActive: true,
              id: { notIn: excluded },
              accountType: { not: 'business' },
              role: { in: ['user', 'business'] },
              OR: [contains('firstName'), contains('lastName'), contains('city'), contains('profession')],
            },
            select: { id: true, firstName: true, lastName: true, avatarUrl: true, city: true, profession: true, isVerified: true },
            orderBy: [{ isVerified: 'desc' }, { id: 'desc' }],
            take,
          })
        : [],
      wantBusiness
        ? prisma.businessInfo.findMany({
            where: {
              user: { isActive: true, id: { notIn: excluded } },
              OR: [contains('companyName'), contains('businessType'), contains('businessCategory'), contains('description'), contains('city')],
            },
            select: {
              userId: true, companyName: true, logoUrl: true, city: true, businessType: true,
              user: { select: { isVerified: true } },
            },
            orderBy: { id: 'desc' },
            take,
          })
        : [],
      wantListings
        ? prisma.listing.findMany({
            where: {
              ...publicWhere(null),
              ownerId: { notIn: excluded },
              OR: [contains('title'), contains('description'), contains('city')],
            },
            orderBy: { id: 'desc' },
            take,
            include: listingInclude,
          })
        : [],
    ]);

    const saved = listings.length ? await loadSavedIds(prisma, userId, listings.map((l: any) => l.id)) : new Set<number>();

    return NextResponse.json({
      q,
      people: people.map((u: any) => ({
        id: u.id, name: `${u.firstName} ${u.lastName}`.trim(), avatarUrl: u.avatarUrl, city: u.city, profession: u.profession, isVerified: u.isVerified,
      })),
      business: business.map((b: any) => ({
        id: b.userId, name: b.companyName, avatarUrl: b.logoUrl, city: b.city, businessType: b.businessType, isVerified: b.user.isVerified,
      })),
      listings: listings.map((l: any) => serializeListing(l as any, userId, saved)),
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
