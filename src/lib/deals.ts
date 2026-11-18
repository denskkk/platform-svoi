/**
 * Реферальні угоди: статуси, переходи, розрахунок винагороди.
 * Система лише веде облік. Сума й відсоток після підтвердження не змінюються,
 * кожен перехід статусу виконується атомарно (updateMany з умовою на поточний статус).
 */

import { prisma } from '@/lib/prisma';

export const DEAL_STATUSES = ['lead_created', 'customer_applied', 'confirmed', 'accrued', 'paid_out', 'rejected', 'disputed'] as const;
export type DealStatus = (typeof DEAL_STATUSES)[number];

/** Статуси, у яких бізнес може підтвердити/відхилити, а сторони — відкрити спір. */
export const OPEN_STATUSES: DealStatus[] = ['lead_created', 'customer_applied'];
export const DISPUTABLE: DealStatus[] = ['lead_created', 'customer_applied', 'confirmed'];

export const MAX_DEAL_AMOUNT = 100_000_000;

/** Винагорода = сума × відсоток / 100, округлення до копійок (у копійках, без похибок float). */
export function calcCommission(amount: number, percent: number): number {
  const cents = Math.round(amount * 100);
  const pctHundredths = Math.round(percent * 100); // відсотки в сотих
  return Math.round((cents * pctHundredths) / 10000) / 100;
}

export function serializeDeal(d: any) {
  const num = (v: any) => (v === null || v === undefined ? null : Number(v));
  return {
    id: d.id,
    status: d.status,
    source: d.source,
    percent: num(d.percent),
    amount: num(d.amount),
    commission: num(d.commission),
    currency: d.currency,
    customerName: d.customerName,
    customerContact: d.customerContact,
    note: d.note,
    disputeReason: d.disputeReason,
    createdAt: d.createdAt,
    confirmedAt: d.confirmedAt,
    accruedAt: d.accruedAt,
    paidOutAt: d.paidOutAt,
  };
}

export type DealNotificationType = 'deal_new' | 'deal_confirmed' | 'deal_accrued' | 'deal_paid_out' | 'deal_rejected' | 'deal_disputed';

const FALLBACK: Record<DealNotificationType, string> = {
  deal_new: 'Нова заявка клієнта', // i18n-ignore
  deal_confirmed: 'Угоду підтверджено', // i18n-ignore
  deal_accrued: 'Винагороду нараховано', // i18n-ignore
  deal_paid_out: 'Винагороду виплачено', // i18n-ignore
  deal_rejected: 'Угоду відхилено', // i18n-ignore
  deal_disputed: 'Відкрито спір за угодою', // i18n-ignore
};

/** Сповіщення про угоду; помилка не ламає основну дію. */
export async function notifyDeal(userId: number, type: DealNotificationType, dealId: number) {
  try {
    await prisma.notification.create({
      data: { userId, type, title: FALLBACK[type], message: '', relatedEntityType: 'deal', relatedEntityId: dealId },
    });
  } catch (error) {
    console.error('Deal notification error:', error);
  }
}
