import { prisma } from './prisma';
import { hasUcmTransactionsTable } from './ucm';

/**
 * Способы заработать уцмки на платформе
 */

export const EARNING_REWARDS = {
  // Реферальная программа
  REFERRAL_INVITER: 10, // За каждого приглашенного
  REFERRAL_INVITEE: 5,  // Бонус новому пользователю
  
  // Активность на платформе
  PROFILE_COMPLETE: 5,        // За заполнение профиля на 100%
  FIRST_SERVICE: 10,          // За добавление первой услуги
  VERIFIED_PHONE: 3,          // За верификацию телефона
  VERIFIED_EMAIL: 3,          // За верификацию email
  ADD_AVATAR: 2,              // За добавление аватара
  
  // Взаимодействие
  FIRST_REVIEW_RECEIVED: 5,   // За первый отзыв
  GIVE_REVIEW: 2,             // За оставленный отзыв
  SERVICE_COMPLETED: 15,      // За выполненную услугу (подтверждено обеими сторонами)
  
  // Качество
  HIGH_RATING: 20,            // За достижение рейтинга 4.5+
  TEN_REVIEWS: 25,            // За 10+ положительных отзывов
  
  // Ежедневная активность
  DAILY_LOGIN: 1,             // За ежедневный вход (раз в день)
  WEEKLY_ACTIVE: 5,           // За активность каждый день недели
  
  // Особливые достижения
  BUSINESS_UPGRADE: 50,       // За переход на бізнес-акаунт
  FIRST_MONTH: 10,            // За месяц на платформе
};

export const EARNING_DESCRIPTIONS = {
  REFERRAL_INVITER: 'Запросити друга на платформу',
  REFERRAL_INVITEE: 'Бонус за реєстрацію за запрошенням',
  PROFILE_COMPLETE: 'Заповнити профіль на 100%',
  FIRST_SERVICE: 'Додати першу послугу',
  VERIFIED_PHONE: 'Підтвердити номер телефону',
  VERIFIED_EMAIL: 'Підтвердити email',
  ADD_AVATAR: 'Додати фото профілю',
  FIRST_REVIEW_RECEIVED: 'Отримати перший відгук',
  GIVE_REVIEW: 'Залишити відгук',
  SERVICE_COMPLETED: 'Виконати послугу',
  HIGH_RATING: 'Досягти рейтингу 4.5+',
  TEN_REVIEWS: 'Отримати 10+ відгуків',
  DAILY_LOGIN: 'Щоденний вхід',
  WEEKLY_ACTIVE: 'Активність 7 днів поспіль',
  BUSINESS_UPGRADE: 'Перейти на бізнес-акаунт',
  FIRST_MONTH: 'Місяць на платформі',
};

/**
 * Начислить уцмки пользователю за определенное действие
 */
export async function awardUcmForAction(
  userId: number,
  action: keyof typeof EARNING_REWARDS,
  metadata?: Record<string, any>
) {
  const amount = EARNING_REWARDS[action];
  const description = EARNING_DESCRIPTIONS[action];

  if (!amount || amount <= 0) {
    console.warn(`[awardUcmForAction] Invalid amount for action ${action}`);
    return null;
  }

  try {
    // Проверяем, не было ли уже начислено за это действие (для уникальных)
    const uniqueActions = [
      'PROFILE_COMPLETE',
      'FIRST_SERVICE',
      'VERIFIED_PHONE',
      'VERIFIED_EMAIL',
      'ADD_AVATAR',
      'FIRST_REVIEW_RECEIVED',
      'HIGH_RATING',
      'TEN_REVIEWS',
      'BUSINESS_UPGRADE',
      'FIRST_MONTH'
    ];

    if (uniqueActions.includes(action)) {
      const existing = await prisma.ucmTransaction.findFirst({
        where: {
          userId,
          reason: description,
          kind: 'credit'
        }
      });

      if (existing) {
        console.log(`[awardUcmForAction] User ${userId} already received reward for ${action}`);
        return null;
      }
    }

    // Для ежедневного входа проверяем последнее начисление
    if (action === 'DAILY_LOGIN') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayReward = await prisma.ucmTransaction.findFirst({
        where: {
          userId,
          reason: description,
          kind: 'credit',
          createdAt: {
            gte: today
          }
        }
      });

      if (todayReward) {
        console.log(`[awardUcmForAction] User ${userId} already received daily login reward today`);
        return null;
      }
    }

    // Начисляем уцмки
    const hasLedger = await hasUcmTransactionsTable();
    if (hasLedger) {
      await prisma.$transaction([
        // Увеличиваем баланс
        prisma.user.update({
          where: { id: userId },
          data: {
            balanceUcm: {
              increment: amount
            }
          }
        }),
        // Создаем транзакцию
        prisma.ucmTransaction.create({
          data: {
            userId,
            kind: 'credit',
            amount,
            reason: description,
            relatedEntityType: 'earning',
            relatedEntityId: userId,
            metadata: metadata ? JSON.stringify(metadata) : null
          }
        })
      ]);
    } else {
      // Ledger table missing — just update balance
      await prisma.user.update({ where: { id: userId }, data: { balanceUcm: { increment: amount } } });
    }

    console.log(`[awardUcmForAction] Awarded ${amount} ucm to user ${userId} for ${action}`);
    
    return {
      amount,
      action,
      description
    };
  } catch (error) {
    console.error(`[awardUcmForAction] Error awarding ucm:`, error);
    throw error;
  }
}

/**
 * Проверить и начислить бонус за заполненность профиля
 */
