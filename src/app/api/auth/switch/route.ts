/** POST /api/auth/switch {userId} — перемкнутися на зв'язаний акаунт (особистий ↔ бізнес) без повторного входу. */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { createSession } from '@/lib/session';
import { setAuthCookie, setRefreshCookie } from '@/lib/cookies';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const t = getApiT(request);
  const { user, error } = await requireAuth(request);
  if (error) return error;
  try {
    const me = Number(user.userId);
    const targetId = Number((await request.json().catch(() => ({})))?.userId);
    const link = Number.isInteger(targetId) ? await prisma.linkedAccount.findUnique({ where: { userId_linkedUserId: { userId: me, linkedUserId: targetId } } }) : null;
    const target = link ? await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, accountType: true, avatarUrl: true, city: true, isAdmin: true, isVerified: true, isActive: true },
    }) : null;
    if (!target?.isActive) return NextResponse.json({ error: t('api.common.invalidData') }, { status: 403 });
    const { token, refreshToken } = await createSession({ id: target.id, email: target.email, role: target.role, accountType: target.accountType }, request);
    await logAudit({ actorId: me, action: 'account.switch', entityType: 'user', entityId: target.id });
    const { isActive, ...safe } = target;
    const response = NextResponse.json({ success: true, user: safe, token });
    setAuthCookie(response, token);
    setRefreshCookie(response, refreshToken);
    return response;
  } catch (e) {
    console.error('[switch]', e);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
