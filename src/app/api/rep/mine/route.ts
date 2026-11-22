/** GET /api/rep/mine?project=lawyers — одиниці, якими керує поточний користувач, і кількість нових заявок до нього. */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const t = getApiT(request);
  const { user, error } = await requireAuth(request);
  if (error) return error;
  try {
    const me = Number(user.userId);
    const project = (new URL(request.url).searchParams.get('project') || '').trim();
    if (!/^[a-z0-9-]{1,60}$/.test(project)) return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
    const [units, pending] = await Promise.all([
      prisma.repUnit.findMany({ where: { project, leaderId: me, isActive: true }, orderBy: { id: 'asc' }, take: 50, select: { id: true, name: true, level: true, flag: true } }),
      prisma.repApplication.count({ where: { project, toLeaderId: me, status: 'new' } }),
    ]);
    return NextResponse.json({ units, pending });
  } catch (e) {
    console.error('[rep mine]', e);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
