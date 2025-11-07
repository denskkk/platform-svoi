/**
 * POST /api/account/upgrade
 * Upgrade current user's accountType (basic -> extended/business/business_premium)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, generateToken } from '@/lib/auth';
import { setAuthCookie } from '@/lib/cookies';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Auth: read token from cookie or Authorization header
    const authHeader = request.headers.get('authorization');
    const bearer = authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : null;

    const cookieToken = request.cookies.get('token')?.value || null;
    const rawToken = bearer || cookieToken;
    if (!rawToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  const payload = verifyToken(rawToken);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { target } = await request.json();
    const allowedTargets = ['extended', 'business', 'business_premium'] as const;
    if (!target || !allowedTargets.includes(target)) {
      return NextResponse.json({ error: 'Invalid target account type' }, { status: 400 });
    }

    // Fetch current user
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Enforce sequential upgrade: can only upgrade to NEXT level (no skipping)
    const priority = (t: string) => (
      t === 'basic' ? 0 : t === 'extended' ? 1 : t === 'business' ? 2 : t === 'business_premium' ? 3 : 0
    );
    const currentPriority = priority(user.accountType);
    const targetPriority = priority(target);
    
    // Must be exactly one level higher
    if (targetPriority !== currentPriority + 1) {
      return NextResponse.json({ error: 'Апгрейд можливий лише на наступний рівень послідовно' }, { status: 400 });
    }

    // Trial logic: start trial for any paid tiers (extended/business*)
    const now = new Date();
    const trialExpires = new Date(now);
    trialExpires.setMonth(trialExpires.getMonth() + 3);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        accountType: target as any,
        subscriptionActive: true,
        subscriptionStartedAt: now,
        subscriptionExpiresAt: trialExpires,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        accountType: true,
        city: true,
        avatarUrl: true,
        isVerified: true,
        subscriptionActive: true,
        subscriptionStartedAt: true,
        subscriptionExpiresAt: true,
        createdAt: true,
      }
    });

    // Re-issue token to reflect new accountType
    const newToken = generateToken({
      userId: updated.id,
      email: updated.email,
      role: updated.role,
      accountType: updated.accountType,
    });

    const response = NextResponse.json({ success: true, user: updated, token: newToken });
    setAuthCookie(response, newToken);
    return response;
  } catch (e) {
    console.error('Upgrade account error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
