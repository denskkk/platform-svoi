'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Wallet } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { DealRow, DealStatus, useMoney } from '@/components/deals/DealStatus';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { authHeaders, jsonHeaders, readStoredUser } from '@/lib/feedClient';

interface Summary { customers: number; active: number; successful: number; disputed: number; turnover: number; pendingAccrual: number; awaitingPayout: number; paidOut: number; currency: string }

export default function EarningsPage() {
  const router = useRouter();
  const { t, formatDate } = useI18n();
  const toast = useToast();
  const money = useMoney();
  const [sum, setSum] = useState<Summary | null>(null);
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [disputing, setDisputing] = useState<number | null>(null);
  const [reason, setReason] = useState('');

  const load = useCallback(async (after: number | null) => {
    try {
      const qs = new URLSearchParams({ role: 'referrer' });
      if (after) qs.set('cursor', String(after));
      const [s, d] = await Promise.all([
        after ? Promise.resolve(null) : fetch('/api/earnings', { credentials: 'include', headers: authHeaders(), cache: 'no-store' }),
        fetch(`/api/deals?${qs}`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' }),
      ]);
      if (d.status === 401) { router.replace('/auth/login?returnUrl=/earnings'); return; }
      if (!d.ok || (s && !s.ok)) throw new Error();
      if (s) setSum(await s.json());
      const data = await d.json();
      setDeals((prev) => (after ? [...prev, ...data.deals] : data.deals));
      setCursor(data.nextCursor ?? null);
      setError(false);
    } catch { setError(true); } finally { setLoading(false); }
  }, [router]);

  useEffect(() => {
    if (!readStoredUser()) { router.replace('/auth/login?returnUrl=/earnings'); return; }
    load(null);
  }, [load, router]);

  const dispute = async (id: number) => {
    if (reason.trim().length < 5) return;
    try {
      const res = await fetch(`/api/deals/${id}/action`, { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ action: 'dispute', reason: reason.trim() }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      setDisputing(null); setReason(''); toast.success(t('deals.disputeSent'));
      await load(null);
    } catch (e: any) { toast.error(e?.message || t('feed.toast.actionFailed')); }
  };

  const cards = sum ? [
    { label: t('deals.earnings.customers'), value: String(sum.customers) },
    { label: t('deals.earnings.active'), value: String(sum.active) },
    { label: t('deals.earnings.successful'), value: String(sum.successful) },
    { label: t('deals.earnings.turnover'), value: money(sum.turnover, sum.currency) },
    { label: t('deals.earnings.pendingAccrual'), value: money(sum.pendingAccrual, sum.currency) },
    { label: t('deals.earnings.awaitingPayout'), value: money(sum.awaitingPayout, sum.currency) },
    { label: t('deals.earnings.paidOut'), value: money(sum.paidOut, sum.currency) },
  ] : [];

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 space-y-3 pb-28 md:pb-10">
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2"><Wallet className="w-6 h-6 text-primary-600" />{t('deals.earnings.title')}</h1>
        <p className="text-sm text-neutral-500">{t('deals.earnings.note')}</p>

        {loading && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}
        {!loading && error && <EmptyState icon={Wallet} title={t('deals.loadFailed')} description="" />}

        {!loading && !error && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {cards.map((c) => (
                <div key={c.label} className="bg-white rounded-2xl shadow-sm p-3.5">
                  <p className="text-xs text-neutral-500">{c.label}</p>
                  <p className="text-lg font-bold text-neutral-900 mt-0.5 break-words">{c.value}</p>
                </div>
              ))}
            </div>

            <h2 className="font-semibold text-neutral-900 pt-2">{t('deals.earnings.history')}</h2>
            {deals.length === 0 ? (
              <EmptyState icon={Wallet} title={t('deals.earnings.empty')} description={t('deals.earnings.emptyHint')} actionLabel={t('deals.earnings.findCompanies')} actionHref="/companies" />
            ) : (
              <ul className="space-y-2">
                {deals.map((d) => (
                  <li key={d.id} className="bg-white rounded-2xl shadow-sm p-4 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/companies/${d.business.id}`} className="font-semibold text-neutral-900 hover:underline">{d.business.name}</Link>
                      <DealStatus status={d.status} />
                    </div>
                    <p className="text-sm text-neutral-600">{d.source === 'lead' ? `${t('deals.client')}: ${d.customerName ?? ''}` : `${t('deals.client')}: ${d.customer?.name ?? ''}`}</p>
                    <p className="text-xs text-neutral-500">{formatDate(d.createdAt)} · {t('deals.percent')}: {d.percent}%
                      {d.amount !== null && <> · {t('deals.amount')}: {money(d.amount, d.currency)} · {t('deals.reward')}: {money(d.commission, d.currency)}</>}</p>
                    {d.disputeReason && <p className="text-xs text-amber-800">{t('deals.disputeReason')}: {d.disputeReason}</p>}
                    {['lead_created', 'customer_applied', 'confirmed'].includes(d.status) && disputing !== d.id && (
                      <button type="button" onClick={() => { setDisputing(d.id); setReason(''); }} className="text-xs font-semibold text-amber-800 hover:underline">{t('deals.dispute')}</button>
                    )}
                    {disputing === d.id && (
                      <div className="space-y-2 pt-1">
                        <textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} rows={2} placeholder={t('deals.disputePlaceholder')} className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
                        <div className="flex gap-2">
                          <button type="button" disabled={reason.trim().length < 5} onClick={() => dispute(d.id)} className="rounded-full bg-amber-600 text-white text-sm font-semibold px-4 py-1.5 disabled:opacity-50">{t('deals.disputeSubmit')}</button>
                          <button type="button" onClick={() => setDisputing(null)} className="rounded-full bg-neutral-100 text-sm font-semibold px-4 py-1.5">{t('deals.cancel')}</button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {cursor && <button type="button" onClick={() => load(cursor)} className="w-full rounded-lg bg-white shadow-sm py-2.5 text-sm font-semibold text-primary-700 hover:bg-neutral-50">{t('deals.loadMore')}</button>}
          </>
        )}
      </div>
    </div>
  );
}
