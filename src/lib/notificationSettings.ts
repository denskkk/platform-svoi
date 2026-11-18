/** Групи сповіщень, які користувач може вимкнути. Модераційні та системні (схвалення заявок і оголошень) приходять завжди. */

import { prisma } from '@/lib/prisma';

export const MUTABLE_GROUPS: Record<string, string[]> = {
  social: ['post_like', 'post_comment', 'new_follower'],
  messages: ['new_message'],
  deals: ['deal_new', 'deal_confirmed', 'deal_accrued', 'deal_paid_out', 'deal_rejected', 'deal_disputed'],
  reviews: ['new_review'],
  requests: ['service_request_new', 'service_request_accepted', 'service_request_completed', 'request_response_new'],
};

export async function getMutedGroups(userId: number): Promise<string[]> {
  try {
    const row = await prisma.notificationSetting.findUnique({ where: { userId }, select: { mutedGroups: true } });
    return (row?.mutedGroups || '').split(',').filter((g: string) => g in MUTABLE_GROUPS);
  } catch {
    return []; // таблиці ще немає — показуємо все
  }
}

export async function mutedTypes(userId: number): Promise<string[]> {
  const groups = await getMutedGroups(userId);
  return groups.flatMap((g) => MUTABLE_GROUPS[g]);
}
