import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAuth } from '@/lib/authMiddleware';

const prisma = new PrismaClient();

// Перевірка доступу адміністратора
async function checkAdmin(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!(user as any)?.isAdmin) {
    throw new Error('Доступ заборонено. Тільки для адміністраторів.');
  }
  
  return true;
}

// POST /api/admin/grant-ucm - Видати УЦМ користувачу
async function handler(request: NextRequest) {
  try {
    const userId = (request as any).user?.userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Необхідна авторизація' },
        { status: 401 }
      );
    }

    await checkAdmin(userId);

    const body = await request.json();
    const { targetUserId, amount, reason, description } = body;

    // Валідація
    if (!targetUserId || !amount || !reason) {
      return NextResponse.json(
        { error: 'Не вказано обов\'язкові поля: targetUserId, amount, reason' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Сума повинна бути більше 0' },
        { status: 400 }
      );
    }

    // Перевірити, чи існує користувач
    const targetUser = await prisma.user.findUnique({
      where: { id: Number(targetUserId) },
      select: { id: true, firstName: true, lastName: true, email: true }
    } as any);

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Користувача не знайдено' },
        { status: 404 }
      );
    }

    // Виконати транзакцію
    const result = await prisma.$transaction(async (tx) => {
      // Створити запис транзакції
      const transaction = await (tx as any).ucmTransaction.create({
        data: {
          userId: Number(targetUserId),
          amount: Number(amount),
          reason: String(reason),
          description: description || `Видано адміністратором`
        }
      });

      // Оновити баланс користувача
      const updatedUser = await tx.user.update({
        where: { id: Number(targetUserId) },
        data: {
          balanceUcm: {
            increment: Number(amount)
          }
        } as any,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      } as any);

      return { transaction, updatedUser };
    });

    return NextResponse.json({
      success: true,
      message: `Успішно видано ${amount} уцм користувачу ${result.updatedUser.firstName} ${result.updatedUser.lastName}`,
      transaction: result.transaction,
      user: result.updatedUser
    });

  } catch (error: any) {
    console.error('Помилка видачі УЦМ:', error);
    
    if (error.message.includes('Доступ заборонено')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Помилка видачі УЦМ', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return withAuth(request, handler);
}
