/**
 * GET /api/search?q=<text>&type=all|people|business|listings|clubs&city=<місто>&project=<slug напряму>
 * Єдиний пошук по людях, бізнесах і оголошеннях. Лише для авторизованих.
 * Повертає тільки публічні поля; заблоковані (в обидва боки) та неактивні акаунти не показуються.
 * type=all — по 5 результатів на групу; конкретний type — до 20.
 */

import { getPrivateAuthorIdsHiddenFrom } from '@/lib/userSettings';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { getBlockedIds } from '@/lib/blocks';
import { listingInclude, loadSavedIds, publicWhere, serializeListing } from '@/lib/listings';

export const dynamic = 'force-dynamic';

const TYPES = ['all', 'people', 'business', 'listings', 'clubs', 'posts'] as const;
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
    const city = (params.get('city') || '').trim().slice(0, 60);
    const project = /^[a-z0-9-]{1,60}$/.test(params.get('project') || '') ? (params.get('project') as string) : '';
    // Без тексту пошук можливий, якщо задано фільтр (місто або напрям)
    if (q.length < 2 && !city && !project) return NextResponse.json({ q, people: [], business: [], listings: [], clubs: [], posts: [] });
    // Пошук по словах: кожне слово має зустрітися в одному з полів (порядок і відмінок не важливі).
    // Закінчення відсікаємо («квартиру» → «кварти»), щоб знаходило «квартира», «квартири».
    const stem = (w: string) => (w.length >= 7 ? w.slice(0, -2) : w.length >= 5 ? w.slice(0, -1) : w);
    const tokens = Array.from(new Set(q.toLowerCase().split(/[\s,.;:!?]+/).filter((w) => w.length >= 2).map(stem)));
    const words = tokens.length ? tokens : q.length >= 2 ? [q] : [];
    const contains = (field: string, value: string) => ({ [field]: { contains: value, mode: 'insensitive' as const } });
    const textOr = (fields: string[]) => (words.length ? { AND: words.map((w) => ({ OR: fields.map((f) => contains(f, w)) })) } : {});
    const cityIs = (field = 'city') => (city ? { [field]: { contains: city, mode: 'insensitive' as const } } : {});

    const take = type === 'all' ? 5 : 20;
    const blocked = await getBlockedIds(userId);
    const excluded = [...blocked, userId];
    const privateHidden = await getPrivateAuthorIdsHiddenFrom(userId);

    const wantPeople = (type === 'all' || type === 'people') && !project;
    const wantBusiness = (type === 'all' || type === 'business') && !project;
    const wantListings = type === 'all' || type === 'listings' || !!project;
    const wantClubs = (type === 'all' || type === 'clubs') && !project;
    const wantPosts = (type === 'all' || type === 'posts') && !project && q.length >= 2;

    const [people, business, listings, clubs, posts] = await Promise.all([
      wantPeople
        ? prisma.user.findMany({
            where: {
              isActive: true,
              id: { notIn: excluded },
              accountType: { not: 'business' },
              role: { in: ['user', 'business'] },
              ...textOr(['firstName', 'lastName', 'city', 'profession']),
              ...cityIs(),
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
              ...textOr(['companyName', 'businessType', 'businessCategory', 'description', 'servicesList', 'city']),
              ...cityIs(),
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
              ...(project ? { projectSlug: project } : {}),
              ...textOr(['title', 'description', 'city']),
              ...cityIs(),
            },
            orderBy: { id: 'desc' },
            take,
            include: listingInclude,
          })
        : [],
      wantClubs
        ? prisma.club.findMany({
            where: { isHidden: false, ...textOr(['name', 'description', 'category']), ...cityIs() },
            orderBy: [{ membersCount: 'desc' }, { id: 'desc' }],
            take,
            select: { id: true, name: true, city: true, category: true, membersCount: true, imageUrl: true },
          })
        : [],
      wantPosts
        ? prisma.post.findMany({
            where: { isHidden: false, isPrivate: false, clubId: null, author: { isActive: true }, authorId: { notIn: [...excluded, ...privateHidden] }, ...textOr(['content']) },
            orderBy: { id: 'desc' },
            take,
            select: { id: true, content: true, createdAt: true, author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, businessInfo: { select: { companyName: true, logoUrl: true } } } } },
          })
        : [],
    ]);

    const saved = listings.length ? await loadSavedIds(prisma, userId, listings.map((l: any) => l.id)) : new Set<number>();

    return NextResponse.json({
      q,
      posts: posts.map((p: any) => ({ id: p.id, snippet: p.content.length > 160 ? `${p.content.slice(0, 160)}…` : p.content, createdAt: p.createdAt, author: { id: p.author.id, name: p.author.businessInfo?.companyName || `${p.author.firstName} ${p.author.lastName}`.trim(), avatarUrl: p.author.businessInfo?.logoUrl || p.author.avatarUrl } })),
      clubs: clubs.map((c: any) => ({ id: c.id, name: c.name, avatarUrl: c.imageUrl, city: c.city, category: c.category, membersCount: c.membersCount })),
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
