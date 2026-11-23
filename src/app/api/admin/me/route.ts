/** GET /api/admin/me — права поточного користувача в адмін-частині (isAdmin / роль / перелік прав) */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { getApiT } from '@/i18n/server';
import { getAdminAccess } from '@/lib/adminAccess';

export const dynamic = 'force-dynamic';

async function handler(request: NextRequest) {
  const t = getApiT(request);
  try {
    const access = await getAdminAccess(Number((request as any).user?.userId));
    return NextResponse.json(access);
  } catch (error) {
    console.error('Admin me error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return withAuth(request, handler);
}
