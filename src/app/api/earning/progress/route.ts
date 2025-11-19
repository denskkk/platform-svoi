import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-middleware';
import { getUserEarningProgress } from '@/lib/earning';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { user: authUser, error } = await requireAuth(request);
    
    if (error || !authUser) {
      return error || NextResponse.json(
        { error: 'Необхідна авторизація' },
        { status: 401 }
      );
    }

    const userId = authUser.userId;

    // Получить прогресс заработка
    const progress = await getUserEarningProgress(userId);
    const userRecord = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, accountType: true } });
    console.log(`[earning/progress] user=${userId} found=${!!userRecord} progressCount=${progress.length}`);

    // Получить общую сумму заработанного
    const transactions = await prisma.ucmTransaction.findMany({
      where: {
        userId,
        kind: 'credit'
      }
    });

    const totalEarned = transactions.reduce((sum: number, t: any) => sum + Number(t.amount), 0);

    return NextResponse.json({
      progress,
      totalEarned,
      debug: {
        userFound: !!userRecord,
        accountType: userRecord?.accountType || null
      }
    });

  } catch (error: any) {
    console.error('[earning/progress] Error:', error);
    // In non-production expose minimal error message to help debugging
    const devInfo = process.env.NODE_ENV === 'production' ? undefined : { message: error?.message, stack: error?.stack };
    return NextResponse.json(
      { error: 'Помилка отримання прогресу', ...(devInfo ? { debugError: devInfo } : {}) },
      { status: 500 }
    );
  }
}