export async function checkProfileCompletion(userId: number) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        businessInfo: true
      }
    });

    if (!user) return;

    // Считаем процент заполненности
    const fields = [
      user.firstName,
      user.lastName,
      user.phone,
      user.email,
      user.city,
      user.avatarUrl,
      user.bio,
      user.profession,
      user.educationLevel,
      user.employmentStatus
    ];

    const filledFields = fields.filter(f => f && f.toString().trim().length > 0).length;
    const completionPercent = (filledFields / fields.length) * 100;

    if (completionPercent >= 100) {
      await awardUcmForAction(userId, 'PROFILE_COMPLETE');
    }
  } catch (error) {
    console.error('[checkProfileCompletion] Error:', error);
  }
}

/**
 * Проверить и начислить бонус за рейтинг
 */
export async function checkRatingAchievement(userId: number) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        avgRating: true,
        totalReviews: true
      }
    });

    if (!user) return;

    // Бонус за высокий рейтинг
    if (user.avgRating >= 4.5 && user.totalReviews >= 5) {
      await awardUcmForAction(userId, 'HIGH_RATING');
    }

    // Бонус за 10 отзывов
    if (user.totalReviews >= 10) {
      await awardUcmForAction(userId, 'TEN_REVIEWS');
    }
  } catch (error) {
    console.error('[checkRatingAchievement] Error:', error);
  }
}

/**
 * Проверить и начислить бонус за месяц на платформе
 */
export async function checkFirstMonthAchievement(userId: number) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        createdAt: true
      }
    });

    if (!user) return;

    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    if (user.createdAt <= monthAgo) {
      await awardUcmForAction(userId, 'FIRST_MONTH');
    }
  } catch (error) {
    console.error('[checkFirstMonthAchievement] Error:', error);
  }
}

/**
 * Получить список всех способов заработать с прогрессом пользователя
 */
export async function getUserEarningProgress(userId: number) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        services: true,
        reviewsReceived: true,
        reviewsGiven: true,
        businessInfo: true
      }
    });

    // Если пользователь не найден – возвращаем базовый список задач с нулевым прогрессом
    // чтобы UI всегда имел структуры задач
    if (!user) {
      return Object.entries(EARNING_REWARDS).map(([action, amount]) => ({
        action,
        description: EARNING_DESCRIPTIONS[action as keyof typeof EARNING_DESCRIPTIONS],
        amount,
        completed: false,
        canEarn: false,
        progress: 0,
        progressMax: 1,
        isRepeatable: ['DAILY_LOGIN', 'GIVE_REVIEW', 'SERVICE_COMPLETED'].includes(action)
      }));
    }

    let transactions: any[] = [];
    const hasLedger = await hasUcmTransactionsTable();
    if (hasLedger) {
      transactions = await prisma.ucmTransaction.findMany({
        where: {
          userId,
          kind: 'credit'
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } else {
      transactions = [];
    }

    // Тип для транзакции (минимально необходимое поле)
    interface CreditTx { reason: string; }

    const earnedActions = new Set<string>(
      (transactions as CreditTx[]) // приводим к интерфейсу
        .map((t: CreditTx) => {
          const match = Object.entries(EARNING_DESCRIPTIONS).find(([_key, desc]) => desc === t.reason);
          return match ? match[0] : undefined;
        })
        .filter((v): v is string => Boolean(v))
    );

    const progress = Object.entries(EARNING_REWARDS).map(([action, amount]) => {
      const completed = earnedActions.has(action);
      let canEarn = true;
      let progress = 0;
      let progressMax = 1;
      let missingFields: string[] | undefined;

      // Определяем возможность заработать и прогресс
      switch (action) {
        case 'PROFILE_COMPLETE':
          const fieldMap: [string, any][] = [
            ['Імʼя', user.firstName],
            ['Прізвище', user.lastName],
            ['Телефон', user.phone],
            ['Email', user.email],
            ['Місто', user.city],
            ['Аватар', user.avatarUrl],
            ['Опис', user.bio],
            ['Професія', user.profession],
            ['Освіта', user.educationLevel],
            ['Статус працевлаштування', user.employmentStatus]
          ];
          progress = fieldMap.filter(([, v]) => v && v.toString().trim().length > 0).length;
          progressMax = fieldMap.length;
          missingFields = fieldMap.filter(([, v]) => !v || v.toString().trim().length === 0).map(([label]) => label);
          break;
        
        case 'FIRST_SERVICE':
          progress = user.services.length > 0 ? 1 : 0;
          break;
        
        case 'ADD_AVATAR':
          progress = user.avatarUrl ? 1 : 0;
          break;
        
        case 'FIRST_REVIEW_RECEIVED':
          progress = user.reviewsReceived.length > 0 ? 1 : 0;
          break;
        
        case 'HIGH_RATING':
          progress = user.avgRating >= 4.5 && user.totalReviews >= 5 ? 1 : 0;
          progressMax = 1;
          break;
        
        case 'TEN_REVIEWS':
          progress = user.totalReviews;
          progressMax = 10;
          break;
        
        case 'BUSINESS_UPGRADE':
          progress = user.accountType === 'business' ? 1 : 0;
          break;
      }

      return {
        action,
        description: EARNING_DESCRIPTIONS[action as keyof typeof EARNING_DESCRIPTIONS],
        amount,
        completed,
        canEarn,
        progress,
        progressMax,
        isRepeatable: ['DAILY_LOGIN', 'GIVE_REVIEW', 'SERVICE_COMPLETED'].includes(action),
        ...(missingFields ? { missingFields } : {})
      };
    });

    return progress;
  } catch (error) {
    console.error('[getUserEarningProgress] Error:', error);
    return [];
  }
}
