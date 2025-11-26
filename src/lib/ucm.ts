import { prisma } from '@/lib/prisma'

// Cache for whether ucm_transactions table exists to avoid repeated queries
let _hasUcmTransactionsCache: boolean | null = null
let _hasUcmKindColumnCache: boolean | null = null

export async function hasUcmTransactionsTable(): Promise<boolean> {
  if (typeof _hasUcmTransactionsCache === 'boolean') return _hasUcmTransactionsCache
  try {
    const res: any = await prisma.$queryRaw`SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='ucm_transactions') as exists`
    if (Array.isArray(res) && res[0] && typeof res[0].exists === 'boolean') {
      _hasUcmTransactionsCache = res[0].exists
    } else if (res && typeof res.exists === 'boolean') {
      _hasUcmTransactionsCache = res.exists
    } else {
      _hasUcmTransactionsCache = false
    }
  } catch (e) {
    _hasUcmTransactionsCache = false
  }
  return _hasUcmTransactionsCache ?? false
}

// Check whether the 'kind' column exists on ucm_transactions
export async function hasUcmKindColumn(): Promise<boolean> {
  if (typeof _hasUcmKindColumnCache === 'boolean') return _hasUcmKindColumnCache
  try {
    const res: any = await prisma.$queryRaw`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ucm_transactions' AND column_name='kind') as exists`
    if (Array.isArray(res) && res[0] && typeof res[0].exists === 'boolean') {
      _hasUcmKindColumnCache = res[0].exists
    } else if (res && typeof res.exists === 'boolean') {
      _hasUcmKindColumnCache = res.exists
    } else {
      _hasUcmKindColumnCache = false
    }
  } catch (e) {
    _hasUcmKindColumnCache = false
  }
  return _hasUcmKindColumnCache ?? false
}

// Ціни платних дій (в уцмках)
export const PAID_ACTION_COSTS = {
  partner_search: 5,     // Пошук пари/партнера - 5 уцмок
  job_request: 3,        // Заявка на пошук роботи - 3 уцмки
  service_request: 3,    // Заявка на послугу - 3 уцмки
  employee_search: 4,    // Пошук працівника - 4 уцмки
  investor_search: 5,    // Пошук інвестора - 5 уцмок
  advanced_search: 2,    // Розширений пошук - 2 уцмки
} as const

// Бонуси за реферальну систему (використовуємо earning.ts)
export const REFERRAL_BONUS = {
  inviter: 10,  // Той хто запросив отримує 10 уцмок
  invitee: 5,   // Новий користувач отримує 5 уцмок
} as const

// Опис платних дій
export const PAID_ACTION_DESCRIPTIONS = {
  partner_search: 'Пошук пари/партнера',
  job_request: 'Заявка на пошук роботи',
  service_request: 'Заявка на послугу',
  employee_search: 'Пошук працівника',
  investor_search: 'Пошук інвестора',
  advanced_search: 'Розширений пошук',
} as const

// Extra cost to promote (additional to base PAID_ACTION_COSTS)
export const PROMO_ACTION_EXTRAS: Record<string, number> = {
  partner_search: 2,
  job_request: 2,
  service_request: 2,
  employee_search: 2,
  investor_search: 2,
  advanced_search: 0,
}

// Generate a short human-friendly referral code
export function generateReferralCode(seed?: string): string {
  const base = (seed || '') + Math.random().toString(36).slice(2)
  return base.replace(/[^a-z0-9]/gi, '').slice(0, 8).toUpperCase()
}

// Ensure a unique referral code for a user
export async function ensureUserReferralCode(userId: number, client?: typeof prisma) {
  const db = client || prisma
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, referralCode: true, firstName: true } })
  if (!user) throw new Error('User not found')
  if (user.referralCode) return user.referralCode

  // Try a few times to avoid collisions
  for (let i = 0; i < 5; i++) {
    const candidate = generateReferralCode(user.firstName || '')
    const exists = await db.user.findFirst({ where: { referralCode: candidate }, select: { id: true } })
    if (!exists) {
      await db.user.update({ where: { id: user.id }, data: { referralCode: candidate } })
      return candidate
    }
  }
  // Fallback
  const fallback = generateReferralCode('U')
  await db.user.update({ where: { id: user.id }, data: { referralCode: fallback } })
  return fallback
}

