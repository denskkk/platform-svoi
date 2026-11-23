/** GET /api/project-suggestions/<id>/history — історія статусів власної заявки (створення, зміни статусу). Лише автор. */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const t = getApiT(request);
  const { user, error } = await requireAuth(request);
  if (error) return error;
  try {
    const id = Number(params.id);
    if (!Number.isInteger(id)) return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
    const own = await prisma.projectSuggestion.findFirst({ where: { id, userId: Number(user.userId) }, select: { id: true } });
    if (!own) return NextResponse.json({ error: t('api.common.invalidData') }, { status: 404 });
    const rows = await prisma.auditLog.findMany({
      where: { entityType: 'project_suggestion', entityId: id, action: { in: ['suggestion.create', 'suggestion.status'] } },
      orderBy: { id: 'asc' }, take: 50, select: { action: true, details: true, createdAt: true },
    });
    const events = rows.map((r: any) => ({ at: r.createdAt, status: r.action === 'suggestion.create' ? 'new' : String((r.details as any)?.status || '') }));
    return NextResponse.json({ events });
  } catch (e) {
    console.error('[project-suggestions history]', e);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
