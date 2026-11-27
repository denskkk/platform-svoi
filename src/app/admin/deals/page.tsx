'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { DealRow, DealStatus, useMoney } from '@/components/deals/DealStatus';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { authHeaders, jsonHeaders, readStoredUser } from '@/lib/feedClient';
import { askConfirm } from '@/components/ui/ConfirmHost';

interface Program { businessUserId: number; name: string; percent: number; status: string; contractRef: string | null }
interface Candidate { businessUserId: number; name: string; approvedPercent: number | null; offeredPercent: number | null; offeredTerms: string | null }

const STATUS_FILTERS = ['', 'lead_created', 'customer_applied', 'confirmed', 'accrued', 'paid_out', 'disputed', 'rejected'];

export default function AdminDealsPage() {
  const router = useRouter();
  const { t, formatDate } = useI18n();
  const toast = useToast();
  const money = useMoney();
  const [tab, setTab] = useState<'deals' | 'programs'>('deals');
  const [status, setStatus] = useState('');
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [form, setForm] = useState<Record<number, { percent: string; contractRef: string }>>({});
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const loadDeals = useCallback(async (after: number | null) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (status) qs.set('status', status);
      if (after) qs.set('cursor', String(after));
      const res = await fetch(`/api/admin/deals?${qs}`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
      if (res.status === 401) { router.replace('/auth/login?returnUrl=/admin/deals'); return; }
      if (res.status === 403) { setForbidden(true); return; }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDeals((prev) => (after ? [...prev, ...data.deals] : data.deals));
      setCursor(data.nextCursor ?? null);
    } catch { toast.error(t('deals.loadFailed')); } finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, router]);

  const loadPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/referral-programs', { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
      if (res.status === 403) { setForbidden(true); return; }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPrograms(data.programs); setCandidates(data.candidates);
    } catch { toast.error(t('deals.loadFailed')); } finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!readStoredUser()) { router.replace('/auth/login?returnUrl=/admin/deals'); return; }
    if (tab === 'deals') loadDeals(null); else loadPrograms();
  }, [tab, loadDeals, loadPrograms, router]);

  const dealAction = async (id: number, action: string) => {
    setBusy(`d${id}`);
    try {
      const res = await fetch(`/api/admin/deals/${id}/action`, { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ action }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      toast.success(t('deals.done'));
      await loadDeals(null);
    } catch (e: any) { toast.error(e?.message || t('feed.toast.actionFailed')); } finally { setBusy(null); }
  };

  const programAction = async (businessUserId: number, action: string, f?: { percent: string; contractRef: string }) => {
    setBusy(`p${businessUserId}`);
    try {
      const res = await fetch('/api/admin/referral-programs', { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ businessUserId, action, percent: f?.percent, contractRef: f?.contractRef }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      toast.success(t('deals.done'));
      await loadPrograms();
    } catch (e: any) { toast.error(e?.message || t('feed.toast.actionFailed')); } finally { setBusy(null); }
  };

  if (forbidden) return <div className="mx-auto max-w-xl p-8 text-center text-neutral-600">{t('deals.admin.forbidden')}</div>;

  const btn = 'rounded-full text-sm font-semibold px-4 py-1.5 disabled:opacity-50';
  const input = 'rounded-xl border border-neutral-300 px-3 py-2 text-sm';

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto w-full max-w-4xl px-3 sm:px-6 pt-4 pb-28 md:pb-12 space-y-4">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-primary-700"><ArrowLeft className="w-4 h-4" />{t('business.admin.back')}</Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{t('deals.admin.title')}</h1>
          <p className="text-sm text-neutral-500">{t('deals.admin.subtitle')}</p>
        </div>

        <div role="tablist" className="grid grid-cols-2 rounded-full bg-white border border-neutral-200/70 p-1 shadow-sm">
          {(['deals', 'programs'] as const).map((k) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cn('rounded-full py-2 text-sm font-semibold transition', tab === k ? 'bg-primary-500 text-white shadow' : 'text-neutral-600')}>{t(`deals.admin.tabs.${k}`)}</button>
          ))}
        </div>

        {loading && <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}

        {tab === 'deals' && (
          <>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {STATUS_FILTERS.map((s) => (
                <button key={s || 'all'} type="button" onClick={() => { setDeals([]); setStatus(s); }} aria-pressed={status === s}
                  className={cn('whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium border', status === s ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-neutral-700 border-neutral-200')}>
                  {s ? t(`deals.status.${s}`) : t('deals.admin.all')}
                </button>
              ))}
            </div>
            {!loading && deals.length === 0 && <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center text-neutral-600">{t('deals.admin.empty')}</div>}
            <ul className="space-y-3">
              {deals.map((d) => (
                <li key={d.id} className="bg-white rounded-2xl border border-neutral-200/70 shadow-sm p-4 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-semibold text-neutral-900">#{d.id} · {d.business.name}</h2>
                    <DealStatus status={d.status} />
                  </div>
                  <p className="text-sm text-neutral-700">{t('deals.referredBy')}: <Link href={`/profile/${d.referrer.id}`} className="underline">{d.referrer.name}</Link> ({d.referrer.email}) · {t('deals.client')}: {d.source === 'lead' ? `${d.customerName} ${d.customerContact ?? ''}` : d.customer?.name}</p>
                  <p className="text-xs text-neutral-500">{formatDate(d.createdAt)} · {t('deals.percent')}: {d.percent}% · {t('deals.amount')}: {money(d.amount, d.currency)} · {t('deals.reward')}: {money(d.commission, d.currency)}</p>
                  {d.disputeReason && <p className="text-xs text-amber-800">{t('deals.disputeReason')}: {d.disputeReason}</p>}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {d.status === 'confirmed' && <button type="button" disabled={busy === `d${d.id}`} onClick={() => dealAction(d.id, 'accrue')} className={cn(btn, 'bg-green-600 text-white hover:bg-green-700')}>{t('deals.admin.accrue')}</button>}
                    {d.status === 'accrued' && <button type="button" disabled={busy === `d${d.id}`} onClick={async () => { if (await askConfirm(t('deals.admin.payoutConfirm'))) dealAction(d.id, 'payout'); }} className={cn(btn, 'bg-emerald-700 text-white hover:bg-emerald-800')}>{t('deals.admin.payout')}</button>}
                    {d.status === 'disputed' && <button type="button" disabled={busy === `d${d.id}`} onClick={() => dealAction(d.id, 'restore')} className={cn(btn, 'bg-primary-500 text-white hover:bg-primary-600')}>{t('deals.admin.restore')}</button>}
                    {d.status !== 'paid_out' && d.status !== 'rejected' && <button type="button" disabled={busy === `d${d.id}`} onClick={async () => { if (await askConfirm(t('deals.admin.rejectConfirm'))) dealAction(d.id, 'reject'); }} className={cn(btn, 'bg-red-50 text-red-700 hover:bg-red-100')}>{t('deals.clients.reject')}</button>}
                  </div>
                </li>
              ))}
            </ul>
            {!loading && cursor && <button type="button" onClick={() => loadDeals(cursor)} className="w-full rounded-lg bg-white border border-neutral-200 py-2.5 text-sm font-semibold">{t('deals.loadMore')}</button>}
          </>
        )}

        {tab === 'programs' && !loading && (
          <>
            <h2 className="font-semibold text-neutral-900">{t('deals.admin.candidates')}</h2>
            {candidates.length === 0 && <p className="text-sm text-neutral-500">{t('deals.admin.noCandidates')}</p>}
            <ul className="space-y-3">
              {candidates.map((c) => {
                const f = form[c.businessUserId] ?? { percent: c.approvedPercent !== null ? String(c.approvedPercent) : '', contractRef: '' };
                const set = (k: 'percent' | 'contractRef', v: string) => setForm((all) => ({ ...all, [c.businessUserId]: { ...f, [k]: v } }));
                return (
                  <li key={c.businessUserId} className="bg-white rounded-2xl border border-neutral-200/70 shadow-sm p-4 space-y-2">
                    <h3 className="font-semibold text-neutral-900">{c.name}</h3>
                    <p className="text-xs text-neutral-500">{t('business.offeredByBusiness')}: {c.offeredPercent !== null ? `${c.offeredPercent}%` : '—'} {c.offeredTerms || ''}</p>
                    <div className="flex flex-wrap gap-2">
                      <input type="number" min={0.5} max={50} step="0.5" value={f.percent} onChange={(e) => set('percent', e.target.value)} placeholder={t('deals.admin.percent')} aria-label={t('deals.admin.percent')} className={cn(input, 'w-36')} />
                      <input value={f.contractRef} onChange={(e) => set('contractRef', e.target.value)} placeholder={t('deals.admin.contract')} aria-label={t('deals.admin.contract')} maxLength={100} className={cn(input, 'flex-1 min-w-[10rem]')} />
                      <button type="button" disabled={busy === `p${c.businessUserId}` || !(Number(f.percent) > 0) || !f.contractRef.trim()} onClick={() => programAction(c.businessUserId, 'activate', f)} className={cn(btn, 'bg-green-600 text-white hover:bg-green-700')}>{t('deals.admin.activate')}</button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <h2 className="font-semibold text-neutral-900 pt-2">{t('deals.admin.programs')}</h2>
            {programs.length === 0 && <p className="text-sm text-neutral-500">{t('deals.admin.noPrograms')}</p>}
            <ul className="space-y-2">
              {programs.map((p) => (
                <li key={p.businessUserId} className="bg-white rounded-2xl border border-neutral-200/70 shadow-sm p-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-neutral-900">{p.name}</p>
                    <p className="text-xs text-neutral-500">{p.percent}% · {p.contractRef} · {t(`deals.admin.programStatus.${p.status}`)}</p>
                  </div>
                  <button type="button" disabled={busy === `p${p.businessUserId}`} onClick={() => programAction(p.businessUserId, p.status === 'active' ? 'pause' : 'resume')} className={cn(btn, 'bg-neutral-100 hover:bg-neutral-200')}>{p.status === 'active' ? t('deals.admin.pause') : t('deals.admin.resume')}</button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