// Award referral bonuses atomically
export async function awardReferral(opts: { inviterId: number; inviteeId: number; code: string }) {
  const { inviterId, inviteeId, code } = opts
  // Don't allow self or duplicate awards
  const existing = await prisma.referral.findUnique({ where: { inviteeId } })
  if (existing) return existing

  const result = await prisma.$transaction(async (tx: typeof prisma) => {
    const hasLedger = await hasUcmTransactionsTable()
    const hasKind = await hasUcmKindColumn()
    // Create referral record
    const referral = await tx.referral.create({
      data: {
        code,
        inviterId,
        inviteeId,
        bonusInviter: REFERRAL_BONUS.inviter,
        bonusInvitee: REFERRAL_BONUS.invitee,
      }
    })

    // Credit inviter
    await tx.user.update({
      where: { id: inviterId },
      data: { balanceUcm: { increment: REFERRAL_BONUS.inviter } }
    })
    if (hasLedger) {
      const data: any = {
        userId: inviterId,
        amount: REFERRAL_BONUS.inviter,
        reason: 'referral_inviter',
        relatedEntityType: 'referral',
        relatedEntityId: referral.id,
      }
      if (hasKind) data.kind = 'credit'
      await tx.ucmTransaction.create({ data })
    }

    // Credit invitee
    await tx.user.update({
      where: { id: inviteeId },
      data: { balanceUcm: { increment: REFERRAL_BONUS.invitee } }
    })
    if (hasLedger) {
      const data2: any = {
        userId: inviteeId,
        amount: REFERRAL_BONUS.invitee,
        reason: 'referral_invitee',
        relatedEntityType: 'referral',
        relatedEntityId: referral.id,
      }
      if (hasKind) data2.kind = 'credit'
      await tx.ucmTransaction.create({ data: data2 })
    }

    console.log(`[awardReferral] Created referral id=${referral.id} inviter=${inviterId} invitee=${inviteeId} inviterBonus=${REFERRAL_BONUS.inviter} inviteeBonus=${REFERRAL_BONUS.invitee}`);
    return referral
  })

  console.log('[awardReferral] transaction committed', result?.id ? { referralId: result.id } : null);
  return result
}

// Deduct UCM for a paid action and ledger it
export async function chargeForAction(opts: { userId: number; amount: number; reason: string; related?: { type?: string; id?: number } }) {
  const { userId, amount, reason, related } = opts
  if (amount <= 0) return
  const hasLedger = await hasUcmTransactionsTable()
  const hasKind = await hasUcmKindColumn()

  return prisma.$transaction(async (tx: typeof prisma) => {
    const user = await tx.user.findUnique({ where: { id: userId }, select: { balanceUcm: true } as any })
    if (!user) throw new Error('User not found')
    const current = Number((user as any).balanceUcm)
    if (current < amount) {
      console.error(`[chargeForAction] Insufficient UCM for user ${userId}: has ${(user as any).balanceUcm}, needs ${amount}`)
      throw new Error('INSUFFICIENT_UCM')
    }
    await tx.user.update({ where: { id: userId }, data: { balanceUcm: { decrement: amount } } as any })
    if (hasLedger) {
      const data: any = {
        userId,
        amount,
        reason,
        relatedEntityType: related?.type || null,
        relatedEntityId: related?.id || null,
        meta: {},
      }
      if (hasKind) data.kind = 'debit'
      await (tx as any).ucmTransaction.create({ data })
    }
  })
}

// Нова функція для платних дій з логуванням
export async function chargePaidAction(opts: {
  userId: number
  actionType: keyof typeof PAID_ACTION_COSTS
  relatedEntityType?: string
  relatedEntityId?: number
  description?: string
}) {
  const { userId, actionType, relatedEntityType, relatedEntityId, description } = opts
  const amount = PAID_ACTION_COSTS[actionType]

  try {
    const hasLedger = await hasUcmTransactionsTable()
    const hasKind = await hasUcmKindColumn()

    await prisma.$transaction(async (tx: typeof prisma) => {
      // Перевіряємо баланс
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { balanceUcm: true } as any
      })

      if (!user) {
        throw new Error('Користувача не знайдено')
      }

      const current = Number((user as any).balanceUcm)
      if (current < amount) {
        console.error(`[chargePaidAction] Insufficient UCM for user ${userId}: has ${(user as any).balanceUcm}, needs ${amount}`)
        throw new Error('Недостатньо уцмок на балансі')
      }

      // Списуємо кошти
      await tx.user.update({
        where: { id: userId },
        data: { balanceUcm: { decrement: amount } } as any
      })

      // Створюємо транзакцію
      if (hasLedger) {
        const data: any = {
          userId,
          amount,
          reason: actionType,
          relatedEntityType: relatedEntityType || null,
          relatedEntityId: relatedEntityId || null,
          meta: {},
        }
        if (hasKind) data.kind = 'debit'
        await (tx as any).ucmTransaction.create({ data })
      }

      // Логуємо платну дію
      await tx.paidAction.create({
        data: {
          userId,
          actionType,
          amount,
          relatedEntityType,
          relatedEntityId,
          description: description || PAID_ACTION_DESCRIPTIONS[actionType],
          success: true,
        }
      })
    })

    return { success: true, amount }
  } catch (error: any) {
    // Логуємо невдалу спробу
    await prisma.paidAction.create({
      data: {
        userId,
        actionType,
        amount,
        relatedEntityType,
        relatedEntityId,
        description: description || PAID_ACTION_DESCRIPTIONS[actionType],
        success: false,
        errorMessage: error.message,
      }
    })

    throw error
  }
}