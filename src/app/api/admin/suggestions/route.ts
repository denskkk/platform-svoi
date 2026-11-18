/** GET /api/admin/suggestions?status= — список; POST { id, status } — змінити статус (new|done|rejected). Право reports.handle. */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasAdminPermission } from '@/lib/adminAccess';
import { withAuth } from '@/lib/authMiddleware';
import { logAudit } from '@/lib/audit';
import { getApiT } from '@/i18n/server';

export const dynamic = 'force-dynamic';
const STATUSES = ['new', 'done', 'rejected'];

async function list(request: NextRequest) {
  const t = getApiT(request);
  const adminId = Number((request as any).user?.userId);
  if (!(await hasAdminPermission(adminId, 'reports.handle'))) return NextResponse.json({ error: t('api.common.adminOnly') }, { status: 403 });
  const status = new URL(request.url).searchParams.get('status') || 'new';
  const rows = await prisma.projectSuggestion.findMany({
    where: STATUSES.includes(status) ? { status } : {}, orderBy: { id: 'desc' }, take: 100,
    include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
  });
  return NextResponse.json({ items: rows });
}

async function update(request: NextRequest) {
  const t = getApiT(request);
  const adminId = Number((request as any).user?.userId);
  if (!(await hasAdminPermission(adminId, 'reports.handle'))) return NextResponse.json({ error: t('api.common.adminOnly') }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const id = Number(body?.id);
  if (!Number.isInteger(id) || !STATUSES.includes(body?.status)) return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
  await prisma.projectSuggestion.update({ where: { id }, data: { status: body.status } });
  await logAudit({ actorId: adminId, action: 'suggestion.status', entityType: 'project_suggestion', entityId: id, details: { status: body.status } });
  return NextResponse.json({ success: true });
}

export async function GET(request: NextRequest) { return withAuth(request, list); }
export async function POST(request: NextRequest) { return withAuth(request, update); }
