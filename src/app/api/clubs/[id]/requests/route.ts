/**
 * Керування учасниками спільноти (лише власник):
 * GET  /api/clubs/:id/requests — заявки на вступ і учасники з правом писати
 * POST /api/clubs/:id/requests { userId, action: approve | reject | allow_write | deny_write | remove }
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { parseId } from '@/lib/feed';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const ACTIONS = ['approve', 'reject', 'allow_write', 'deny_write', 'remove'] as const;

async function ownerClub(request: NextRequest, idParam: string) {
  const t = getApiT(request);
  const auth = await requireAuth(request);
  if (auth.error) return { error: auth.error, t };
  const userId = Number(auth.user.userId);
  const id = parseId(idParam);
  const club = id ? await prisma.club.findFirst({ where: { id, isHidden: false }, select: { id: true, ownerId: true, name: true } }) : null;
  if (!club) return { error: NextResponse.json({ error: t('api.clubs.notFound') }, { status: 404 }), t };
  if (club.ownerId !== userId) return { error: NextResponse.json({ error: t('api.clubs.notOwner') }, { status: 403 }), t };
  return { club, userId, t };
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const r: any = await ownerClub(request, params.id);
  if (r.error) return r.error;
  try {
    const rows = await prisma.clubMember.findMany({
      where: { clubId: r.club.id, userId: { not: r.userId }, user: { isActive: true } },
      orderBy: { id: 'asc' },
      take: 200,
      select: { status: true, canWrite: true, user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
    });
    const map = (m: any) => ({ id: m.user.id, name: `${m.user.firstName} ${m.user.lastName}`.trim(), avatarUrl: m.user.avatarUrl, canWrite: m.canWrite });
    return NextResponse.json({
      pending: rows.filter((m: any) => m.status === 'pending').map(map),
      members: rows.filter((m: any) => m.status === 'active').map(map),
    });
  } catch (e) {
    console.error('[club requests GET]', e);
    return NextResponse.json({ error: r.t('api.common.serverError') }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const r: any = await ownerClub(request, params.id);
  if (r.error) return r.error;
  const t = r.t;
  try {
    const body = await request.json().catch(() => ({}));
    const targetId = Number(body?.userId);
    const action = String(body?.action || '');
    if (!Number.isInteger(targetId) || targetId <= 0 || targetId === r.userId || !(ACTIONS as readonly string[]).includes(action)) {
      return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
    }
    const where = { clubId_userId: { clubId: r.club.id, userId: targetId } };
    const member = await prisma.clubMember.findUnique({ where, select: { status: true } });
    if (!member) return NextResponse.json({ error: t('api.common.invalidData') }, { status: 404 });

    if (action === 'approve') {
      if (member.status !== 'pending') return NextResponse.json({ success: true });
      await prisma.$transaction([
        prisma.clubMember.update({ where, data: { status: 'active' } }),
        prisma.club.update({ where: { id: r.club.id }, data: { membersCount: { increment: 1 } } }),
      ]);
      try {
        await prisma.notification.create({ data: { userId: targetId, type: 'club_join_approved', title: 'Заявку на вступ схвалено', message: r.club.name.slice(0, 150), relatedUserId: r.userId, relatedEntityType: 'club', relatedEntityId: r.club.id } }); // i18n-ignore
      } catch { /* необов'язково */ }
    } else if (action === 'reject') {
      await prisma.clubMember.deleteMany({ where: { clubId: r.club.id, userId: targetId, status: 'pending' } });
    } else if (action === 'remove') {
      const removed = await prisma.clubMember.deleteMany({ where: { clubId: r.club.id, userId: targetId, status: 'active' } });
      if (removed.count > 0) await prisma.club.update({ where: { id: r.club.id }, data: { membersCount: { decrement: 1 } } });
    } else {
      if (member.status !== 'active') return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
      await prisma.clubMember.update({ where, data: { canWrite: action === 'allow_write' } });
    }
    await logAudit({ actorId: r.userId, action: `club.${action}`, entityType: 'club', entityId: r.club.id, details: { targetId } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[club requests POST]', e);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
