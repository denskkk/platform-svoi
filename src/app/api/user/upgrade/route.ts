import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasUcmTransactionsTable } from '@/lib/ucm';
import { requireAuth } from '@/lib/api-middleware';

export async function POST(request: NextRequest) {
  try {
    const { user: authUser, error } = await requireAuth(request);
    
    if (error || !authUser) {
      return error || NextResponse.json(
        { error: 'Необхідна авторизація' },
        { status: 401 }
      );
    }

    const userId = authUser.userId;
    const body = await request.json();
    const { accountType } = body;

    // Перевіряємо валідність типу акаунту
    const validTypes = ['viewer', 'basic', 'business'];
    if (!accountType || !validTypes.includes(accountType)) {
      return NextResponse.json(
        { error: 'Невірний тип акаунту' },
        { status: 400 }
      );
    }

    // Отримуємо поточного користувача
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { accountType: true }
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Користувача не знайдено' },
        { status: 404 }
      );
    }

    // Перевіряємо чи не намагається знизити тип
    const typeHierarchy = ['viewer', 'basic', 'business'];
    const currentIndex = typeHierarchy.indexOf(currentUser.accountType);
    const newIndex = typeHierarchy.indexOf(accountType);

    if (newIndex < currentIndex) {
      return NextResponse.json(
        { error: 'Не можна знизити тип акаунту' },
        { status: 400 }
      );
    }

    if (currentIndex === newIndex) {
      return NextResponse.json(
        { error: 'Ви вже маєте цей тип акаунту' },
        { status: 400 }
      );
    }

    // Оновлюємо тип акаунту
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { accountType: accountType as any },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        accountType: true,
        balanceUcm: true
      }
    });

    // Логуємо транзакцію (якщо таблиця леджера доступна)
    if (await hasUcmTransactionsTable()) {
      await prisma.ucmTransaction.create({
        data: {
          userId: userId,
          kind: 'info',
          amount: 0,
          reason: `Зміна типу акаунту з ${currentUser.accountType} на ${accountType}`,
          relatedEntityType: 'account_upgrade',
          relatedEntityId: userId
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Тип акаунту успішно оновлено',
      user: updatedUser
    });

  } catch (error: any) {
    console.error('[user/upgrade] Error:', error);
    return NextResponse.json(
      { error: 'Помилка оновлення акаунту' },
      { status: 500 }
    );
  }
}
