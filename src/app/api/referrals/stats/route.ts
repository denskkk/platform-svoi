/**
 * GET /api/referrals/stats
 * Статистика рефералів користувача
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-middleware'
import { prisma } from '@/lib/prisma'
import { hasUcmTransactionsTable } from '@/lib/ucm'

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth(request)
  if (error) return error

  const userId = Number(user.userId)

  try {
    // Отримуємо список рефералів
    const referrals = await prisma.user.findMany({
      where: {
        referredById: userId
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Отримуємо транзакції бонусів за рефералів (якщо таблиця ledger доступна)
    let totalEarned = 0
    if (await hasUcmTransactionsTable()) {
      const referralTransactions = await prisma.ucmTransaction.findMany({
        where: {
          userId: userId,
          reason: 'referral_inviter'
        },
        select: {
          amount: true,
          createdAt: true
        }
      })

      totalEarned = referralTransactions.reduce((sum: number, tx: any) => {
        return sum + Number(tx.amount)
      }, 0)
    }

    const activeReferrals = referrals.filter((r: any) => r.isActive).length

    return NextResponse.json({
      totalInvited: referrals.length,
      totalEarned,
      activeReferrals,
      referrals: referrals.map((r: any) => ({
        id: r.id,
        firstName: r.firstName,
        lastName: r.lastName,
        createdAt: r.createdAt,
        isActive: r.isActive
      }))
    })

  } catch (error) {
    console.error('[referrals/stats] Error:', error)
    return NextResponse.json(
      { error: 'Помилка отримання статистики' },
      { status: 500 }
    )
  }
}
