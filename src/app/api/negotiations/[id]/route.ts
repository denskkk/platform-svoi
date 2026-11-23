/**
 * GET  /api/negotiations/<id> — сторінка переговорів: учасники, умови, статус, історія та листування. Лише учасники.
 * POST /api/negotiations/<id> { action: 'message'|'terms'|'agree'|'status', ... }
 *   message { text?, attachmentUrl? } — повідомлення або документ (зображення, завантажене через /api/upload)
 *   terms   { product, volume, price, payTerms, delivery } — змінити умови (скидає згоду сторін; запис в історії)
 *   agree   — підтвердити поточні умови; коли підтвердили обидві сторони, статус «agreed»
 *   status  { status: 'active'|'declined'|'closed' } — партнер приймає в роботу; будь-хто може відхилити/закрити
 * Рух грошей не передбачено.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { isBlockedBetween } from '@/lib/blocks';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const CLOSED = ['declined', 'closed', 'agreed'];

async function load(id: number, me: number) {
  const n = await prisma.negotiation.findUnique({
    where: { id },
    include: { creator: { select: { id: true, firstName: true, lastName: true } }, partner: { select: { id: true, firstName: true, lastName: true } } },
  });
  return n && (n.creatorId === me || n.partnerId === me) ? n : null;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const t = getApiT(request);
  const { user, error } = await requireAuth(request);
  if (error) return error;
  try {
    const me = Number(user.userId);
    const id = Number(params.id);
    const n = Number.isInteger(id) ? await load(id, me) : null;
    if (!n) return NextResponse.json({ error: t('api.common.invalidData') }, { status: 404 });
    const messages = await prisma.negotiationMessage.findMany({
      where: { negotiationId: id }, orderBy: { id: 'asc' }, take: 300,
      select: { id: true, authorId: true, kind: true, text: true, attachmentUrl: true, createdAt: true },
    });
    const name = (u: { firstName: string | null; lastName: string | null }) => `${u.firstName || ''} ${u.lastName || ''}`.trim();
    const iAmCreator = n.creatorId === me;
    return NextResponse.json({
      negotiation: {
        id: n.id, title: n.title, product: n.product, volume: n.volume, price: n.price, payTerms: n.payTerms, delivery: n.delivery,
        status: n.status, mine: iAmCreator, with: name(iAmCreator ? n.partner : n.creator), withId: iAmCreator ? n.partnerId : n.creatorId,
        myAgreed: iAmCreator ? n.creatorAgreed : n.partnerAgreed, otherAgreed: iAmCreator ? n.partnerAgreed : n.creatorAgreed,
      },
      messages: messages.map((m: any) => ({ id: m.id, mine: m.authorId === me, kind: m.kind, text: m.text, attachmentUrl: m.attachmentUrl, createdAt: m.createdAt })),
    });
  } catch (e) {
    console.error('[negotiation GET]', e);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const t = getApiT(request);
  const { user, error } = await requireAuth(request);
  if (error) return error;
  try {
    const me = Number(user.userId);
    const id = Number(params.id);
    if (!checkRateLimit(`negmsg:${me}`, { interval: 60 * 1000, maxRequests: 30 }).allowed) {
      return NextResponse.json({ error: t('api.common.tooManyRequestsShort') }, { status: 429 });
    }
    const n = Number.isInteger(id) ? await load(id, me) : null;
    if (!n) return NextResponse.json({ error: t('api.common.invalidData') }, { status: 404 });
    const other = n.creatorId === me ? n.partnerId : n.creatorId;
    if (await isBlockedBetween(me, other)) return NextResponse.json({ error: t('api.common.invalidData') }, { status: 403 });
    const b = await request.json().catch(() => ({}));
    const action = String(b.action || '');
    const iAmCreator = n.creatorId === me;
    const notify = (type: string) => prisma.notification.create({ data: { userId: other, type, title: n.title, message: '', relatedEntityType: 'negotiation', relatedEntityId: id } });
    const log = (kind: string, text: string) => prisma.negotiationMessage.create({ data: { negotiationId: id, authorId: me, kind, text } });

    if (action === 'message') {
      const text = str(b.text, 2000);
      const url = str(b.attachmentUrl, 255);
      if ((!text && !url) || (url && !/^\/uploads\/[\w./-]+$/.test(url)) || CLOSED.includes(n.status) && n.status !== 'agreed') {
        return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
      }
      await prisma.negotiationMessage.create({ data: { negotiationId: id, authorId: me, kind: 'text', text: text || '📎', attachmentUrl: url || null } });
      await prisma.negotiation.update({ where: { id }, data: { updatedAt: new Date() } });
      await notify('negotiation_message');
    } else if (action === 'terms') {
      if (CLOSED.includes(n.status)) return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
      const data = { product: str(b.product, 150) || null, volume: str(b.volume, 100) || null, price: str(b.price, 100) || null, payTerms: str(b.payTerms, 200) || null, delivery: str(b.delivery, 200) || null };
      await prisma.negotiation.update({ where: { id }, data: { ...data, creatorAgreed: false, partnerAgreed: false } });
      await log('terms', [data.product, data.volume, data.price, data.payTerms, data.delivery].filter(Boolean).join(' | ').slice(0, 1900) || '—');
      await notify('negotiation_terms');
    } else if (action === 'agree') {
      if (n.status !== 'active') return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
      const mineAgreed = true;
      const otherAgreed = iAmCreator ? n.partnerAgreed : n.creatorAgreed;
      await prisma.negotiation.update({ where: { id }, data: { ...(iAmCreator ? { creatorAgreed: mineAgreed } : { partnerAgreed: mineAgreed }), ...(otherAgreed ? { status: 'agreed' } : {}) } });
      await log('status', otherAgreed ? 'agreed' : 'agree');
      await notify(otherAgreed ? 'negotiation_agreed' : 'negotiation_agree');
    } else if (action === 'status') {
      const st = String(b.status || '');
      const allowed = (st === 'active' && n.status === 'open' && n.partnerId === me) || ((st === 'declined' || st === 'closed') && !CLOSED.includes(n.status));
      if (!allowed) return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
      await prisma.negotiation.update({ where: { id }, data: { status: st } });
      await log('status', st);
      await notify(`negotiation_${st}`);
    } else {
      return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
    }
    await logAudit({ actorId: me, action: `negotiation.${action}`, entityType: 'negotiation', entityId: id });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[negotiation POST]', e);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
