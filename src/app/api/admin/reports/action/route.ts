/**
 * POST /api/admin/reports/action
 * Дії модератора за скаргою: сховати/повернути допис, видалити коментар,
 * заблокувати/розблокувати користувача. Кожна дія пишеться в журнал аудиту.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasAdminPermission, getAdminAccess } from '@/lib/adminAccess';
import { withAuth } from '@/lib/authMiddleware';
import { logAudit } from '@/lib/audit';
import { parseReportRef } from '@/lib/reportRef';
import { getApiT } from '@/i18n/server';

export const dynamic = 'force-dynamic';

const ACTIONS = ['hide_post', 'unhide_post', 'delete_comment', 'suspend_user', 'restore_user'] as const;
type Action = (typeof ACTIONS)[number];

async function handler(request: NextRequest) {
  const t = getApiT(request);
  const adminId = Number((request as any).user?.userId);
  try {
    if (!(await hasAdminPermission(adminId, 'reports.handle'))) {
      return NextResponse.json({ error: t('api.common.adminOnly') }, { status: 403 });
    }
    const body = await request.json().catch(() => ({}));
    const reportId = Number(body?.reportId);
    const action = String(body?.action || '') as Action;
    if (!Number.isInteger(reportId) || !(ACTIONS as readonly string[]).includes(action)) {
      return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
    }
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) return NextResponse.json({ error: t('api.common.invalidData') }, { status: 404 });
    const ref = parseReportRef(report.reason);

    if (action === 'hide_post' || action === 'unhide_post') {
      if (!ref || ref.type !== 'post') return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
      const r = await prisma.post.updateMany({ where: { id: ref.id }, data: { isHidden: action === 'hide_post' } });
      if (!r.count) return NextResponse.json({ error: t('api.common.invalidData') }, { status: 404 });
    } else if (action === 'delete_comment') {
      if (!ref || ref.type !== 'comment') return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
      const c = await prisma.postComment.findUnique({ where: { id: ref.id }, select: { id: true, postId: true } });
      if (!c) return NextResponse.json({ error: t('api.common.invalidData') }, { status: 404 });
      const replies = await prisma.postComment.count({ where: { parentId: c.id } });
      await prisma.$transaction([
        prisma.postComment.delete({ where: { id: c.id } }),
        prisma.post.update({ where: { id: c.postId }, data: { commentsCount: { decrement: 1 + replies } } }),
      ]);
    } else {
      const target = await prisma.user.findUnique({ where: { id: report.reportedUserId }, select: { id: true, isAdmin: true } });
      if (!target) return NextResponse.json({ error: t('api.common.userNotFound') }, { status: 404 });
      if (action === 'suspend_user') {
        const access = await getAdminAccess(target.id);
        if (target.isAdmin || access.role || target.id === adminId) {
          return NextResponse.json({ error: t('api.admin.reports.cannotSuspendStaff') }, { status: 400 });
        }
      }
      await prisma.user.update({ where: { id: target.id }, data: { isActive: action === 'restore_user' } });
    }

    await prisma.report.update({
      where: { id: reportId },
      data: { adminId, status: 'resolved', resolvedAt: new Date() },
    });
    await logAudit({ actorId: adminId, action: `moderation.${action}`, entityType: 'report', entityId: reportId, details: { ref, reportedUserId: report.reportedUserId } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[admin/reports/action] error', e);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return withAuth(request, handler);
}
