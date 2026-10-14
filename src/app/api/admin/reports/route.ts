import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/authMiddleware';

export const dynamic = 'force-dynamic';

const STATUSES = ['new', 'in_review', 'resolved', 'rejected'] as const;

async function assertAdmin(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } });
  if (!user?.isAdmin) {
    throw new Error('Доступ заборонено. Тільки для адміністраторів.');
  }
}

function errorResponse(error: any) {
  const message = error?.message || 'Помилка сервера';
  return NextResponse.json({ error: message }, { status: message.includes('Доступ заборонено') ? 403 : 500 });
}

// GET /api/admin/reports?status=new — список скарг
async function listHandler(request: NextRequest) {
  try {
    const userId = (request as any).user?.userId;
    await assertAdmin(userId);

    const status = new URL(request.url).searchParams.get('status');
    const where: any = status && (STATUSES as readonly string[]).includes(status) ? { status } : {};

    const reports = await prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
        reportedUser: { select: { id: true, firstName: true, lastName: true, email: true, isActive: true } },
      },
    });

    return NextResponse.json({ success: true, reports });
  } catch (error) {
    console.error('Admin reports list error:', error);
    return errorResponse(error);
  }
}

// PATCH /api/admin/reports — змінити статус скарги { id, status, adminComment? }
async function updateHandler(request: NextRequest) {
  try {
    const adminId = (request as any).user?.userId;
    await assertAdmin(adminId);

    const body = await request.json().catch(() => ({}));
    const id = Number(body?.id);
    const status = String(body?.status || '');
    const adminComment = body?.adminComment ? String(body.adminComment).slice(0, 2000) : undefined;

    if (!Number.isInteger(id) || !(STATUSES as readonly string[]).includes(status)) {
      return NextResponse.json({ error: 'Невірні дані' }, { status: 400 });
    }

    const report = await prisma.report.update({
      where: { id },
      data: {
        status: status as (typeof STATUSES)[number],
        adminId,
        adminComment,
        resolvedAt: status === 'resolved' || status === 'rejected' ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Admin reports update error:', error);
    return errorResponse(error);
  }
}

export async function GET(request: NextRequest) {
  return withAuth(request, listHandler);
}

export async function PATCH(request: NextRequest) {
  return withAuth(request, updateHandler);
}
