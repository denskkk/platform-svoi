/**
 * GET /api/auth/me
 * Отримати інформацію про поточного користувача
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { getApiT } from '@/i18n/server';

async function handler(request: AuthenticatedRequest) {
  const t = getApiT(request);
  try {
    if (!request.user) {
      return NextResponse.json(
        { error: t('api.session.missing') },
        { status: 401 }
      );
    }

    // Отримати повну інформацію про користувача з БД
    const user = await prisma.user.findUnique({
      where: { id: request.user.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        accountType: true,
        city: true,
        phone: true,
        avatarUrl: true,
        isVerified: true,
        createdAt: true,
        businessInfo: {
          select: {
            companyName: true,
            logoUrl: true,
            bannerUrl: true,
            city: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: t('api.common.userNotFound') },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { error: t('api.common.serverError') },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return withAuth(request, handler);
}
