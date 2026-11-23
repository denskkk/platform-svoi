/**
 * PATCH /api/rep/applications/:id { status: accepted | rejected }
 * Опрацьовує заявку керівник, якому вона адресована, або адміністратор. Прийнята заявка адвоката / вступу додає людину до команди одиниці.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const t = getApiT(request);
  const { user, error } = await requireAuth(request);
  if (error) return error;
  try {
    const me = Number(user.userId);
    const id = Number(params.id);
    const body = await request.json().catch(() => ({}));
    const status = body?.status;
    if (!Number.isInteger(id) || (status !== 'accepted' && status !== 'rejected')) return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });

    const app = await prisma.repApplication.findUnique({ where: { id }, select: { id: true, userId: true, unitId: true, kind: true, status: true, toLeaderId: true, specialization: true, mode: true } });
    if (!app) return NextResponse.json({ error: t('api.rep.notFound') }, { status: 404 });
    const admin = await prisma.user.findUnique({ where: { id: me }, select: { isAdmin: true } });
    if (!admin?.isAdmin && app.toLeaderId !== me) return NextResponse.json({ error: t('api.rep.forbidden') }, { status: 403 });

    const updated = await prisma.repApplication.updateMany({ where: { id, status: 'new' }, data: { status, handledById: me, handledAt: new Date() } });
    if (updated.count === 0) return NextResponse.json({ error: t('api.listings.alreadyModerated') }, { status: 409 });

    if (status === 'accepted' && app.unitId && (app.kind === 'lawyer' || app.kind === 'join')) {
      const role = app.kind === 'lawyer' ? 'lawyer' : 'representative';
      await prisma.repMember.upsert({
        where: { unitId_userId_role: { unitId: app.unitId, userId: app.userId, role } },
        create: { unitId: app.unitId, userId: app.userId, role, mode: app.mode || 'both', specialization: app.specialization, status: 'approved' },
        update: { status: 'approved', mode: app.mode || 'both', specialization: app.specialization },
      });
    }
    await logAudit({ actorId: me, action: `rep_application.${status}`, entityType: 'rep_application', entityId: id });
    await prisma.notification.create({
      data: { userId: app.userId, type: status === 'accepted' ? 'rep_accepted' : 'rep_rejected', title: status === 'accepted' ? 'Вашу заявку прийнято' : 'Вашу заявку відхилено', relatedEntityType: 'rep_application', relatedEntityId: id }, // i18n-ignore
    }).catch(() => undefined);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[rep application PATCH]', e);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
