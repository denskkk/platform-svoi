/** GET /api/admin/rep/applications?project=lawyers&queue=general|all&status=new — заявки представництв. general = без керівника (загальна черга). Лише адміністратор. */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/authMiddleware';
import { getApiT } from '@/i18n/server';
import { personOf } from '@/lib/rep';

export const dynamic = 'force-dynamic';

async function handler(request: NextRequest) {
  const t = getApiT(request);
  try {
    const userId = (request as any).user?.userId;
    const me = userId ? await prisma.user.findUnique({ where: { id: Number(userId) }, select: { isAdmin: true } }) : null;
    if (!me?.isAdmin) return NextResponse.json({ error: t('api.common.adminOnly') }, { status: 403 });
    const sp = new URL(request.url).searchParams;
    const project = (sp.get('project') || 'lawyers').trim();
    const general = sp.get('queue') !== 'all';
    const status = ['new', 'accepted', 'rejected'].includes(sp.get('status') || '') ? sp.get('status')! : undefined;
    const rows = await prisma.repApplication.findMany({
      where: { project, ...(general ? { toLeaderId: null } : {}), ...(status ? { status } : {}) },
      orderBy: { id: 'desc' }, take: 100,
      select: {
        id: true, kind: true, placeName: true, message: true, phone: true, specialization: true, mode: true, status: true, createdAt: true,
        unit: { select: { id: true, name: true, level: true } },
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        toLeader: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });
    return NextResponse.json({ applications: rows.map((r) => ({ id: r.id, kind: r.kind, placeName: r.placeName, message: r.message, phone: r.phone, specialization: r.specialization, mode: r.mode, status: r.status, createdAt: r.createdAt, unit: r.unit, applicant: personOf(r.user), toLeader: personOf(r.toLeader) })) });
  } catch (e) {
    console.error('[admin rep applications]', e);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function GET(request: NextRequest) { return withAuth(request, handler); }
