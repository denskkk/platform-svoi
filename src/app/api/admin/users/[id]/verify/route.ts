import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAuth } from '@/lib/authMiddleware';
import { getApiT } from '@/i18n/server';
import { AdminForbiddenError } from '@/lib/api-middleware';

const prisma = new PrismaClient();

// Перевірка доступу адміністратора
async function checkAdmin(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!(user as any)?.isAdmin) {
    throw new AdminForbiddenError();
  }
}

// PATCH /api/admin/users/[id]/verify - Встановити статус «Перевірений користувач»
async function handler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const t = getApiT(request);
  try {
    const adminUserId = (request as any).user?.userId;
    
    if (!adminUserId) {
      return NextResponse.json(
        { error: t('api.common.authRequired') },
        { status: 401 }
      );
    }

    await checkAdmin(adminUserId);

    const userId = parseInt(params.id);
    const body = await request.json();
    const { verified } = body;

    if (typeof verified !== 'boolean') {
      return NextResponse.json(
        { error: t('api.admin.verifiedMustBeBoolean') },
        { status: 400 }
      );
    }

    // Оновити статус користувача
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isVerified: verified
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        city: true
      }
    });

    return NextResponse.json({
      success: true,
      message: verified 
        ? t('api.admin.verifiedGranted', { firstName: updatedUser.firstName, lastName: updatedUser.lastName })
        : t('api.admin.verifiedRevoked', { firstName: updatedUser.firstName, lastName: updatedUser.lastName }),
      user: {
        ...updatedUser,
        isVerified: verified
      }
    });

  } catch (error: any) {
    console.error('Помилка оновлення статусу:', error);
    
    if (error instanceof AdminForbiddenError) {
      return NextResponse.json(
        { error: t('api.common.adminOnly') },
        { status: 403 }
      );
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: t('api.common.userNotFound') },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: t('api.admin.statusUpdateError'), details: process.env.NODE_ENV === 'production' ? undefined : error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  return withAuth(request, (req) => handler(req, context));
}
