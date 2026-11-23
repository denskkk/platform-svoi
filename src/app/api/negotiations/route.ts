/**
 * GET  /api/negotiations?project=&box=all|started|received — мої переговори (як ініціатор або як партнер).
 * POST /api/negotiations { projectSlug, partnerId, title, product?, volume?, price?, payTerms?, delivery?, text? } — організувати переговори.
 * Лише учасники бачать переговори. Система не рухає гроші: це простір для умов, листування й документів.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { isBlockedBetween } from '@/lib/blocks';
import { getProject } from '@/lib/projects';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function GET(request: NextRequest) {
  const t = getApiT(request);
  const { user, error } = await requireAuth(request);
  if (error) return error;
  try {
    const me = Number(user.userId);
    const sp = new URL(request.url).searchParams;
    const project = str(sp.get('project'), 60);
    const box = sp.get('box') || 'all';
    const who = box === 'started' ? [{ creatorId: me }] : box === 'received' ? [{ partnerId: me }] : [{ creatorId: me }, { partnerId: me }];
    const rows = await prisma.negotiation.findMany({
      where: { OR: who, ...(project ? { projectSlug: project } : {}) },
      orderBy: { updatedAt: 'desc' }, take: 50,
      select: {
        id: true, title: true, product: true, status: true, updatedAt: true, creatorId: true, partnerId: true,
        creator: { select: { id: true, firstName: true, lastName: true } }, partner: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    const name = (u: { firstName: string | null; lastName: string | null }) => `${u.firstName || ''} ${u.lastName || ''}`.trim();
    return NextResponse.json({
      items: rows.map((r: any) => ({ id: r.id, title: r.title, product: r.product, status: r.status, updatedAt: r.updatedAt, mine: r.creatorId === me, with: name(r.creatorId === me ? r.partner : r.creator) })),
    });
  } catch (e) {
    console.error('[negotiations GET]', e);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const t = getApiT(request);
  const { user, error } = await requireAuth(request);
  if (error) return error;
  try {
    const me = Number(user.userId);
    if (!checkRateLimit(`neg:${me}`, { interval: 60 * 60 * 1000, maxRequests: 20 }).allowed) {
      return NextResponse.json({ error: t('api.common.tooManyRequests') }, { status: 429 });
    }
    const b = await request.json().catch(() => ({}));
    const slug = str(b.projectSlug, 60);
    const partnerId = Number(b.partnerId);
    const title = str(b.title, 150);
    if (!title || !Number.isInteger(partnerId) || partnerId === me || !(await getProject(slug))) {
      return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
    }
    const partner = await prisma.user.findFirst({ where: { id: partnerId, isActive: true }, select: { id: true } });
    if (!partner || (await isBlockedBetween(me, partnerId))) return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
    const text = str(b.text, 2000);
    const row = await prisma.negotiation.create({
      data: {
        projectSlug: slug, creatorId: me, partnerId, title,
        product: str(b.product, 150) || null, volume: str(b.volume, 100) || null, price: str(b.price, 100) || null,
        payTerms: str(b.payTerms, 200) || null, delivery: str(b.delivery, 200) || null,
        ...(text ? { messages: { create: { authorId: me, kind: 'text', text } } } : {}),
      },
      select: { id: true },
    });
    await prisma.notification.create({ data: { userId: partnerId, type: 'negotiation_new', title: title, message: '', relatedEntityType: 'negotiation', relatedEntityId: row.id } });
    await logAudit({ actorId: me, action: 'negotiation.create', entityType: 'negotiation', entityId: row.id, details: { projectSlug: slug } });
    return NextResponse.json({ success: true, id: row.id }, { status: 201 });
  } catch (e) {
    console.error('[negotiations POST]', e);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
