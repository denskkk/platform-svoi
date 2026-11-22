/**
 * POST /api/rep/applications { project, kind: lawyer|join|open|consult, unitId?, placeName?, message, phone, specialization?, mode? }
 *   Маршрут: є керівник в обраній одиниці → заявка йде йому; немає → у загальну чергу (адміністрація).
 * GET  /api/rep/applications?box=in|out&project=...   in — адресовані мені (я керівник), out — мої.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { personOf, REP_KINDS, REP_MODES } from '@/lib/rep';

export const dynamic = 'force-dynamic';
const PERSON = { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } as const;

export async function POST(request: NextRequest) {
  const t = getApiT(request);
  const { user, error } = await requireAuth(request);
  if (error) return error;
  try {
    const me = Number(user.userId);
    if (!checkRateLimit(`rep:${me}`, { interval: 60 * 60 * 1000, maxRequests: 10 }).allowed) {
      return NextResponse.json({ error: t('api.common.tooManyRequests') }, { status: 429 });
    }
    const b = await request.json().catch(() => ({}));
    const str = (v: any, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
    const project = str(b.project, 60);
    const kind = (REP_KINDS as readonly string[]).includes(b.kind) ? (b.kind as string) : '';
    const message = str(b.message, 1000);
    const phone = str(b.phone, 30);
    const placeName = str(b.placeName, 120);
    const specialization = str(b.specialization, 160);
    const mode = (REP_MODES as readonly string[]).includes(b.mode) ? b.mode : null;
    const unitId = b.unitId ? Number(b.unitId) : null;
    if (!/^[a-z0-9-]{1,60}$/.test(project) || !kind || message.length < 5 || !/^\+?[0-9 ()-]{7,30}$/.test(phone) || (b.unitId && !Number.isInteger(unitId))) {
      return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
    }
    // Адвокат і вступ до команди прив'язані до одиниці; відкриття представництва без одиниці — з назвою місця
    if ((kind === 'lawyer' || kind === 'join') && !unitId) return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
    if (kind === 'open' && !unitId && placeName.length < 2) return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });

    let unit: { id: number; name: string; leaderId: number | null } | null = null;
    if (unitId) {
      unit = await prisma.repUnit.findFirst({ where: { id: unitId, project, isActive: true }, select: { id: true, name: true, leaderId: true } });
      if (!unit) return NextResponse.json({ error: t('api.rep.notFound') }, { status: 404 });
    }
    // Правило маршруту: керівник одиниці, якщо він є й це не сам заявник; інакше — загальна черга
    const toLeaderId = unit?.leaderId && unit.leaderId !== me ? unit.leaderId : null;

    const duplicate = await prisma.repApplication.findFirst({ where: { userId: me, project, kind, unitId: unitId ?? null, status: 'new', placeName: placeName || null }, select: { id: true } });
    if (duplicate) return NextResponse.json({ error: t('api.rep.duplicate') }, { status: 409 });

    const created = await prisma.repApplication.create({
      data: { project, unitId, userId: me, kind, placeName: placeName || null, message, phone, specialization: specialization || null, mode, toLeaderId },
      select: { id: true },
    });

    if (toLeaderId) {
      await prisma.notification.create({
        data: { userId: toLeaderId, type: 'rep_application', title: 'Нова заявка до вашого представництва', message: unit?.name ?? '', relatedUserId: me, relatedEntityType: 'rep_application', relatedEntityId: created.id }, // i18n-ignore
      }).catch(() => undefined);
    } else {
      // Загальна черга: дублюємо в «Пропозиції», щоб адміністратор побачив одразу
      await prisma.projectSuggestion.create({ data: { userId: me, projectSlug: project, kind: 'request', text: `[rep:${kind}] ${unit?.name || placeName || '—'}: ${message}`.slice(0, 1000) } }).catch(() => undefined);
    }

    let leader = null;
    if (toLeaderId) leader = personOf(await prisma.user.findUnique({ where: { id: toLeaderId }, select: PERSON.select }));
    return NextResponse.json({ success: true, routedTo: toLeaderId ? 'leader' : 'general', leader }, { status: 201 });
  } catch (e) {
    console.error('[rep applications POST]', e);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const t = getApiT(request);
  const { user, error } = await requireAuth(request);
  if (error) return error;
  try {
    const me = Number(user.userId);
    const sp = new URL(request.url).searchParams;
    const box = sp.get('box') === 'in' ? 'in' : 'out';
    const status = ['new', 'accepted', 'rejected'].includes(sp.get('status') || '') ? sp.get('status')! : undefined;
    const rows = await prisma.repApplication.findMany({
      where: box === 'in' ? { toLeaderId: me, ...(status ? { status } : {}) } : { userId: me },
      orderBy: { id: 'desc' },
      take: 50,
      select: { id: true, kind: true, placeName: true, message: true, phone: true, specialization: true, mode: true, status: true, createdAt: true, unit: { select: { id: true, name: true, level: true } }, user: PERSON },
    });
    return NextResponse.json({ applications: rows.map((r) => ({ id: r.id, kind: r.kind, placeName: r.placeName, message: r.message, phone: box === 'in' ? r.phone : undefined, specialization: r.specialization, mode: r.mode, status: r.status, createdAt: r.createdAt, unit: r.unit, applicant: box === 'in' ? personOf(r.user) : undefined })) });
  } catch (e) {
    console.error('[rep applications GET]', e);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
