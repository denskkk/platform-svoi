import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Перевірка доступу адміністратора
async function checkAdmin(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!(user as any)?.isAdmin) {
    throw new Error('Доступ заборонено. Тільки для адміністраторів.');
  }
}

// PATCH /api/admin/users/[id]/verify - Встановити статус "Перевірено УЦМ"
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminUserId = (request as any).user?.userId;
    
    if (!adminUserId) {
      return NextResponse.json(
        { error: 'Необхідна авторизація' },
        { status: 401 }
      );
    }

    await checkAdmin(adminUserId);

    const userId = parseInt(params.id);
    const body = await request.json();
    const { verified } = body;

    if (typeof verified !== 'boolean') {
      return NextResponse.json(
        { error: 'Параметр verified повинен бути boolean' },
        { status: 400 }
      );
    }

    // Оновити статус користувача
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ucmVerified: verified
      } as any,
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
        ? `Користувач ${updatedUser.firstName} ${updatedUser.lastName} отримав статус "Перевірено УЦМ"`
        : `Статус "Перевірено УЦМ" знято з користувача ${updatedUser.firstName} ${updatedUser.lastName}`,
      user: {
        ...updatedUser,
        ucmVerified: verified
      }
    });

  } catch (error: any) {
    console.error('Помилка оновлення статусу:', error);
    
    if (error.message.includes('Доступ заборонено')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Користувача не знайдено' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Помилка оновлення статусу', details: error.message },
      { status: 500 }
    );
  }
}
