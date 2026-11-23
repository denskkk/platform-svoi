'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Users } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { DealRow, DealStatus, useMoney } from '@/components/deals/DealStatus';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { authHeaders, jsonHeaders, readStoredUser } from '@/lib/feedClient';

export default function BusinessClientsPage() {
  const router = useRouter();
  const { t, formatDate } = useI18n();
  const toast = useToast();
  const money = useMoney();
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [amount, setAmount] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);
  const [reasonFor, setReasonFor] = useState<{ id: number; kind: 'reject' | 'dispute' } | null>(null);
  const [reason, setReason] = useState('');

  const load = useCallback(async (after: number | null) => {
    try {
      const qs = new URLSearchParams({ role: 'business' });
      if (after) qs.set('cursor', String(after));
      const res = await fetch(`/api/deals?${qs}`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
      if (res.status === 401) { router.replace('/auth/login?returnUrl=/business/clients'); return; }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDeals((prev) => (after ? [...prev, ...data.deals] : data.deals));
      setCursor(data.nextCursor ?? null);
      setError(false);
    } catch { setError(true); } finally { setLoading(false); }
  }, [router]);

  useEffect(() => {
    if (!readStoredUser()) { router.replace('/auth/login?returnUrl=/business/clients'); return; }
    load(null);
  }, [load, router]);

  const act = async (id: number, body: Record<string, unknown>) => {
    setBusy(id);
    try {
      const res = await fetch(`/api/deals/${id}/action`, { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      setReasonFor(null); setReason('');
      toast.success(t('deals.done'));
      await load(null);
    } catch (e: any) { toast.error(e?.message || t('feed.toast.actionFailed')); } finally { setBusy(null); }
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 space-y-3 pb-28 md:pb-10">
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2"><Users className="w-6 h-6 text-primary-600" />{t('deals.clients.title')}</h1>
        <p className="text-sm text-neutral-500">{t('deals.clients.note')}</p>

        {loading && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}
        {!loading && error && <EmptyState icon={Users} title={t('deals.loadFailed')} description="" />}
        {!loading && !error && deals.length === 0 && <EmptyState icon={Users} title={t('deals.clients.empty')} description={t('deals.clients.emptyHint')} />}

        <ul className="space-y-2">
          {deals.map((d) => {
            const open = d.status === 'lead_created' || d.status === 'customer_applied';
            return (
              <li key={d.id} className="bg-white rounded-2xl shadow-sm p-4 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-neutral-900">{d.source === 'lead' ? d.customerName : d.customer?.name}</p>
                  <DealStatus status={d.status} />
                </div>
                {d.source === 'lead' && d.customerContact && <p className="text-sm text-neutral-600">{d.customerContact}</p>}
                {d.source === 'link' && d.customer && <Link href={`/profile/${d.customer.id}`} className="text-sm text-primary-600 hover:underline">{t('deals.openProfile')}</Link>}
                {d.note && <p className="text-sm text-neutral-600 whitespace-pre-wrap break-words">{d.note}</p>}
                <p className="text-xs text-neutral-500">{t('deals.referredBy')}: {d.referrer.name} · {formatDate(d.createdAt)} · {t('deals.percent')}: {d.percent}%
                  {d.amount !== null && <> · {t('deals.amount')}: {money(d.amount, d.currency)} · {t('deals.reward')}: {money(d.commission, d.currency)}</>}</p>
                {d.disputeReason && <p className="text-xs text-amber-800">{t('deals.disputeReason')}: {d.disputeReason}</p>}

                {open && !reasonFor && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <input type="number" inputMode="decimal" min={1} step="0.01" value={amount[d.id] ?? ''} onChange={(e) => setAmount((a) => ({ ...a, [d.id]: e.target.value }))} placeholder={t('deals.clients.amountPlaceholder')} aria-label={t('deals.clients.amountPlaceholder')} className="w-44 rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
                    <button type="button" disabled={busy === d.id || !(Number(amount[d.id]) > 0)} onClick={() => act(d.id, { action: 'confirm', amount: Number(amount[d.id]) })} className="rounded-full bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 disabled:opacity-50">{t('deals.clients.confirm')}</button>
                    <button type="button" onClick={() => { setReasonFor({ id: d.id, kind: 'reject' }); setReason(''); }} className="rounded-full bg-red-50 text-red-700 hover:bg-red-100 text-sm font-semibold px-4 py-2">{t('deals.clients.reject')}</button>
                  </div>
                )}
                {(open || d.status === 'confirmed') && !reasonFor && (
                  <button type="button" onClick={() => { setReasonFor({ id: d.id, kind: 'dispute' }); setReason(''); }} className="text-xs font-semibold text-amber-800 hover:underline">{t('deals.dispute')}</button>
                )}
                {reasonFor?.id === d.id && (
                  <div className="space-y-2 pt-1">
                    <textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} rows={2} placeholder={reasonFor.kind === 'reject' ? t('deals.clients.rejectPlaceholder') : t('deals.disputePlaceholder')} className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
                    <div className="flex gap-2">
                      <button type="button" disabled={busy === d.id || (reasonFor.kind === 'dispute' && reason.trim().length < 5)} onClick={() => act(d.id, { action: reasonFor.kind, reason: reason.trim() })} className="rounded-full bg-red-600 text-white text-sm font-semibold px-4 py-1.5 disabled:opacity-50">{t('deals.submit')}</button>
                      <button type="button" onClick={() => setReasonFor(null)} className="rounded-full bg-neutral-100 text-sm font-semibold px-4 py-1.5">{t('deals.cancel')}</button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        {cursor && <button type="button" onClick={() => load(cursor)} className="w-full rounded-lg bg-white shadow-sm py-2.5 text-sm font-semibold text-primary-700 hover:bg-neutral-50">{t('deals.loadMore')}</button>}
      </div>
    </div>
  );
}
