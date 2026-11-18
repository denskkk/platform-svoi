'use client';

import { useI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';

const STYLE: Record<string, string> = {
  lead_created: 'bg-neutral-100 text-neutral-700',
  customer_applied: 'bg-primary-50 text-primary-800',
  confirmed: 'bg-green-50 text-green-800',
  accrued: 'bg-emerald-100 text-emerald-900',
  paid_out: 'bg-emerald-600 text-white',
  rejected: 'bg-red-50 text-red-700',
  disputed: 'bg-amber-100 text-amber-900',
};

export function DealStatus({ status }: { status: string }) {
  const { t } = useI18n();
  return <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold', STYLE[status] || STYLE.lead_created)}>{t(`deals.status.${status}`)}</span>;
}

export interface DealRow {
  id: number; status: string; source: string; percent: number | null; amount: number | null; commission: number | null; currency: string;
  customerName: string | null; customerContact: string | null; note: string | null; disputeReason: string | null; createdAt: string;
  statusBeforeDispute?: string | null;
  business: { id: number; name: string | null };
  referrer: { id: number; name: string | null; email?: string };
  customer: { id: number; name: string | null } | null;
}

export function useMoney() {
  const { locale } = useI18n();
  return (v: number | null | undefined, currency = 'UAH') =>
    v === null || v === undefined ? '—' : `${new Intl.NumberFormat(locale === 'uk' ? 'uk-UA' : 'en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)} ${currency === 'UAH' ? '₴' : currency}`;
}
