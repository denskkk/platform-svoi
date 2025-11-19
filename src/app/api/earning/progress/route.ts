import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-middleware';
import { getUserEarningProgress, EARNING_REWARDS, EARNING_DESCRIPTIONS } from '@/lib/earning';
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
    // Try to return a safe fallback so UI can render tasks instead of showing a 500
    const devInfo = process.env.NODE_ENV === 'production' ? undefined : { message: error?.message, stack: error?.stack };

    const fallback = Object.entries(EARNING_REWARDS).map(([action, amount]) => ({
      action,
      description: EARNING_DESCRIPTIONS[action as keyof typeof EARNING_DESCRIPTIONS],
      amount,
      completed: false,
      canEarn: false,
      progress: 0,
      progressMax: 1,
      isRepeatable: ['DAILY_LOGIN', 'GIVE_REVIEW', 'SERVICE_COMPLETED'].includes(action),
    }));

    return NextResponse.json(
      { progress: fallback, totalEarned: 0, ...(devInfo ? { debugError: devInfo } : {}) },
      { status: 200 }
    );
  }
}
