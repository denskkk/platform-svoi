/**
 * GET /api/admin/projects — усі напрямки, включно з прихованими (лише адміністратор)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/authMiddleware';
import { getApiT } from '@/i18n/server';
import { listProjects } from '@/lib/projects';

export const dynamic = 'force-dynamic';

async function handler(request: NextRequest) {
  const t = getApiT(request);
  const userId = (request as any).user?.userId;
  const me = userId ? await prisma.user.findUnique({ where: { id: Number(userId) }, select: { isAdmin: true } }) : null;
  if (!me?.isAdmin) return NextResponse.json({ error: t('api.common.adminOnly') }, { status: 403 });

  return NextResponse.json({ projects: await listProjects({ includeHidden: true }) });
}

export async function GET(request: NextRequest) {
  return withAuth(request, handler);
}
