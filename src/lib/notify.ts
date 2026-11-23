/**
 * Сповіщення стрічки. Зберігаємо тип + посилання на сутність; текст на клієнті
 * формується за типом (uk/en), поле title — запасний варіант для старих клієнтів.
 * Помилка сповіщення ніколи не ламає основну дію (лайк, коментар, підписка).
 */

import { prisma } from '@/lib/prisma';
import { isBlockedBetween } from '@/lib/blocks';

export type FeedNotificationType = 'post_like' | 'post_comment' | 'new_follower';

const FALLBACK_TITLES: Record<FeedNotificationType, string> = {
  post_like: 'Вашому допису поставили вподобання', // i18n-ignore
  post_comment: 'Новий коментар до вашого допису', // i18n-ignore
  new_follower: 'У вас новий підписник', // i18n-ignore
};

export async function notifyFeed(params: {
  type: FeedNotificationType;
  recipientId: number;
  actorId: number;
  postId?: number;
  message?: string;
}) {
  const { type, recipientId, actorId, postId, message } = params;
  if (recipientId === actorId) return;
  try {
    if (await isBlockedBetween(recipientId, actorId)) return;
    // Не спамимо: той самий лайк/підписка не дублюється, поки попереднє сповіщення не прочитане
    if (type !== 'post_comment') {
      const duplicate = await prisma.notification.findFirst({
        where: {
          userId: recipientId,
          type,
          relatedUserId: actorId,
          relatedEntityId: postId ?? actorId,
          isRead: false,
        },
        select: { id: true },
      });
      if (duplicate) return;
    }
    await prisma.notification.create({
      data: {
        userId: recipientId,
        type,
        title: FALLBACK_TITLES[type],
        message: message ? message.slice(0, 200) : null,
        relatedUserId: actorId,
        relatedEntityType: postId ? 'post' : 'user',
        relatedEntityId: postId ?? actorId,
      },
    });
  } catch (error) {
    console.error('Feed notification error:', error);
  }
}
