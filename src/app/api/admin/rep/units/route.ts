/**
 * GET  /api/admin/rep/units?project=lawyers — усі одиниці (плоский список із керівниками). Лише адміністратор.
 * POST /api/admin/rep/units { project, parentId?, name, flag? } — додати одиницю; рівень визначається батьком.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/authMiddleware';
import { getApiT } from '@/i18n/server';
import { childLevel, personOf, RepLevel } from '@/lib/rep';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

async function isAdmin(request: NextRequest) {
  const userId = (request as any).user?.userId;
  const me = userId ? await prisma.user.findUnique({ where: { id: Number(userId) }, select: { isAdmin: true } }) : null;
  return !!me?.isAdmin;
}

async function getHandler(request: NextRequest) {
  const t = getApiT(request);
  if (!(await isAdmin(request))) return NextResponse.json({ error: t('api.common.adminOnly') }, { status: 403 });
  const project = (new URL(request.url).searchParams.get('project') || 'lawyers').trim();
  const rows = await prisma.repUnit.findMany({
    where: { project }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }], take: 2000,
    select: { id: true, parentId: true, level: true, name: true, flag: true, isActive: true, sortOrder: true, leader: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
  });
  return NextResponse.json({ units: rows.map((r) => ({ id: r.id, parentId: r.parentId, level: r.level, name: r.name, flag: r.flag, isActive: r.isActive, sortOrder: r.sortOrder, leader: personOf(r.leader) })) });
}

async function postHandler(request: NextRequest) {
  const t = getApiT(request);
  try {
    if (!(await isAdmin(request))) return NextResponse.json({ error: t('api.common.adminOnly') }, { status: 403 });
    const b = await request.json().catch(() => ({}));
    const project = typeof b.project === 'string' ? b.project.trim() : '';
    const name = typeof b.name === 'string' ? b.name.trim().slice(0, 120) : '';
    const flag = typeof b.flag === 'string' && b.flag.trim() ? b.flag.trim().slice(0, 8) : null;
    const parentId = b.parentId ? Number(b.parentId) : null;
    if (!/^[a-z0-9-]{1,60}$/.test(project) || name.length < 2 || (b.parentId && !Number.isInteger(parentId))) return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
    let level: RepLevel | null = 'country';
    if (parentId) {
      const parent = await prisma.repUnit.findFirst({ where: { id: parentId, project }, select: { level: true } });
      if (!parent) return NextResponse.json({ error: t('api.rep.notFound') }, { status: 404 });
      level = childLevel(parent.level as RepLevel);
      if (!level) return NextResponse.json({ error: t('api.rep.maxDepth') }, { status: 400 });
    }
    const adminId = Number((request as any).user?.userId);
    const created = await prisma.repUnit.create({ data: { project, parentId, level, name, flag }, select: { id: true } });
    await logAudit({ actorId: adminId, action: 'rep_unit.create', entityType: 'rep_unit', entityId: created.id, details: { name, level } });
    return NextResponse.json({ success: true, id: created.id }, { status: 201 });
  } catch (e) {
    console.error('[admin rep unit POST]', e);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function GET(request: NextRequest) { return withAuth(request, getHandler); }
export async function POST(request: NextRequest) { return withAuth(request, postHandler); }
