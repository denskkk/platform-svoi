/**
 * GET /api/rep/units?project=lawyers[&unitId=N]
 * Без unitId — список країн. З unitId — сама одиниця, ланцюжок батьків, керівник, дочірні одиниці та схвалена команда.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { childLevel, personOf, RepLevel } from '@/lib/rep';

export const dynamic = 'force-dynamic';

const PERSON = { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } as const;

export async function GET(request: NextRequest) {
  const t = getApiT(request);
  const { user, error } = await requireAuth(request);
  if (error) return error;
  try {
    const me = Number(user.userId);
    const sp = new URL(request.url).searchParams;
    const project = (sp.get('project') || '').trim();
    if (!/^[a-z0-9-]{1,60}$/.test(project)) return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
    const unitId = sp.get('unitId') ? Number(sp.get('unitId')) : null;

    const childSelect = {
      id: true, name: true, level: true, flag: true, leader: PERSON,
      _count: { select: { children: { where: { isActive: true } }, members: { where: { status: 'approved' } } } },
    } as const;

    if (!unitId) {
      const children = await prisma.repUnit.findMany({ where: { project, parentId: null, isActive: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], take: 200, select: childSelect });
      return NextResponse.json({ unit: null, ancestors: [], children: children.map(shapeChild), members: [], nextLevel: 'country', viewer: { isLeader: false } });
    }

    const unit = await prisma.repUnit.findFirst({ where: { id: unitId, project, isActive: true }, select: { id: true, name: true, level: true, flag: true, parentId: true, leaderId: true, leader: PERSON } });
    if (!unit) return NextResponse.json({ error: t('api.rep.notFound') }, { status: 404 });

    // Ланцюжок батьків (максимум 4 рівні)
    const ancestors: { id: number; name: string; level: string; flag: string | null }[] = [];
    let pid = unit.parentId;
    for (let i = 0; pid && i < 4; i++) {
      const p = await prisma.repUnit.findUnique({ where: { id: pid }, select: { id: true, name: true, level: true, flag: true, parentId: true } });
      if (!p) break;
      ancestors.unshift({ id: p.id, name: p.name, level: p.level, flag: p.flag });
      pid = p.parentId;
    }

    const [children, members] = await Promise.all([
      prisma.repUnit.findMany({ where: { project, parentId: unit.id, isActive: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], take: 200, select: childSelect }),
      prisma.repMember.findMany({ where: { unitId: unit.id, status: 'approved' }, orderBy: { id: 'asc' }, take: 100, select: { id: true, role: true, mode: true, specialization: true, user: PERSON } }),
    ]);

    return NextResponse.json({
      unit: { id: unit.id, name: unit.name, level: unit.level, flag: unit.flag, leader: personOf(unit.leader) },
      ancestors,
      children: children.map(shapeChild),
      members: members.map((m: any) => ({ id: m.id, role: m.role, mode: m.mode, specialization: m.specialization, person: personOf(m.user) })),
      nextLevel: childLevel(unit.level as RepLevel),
      viewer: { isLeader: unit.leaderId === me },
    });
  } catch (e) {
    console.error('[rep units GET]', e);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

function shapeChild(c: any) {
  return { id: c.id, name: c.name, level: c.level, flag: c.flag, leader: personOf(c.leader), childrenCount: c._count.children, membersCount: c._count.members };
}
