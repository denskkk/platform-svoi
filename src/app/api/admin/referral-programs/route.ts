/**
 * GET  /api/admin/referral-programs — програми та кандидати (схвалені компанії без програми)
 * POST /api/admin/referral-programs { businessUserId, action: 'activate' | 'update' | 'pause' | 'resume', percent?, contractRef? }
 * Відсоток зберігається в кожній угоді на момент її створення — зміна програми не чіпає наявні угоди.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasAdminPermission } from '@/lib/adminAccess';
import { withAuth } from '@/lib/authMiddleware';
import { getApiT } from '@/i18n/server';
import { logAudit } from '@/lib/audit';
import { parseId } from '@/lib/feed';

export const dynamic = 'force-dynamic';

async function getHandler(request: NextRequest) {
  const t = getApiT(request);
  try {
    const adminId = Number((request as any).user?.userId);
    if (!adminId || !(await hasAdminPermission(adminId, 'deals.manage'))) return NextResponse.json({ error: t('api.common.adminOnly') }, { status: 403 });

    const programs = await prisma.referralProgram.findMany({
      orderBy: { id: 'desc' },
      take: 100,
      include: { business: { select: { id: true, firstName: true, lastName: true, businessInfo: { select: { companyName: true } } } } },
    });
    const have = programs.map((p: any) => p.businessUserId);
    const apps = await prisma.businessApplication.findMany({
      where: { status: 'approved', ...(have.length ? { userId: { notIn: have } } : {}) },
      orderBy: { id: 'desc' },
      take: 50,
      select: { userId: true, companyName: true, proposedRewardPercent: true, offeredRewardPercent: true, offeredRewardTerms: true },
    });
    return NextResponse.json({
      programs: programs.map((p: any) => ({
        businessUserId: p.businessUserId,
        name: p.business.businessInfo?.companyName || `${p.business.firstName} ${p.business.lastName}`.trim(),
        percent: Number(p.percent), status: p.status, contractRef: p.contractRef,
      })),
      candidates: apps.map((a: any) => ({
        businessUserId: a.userId, name: a.companyName,
        approvedPercent: a.proposedRewardPercent === null ? null : Number(a.proposedRewardPercent),
        offeredPercent: a.offeredRewardPercent === null ? null : Number(a.offeredRewardPercent),
        offeredTerms: a.offeredRewardTerms,
      })),
    });
  } catch (error) {
    console.error('Admin programs error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

async function postHandler(request: NextRequest) {
  const t = getApiT(request);
  try {
    const adminId = Number((request as any).user?.userId);
    if (!adminId || !(await hasAdminPermission(adminId, 'deals.manage'))) return NextResponse.json({ error: t('api.common.adminOnly') }, { status: 403 });
    const body = await request.json().catch(() => ({}));
    const businessUserId = parseId(body?.businessUserId);
    const action = body?.action;
    if (!businessUserId || !['activate', 'update', 'pause', 'resume'].includes(action)) return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });

    const contractRef = typeof body?.contractRef === 'string' ? body.contractRef.trim().slice(0, 100) : '';
    let percent: number | null = null;
    if (action === 'activate' || action === 'update') {
      percent = Math.round(Number(body?.percent) * 100) / 100;
      if (!Number.isFinite(percent) || percent <= 0 || percent > 50) return NextResponse.json({ error: t('api.businessApplications.percentInvalid') }, { status: 400 });
    }
    if (action === 'activate') {
      const approved = await prisma.businessApplication.findFirst({ where: { userId: businessUserId, status: 'approved' }, select: { id: true } });
      if (!approved) return NextResponse.json({ error: t('api.deals.companyNotFound') }, { status: 404 });
      if (!contractRef) return NextResponse.json({ error: t('api.deals.contractRequired') }, { status: 400 });
      await prisma.referralProgram.upsert({
        where: { businessUserId },
        create: { businessUserId, percent, contractRef, status: 'active', activatedById: adminId },
        update: { percent, contractRef, status: 'active', activatedById: adminId },
      });
    } else {
      const exists = await prisma.referralProgram.findUnique({ where: { businessUserId }, select: { id: true } });
      if (!exists) return NextResponse.json({ error: t('api.deals.companyNotFound') }, { status: 404 });
      await prisma.referralProgram.update({
        where: { businessUserId },
        data: action === 'update' ? { percent, ...(contractRef ? { contractRef } : {}) } : { status: action === 'pause' ? 'paused' : 'active' },
      });
    }
    await logAudit({ actorId: adminId, action: `referral_program.${action}`, entityType: 'referral_program', entityId: businessUserId, details: { percent, contractRef } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin program action error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return withAuth(request, getHandler);
}

export async function POST(request: NextRequest) {
  return withAuth(request, postHandler);
}
