/**
 * PATCH  /api/admin/rep/units/:id { name?, flag?, sortOrder?, isActive?, leaderEmail? (порожньо — зняти керівника) }
 * DELETE /api/admin/rep/units/:id — прибрати одиницю разом із вкладеними (заявки лишаються без прив'язки). Лише адміністратор.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/authMiddleware';
import { getApiT } from '@/i18n/server';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

async function guard(request: NextRequest) {
  const userId = (request as any).user?.userId;
  const me = userId ? await prisma.user.findUnique({ where: { id: Number(userId) }, select: { isAdmin: true } }) : null;
  return me?.isAdmin ? Number(userId) : null;
}

async function patchHandler(request: NextRequest, idParam: string) {
  const t = getApiT(request);
  try {
    const adminId = await guard(request);
    if (!adminId) return NextResponse.json({ error: t('api.common.adminOnly') }, { status: 403 });
    const id = Number(idParam);
    const b = await request.json().catch(() => ({}));
    if (!Number.isInteger(id)) return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
    const data: Record<string, any> = {};
    if (b.name !== undefined) { if (typeof b.name !== 'string' || b.name.trim().length < 2) return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 }); data.name = b.name.trim().slice(0, 120); }
    if (b.flag !== undefined) data.flag = typeof b.flag === 'string' && b.flag.trim() ? b.flag.trim().slice(0, 8) : null;
    if (b.sortOrder !== undefined) { const n = Number(b.sortOrder); if (!Number.isInteger(n) || n < 0 || n > 100000) return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 }); data.sortOrder = n; }
    if (b.isActive !== undefined) data.isActive = !!b.isActive;
    if (b.leaderEmail !== undefined) {
      const email = typeof b.leaderEmail === 'string' ? b.leaderEmail.trim() : '';
      if (!email) data.leaderId = null;
      else {
        const u = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' }, isActive: true }, select: { id: true } });
        if (!u) return NextResponse.json({ error: t('api.rep.leaderNotFound') }, { status: 404 });
        data.leaderId = u.id;
      }
    }
    if (Object.keys(data).length === 0) return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
    const res = await prisma.repUnit.updateMany({ where: { id }, data });
    if (res.count === 0) return NextResponse.json({ error: t('api.rep.notFound') }, { status: 404 });
    await logAudit({ actorId: adminId, action: 'rep_unit.update', entityType: 'rep_unit', entityId: id, details: { ...data } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[admin rep unit PATCH]', e);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

async function deleteHandler(request: NextRequest, idParam: string) {
  const t = getApiT(request);
  try {
    const adminId = await guard(request);
    if (!adminId) return NextResponse.json({ error: t('api.common.adminOnly') }, { status: 403 });
    const id = Number(idParam);
    if (!Number.isInteger(id)) return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
    const res = await prisma.repUnit.deleteMany({ where: { id } });
    if (res.count === 0) return NextResponse.json({ error: t('api.rep.notFound') }, { status: 404 });
    await logAudit({ actorId: adminId, action: 'rep_unit.delete', entityType: 'rep_unit', entityId: id });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[admin rep unit DELETE]', e);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) { return withAuth(request, (r) => patchHandler(r, params.id)); }
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) { return withAuth(request, (r) => deleteHandler(r, params.id)); }
