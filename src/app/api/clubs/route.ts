/**
 * GET  /api/clubs?q=&city=&category=&scope=all|mine&cursor=<id>  — клуби
 * POST /api/clubs { name, description, category, city? }          — створити клуб (творець стає учасником)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAuthWithPermission } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { getBlockedIds } from '@/lib/blocks';
import { parseId } from '@/lib/feed';
import { CLUB_CATEGORIES, CLUB_LIMITS, CLUB_JOIN_MODES, CLUB_POST_MODES, CLUB_VISIBILITIES, serializeClub } from '@/lib/clubs';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const t = getApiT(request);
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);

    const p = new URL(request.url).searchParams;
    const q = (p.get('q') || '').trim().slice(0, 80);
    const city = (p.get('city') || '').trim().slice(0, 100);
    const category = p.get('category') || '';
    const mine = p.get('scope') === 'mine';
    const cursor = parseId(p.get('cursor'));
    const blocked = await getBlockedIds(userId);

    const and: any[] = [{ isHidden: false }];
    if (blocked.length) and.push({ ownerId: { notIn: blocked } });
    if (q) and.push({ OR: [{ name: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }] });
    if (city) and.push({ city: { contains: city, mode: 'insensitive' } });
    if ((CLUB_CATEGORIES as readonly string[]).includes(category)) and.push({ category });
    if (mine) and.push({ members: { some: { userId, status: 'active' } } });
    if (cursor) and.push({ id: { lt: cursor } });

    const rows = await prisma.club.findMany({ where: { AND: and }, orderBy: { id: 'desc' }, take: CLUB_LIMITS.pageSize + 1 });
    const hasMore = rows.length > CLUB_LIMITS.pageSize;
    const page = hasMore ? rows.slice(0, CLUB_LIMITS.pageSize) : rows;
    const memberships = page.length
      ? await prisma.clubMember.findMany({ where: { userId, clubId: { in: page.map((c: any) => c.id) } }, select: { clubId: true, status: true, canWrite: true } })
      : [];
    const byClub = new Map<number, any>(memberships.map((m: any) => [m.clubId, m]));

    return NextResponse.json({ clubs: page.map((c: any) => serializeClub(c, byClub.get(c.id)?.status === 'active', userId, byClub.get(c.id))), nextCursor: hasMore ? page[page.length - 1].id : null });
  } catch (error) {
    console.error('Clubs list error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const t = getApiT(request);
  try {
    const auth = await requireAuthWithPermission(request, 'CREATE_POST');
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);

    if (!checkRateLimit(`club:create:${userId}`, { interval: 24 * 60 * 60 * 1000, maxRequests: 5 }).allowed) {
      return NextResponse.json({ error: t('api.common.tooManyRequests') }, { status: 429 });
    }
    const body = await request.json().catch(() => ({}));
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const description = typeof body?.description === 'string' ? body.description.trim() : '';
    const category = String(body?.category || '');
    const city = typeof body?.city === 'string' && body.city.trim() ? body.city.trim().slice(0, 100) : null;
    if (!name || name.length > CLUB_LIMITS.nameMax || description.length < 10 || description.length > CLUB_LIMITS.descriptionMax || !(CLUB_CATEGORIES as readonly string[]).includes(category)) {
      return NextResponse.json({ error: t('api.clubs.fieldsInvalid') }, { status: 400 });
    }
    const joinMode = (CLUB_JOIN_MODES as readonly string[]).includes(body?.joinMode) ? body.joinMode : 'open';
    const postMode = (CLUB_POST_MODES as readonly string[]).includes(body?.postMode) ? body.postMode : 'owner';
    const visibility = (CLUB_VISIBILITIES as readonly string[]).includes(body?.visibility) ? body.visibility : 'public';
    const owned = await prisma.club.count({ where: { ownerId: userId } });
    if (owned >= CLUB_LIMITS.maxOwnedPerUser) return NextResponse.json({ error: t('api.clubs.tooMany') }, { status: 400 });

    const club = await prisma.$transaction(async (tx: any) => {
      const created = await tx.club.create({ data: { ownerId: userId, name, description, category, city, joinMode, postMode, visibility } });
      await tx.clubMember.create({ data: { clubId: created.id, userId, status: 'active', canWrite: true } });
      return created;
    });
    return NextResponse.json({ club: serializeClub(club, true, userId, { status: 'active', canWrite: true }) }, { status: 201 });
  } catch (error) {
    console.error('Create club error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
