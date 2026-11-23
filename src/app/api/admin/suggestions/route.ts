/** GET /api/admin/suggestions?status= — список; POST { id, status } — змінити статус (new|done|rejected). Право reports.handle. */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasAdminPermission } from '@/lib/adminAccess';
import { withAuth } from '@/lib/authMiddleware';
import { logAudit } from '@/lib/audit';
import { getApiT } from '@/i18n/server';

export const dynamic = 'force-dynamic';
const STATUSES = ['new', 'review', 'offers', 'clarify', 'published', 'done', 'rejected', 'closed'];
const STATUS_UK: Record<string, string> = { new: 'Нова', review: 'На розгляді', offers: 'Є пропозиції', clarify: 'Потрібне уточнення', published: 'Опубліковано', done: 'Опрацьована', rejected: 'Відхилена', closed: 'Закрита' };

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
  const row = await prisma.projectSuggestion.update({ where: { id }, data: { status: body.status }, select: { userId: true, kind: true } });
  if (row.kind === 'unlock' && (body.status === 'done' || body.status === 'rejected')) {
    try {
      await prisma.notification.create({
        data: {
          userId: row.userId,
          type: body.status === 'done' ? 'unlock_done' : 'unlock_rejected',
          title: body.status === 'done' ? 'Заявку на відкриття функції схвалено' : 'Заявку на відкриття функції поки відхилено', // i18n-ignore
          message: '',
          relatedEntityType: 'project_suggestion',
          relatedEntityId: id,
        },
      });
    } catch (e) {
      console.error('Unlock notification error:', e);
    }
  }
  // Заявки (не пропозиції й скарги): людина отримує сповіщення про новий статус
  if (['request', 'consult', 'specialist', 'market'].includes(row.kind) && body.status !== 'new') {
    try {
      await prisma.notification.create({ data: { userId: row.userId, type: 'project_request_status', title: STATUS_UK[body.status] || body.status, message: body.status, relatedEntityType: 'project_suggestion', relatedEntityId: id } });
    } catch (e) {
      console.error('Request status notification error:', e);
    }
  }
  await logAudit({ actorId: adminId, action: 'suggestion.status', entityType: 'project_suggestion', entityId: id, details: { status: body.status } });
  return NextResponse.json({ success: true });
}

export async function GET(request: NextRequest) { return withAuth(request, list); }
export async function POST(request: NextRequest) { return withAuth(request, update); }
