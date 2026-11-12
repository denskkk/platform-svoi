'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { authHeaders, jsonHeaders, readStoredUser } from '@/lib/feedClient';

type Status = 'pending' | 'approved' | 'rejected';
interface Item {
  id: number; companyName: string; activity: string; city: string; contactName: string | null;
  phone: string; website: string | null; description: string; projectSlug: string | null;
  createdAt: string; rejectReason: string | null; proposedRewardPercent: number | null;
  user: { id: number; name: string; email: string };
}

export default function AdminBusinessApplicationsPage() {
  const router = useRouter();
  const { t, formatDate } = useI18n();
  const toast = useToast();
  const [status, setStatus] = useState<Status>('pending');
  const [items, setItems] = useState<Item[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [rejecting, setRejecting] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [percent, setPercent] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async (s: Status, after: number | null) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ status: s });
      if (after) qs.set('cursor', String(after));
      const res = await fetch(`/api/admin/business-applications?${qs}`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
      if (res.status === 401) { router.replace('/auth/login?returnUrl=/admin/business-applications'); return; }
      if (res.status === 403) { setForbidden(true); return; }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems((prev) => (after ? [...prev, ...data.applications] : data.applications));
      setCursor(data.nextCursor);
    } catch {
      toast.error(t('business.admin.failed'));
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    if (!readStoredUser()) { router.replace('/auth/login?returnUrl=/admin/business-applications'); return; }
    load(status, null);
  }, [status, load, router]);

  const moderate = async (id: number, action: 'approve' | 'reject') => {
    if (action === 'reject' && !reason.trim()) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/business-applications/${id}/moderate`, {
        method: 'POST', credentials: 'include', headers: jsonHeaders(),
        body: JSON.stringify({ action, reason: action === 'reject' ? reason.trim() : undefined, rewardPercent: action === 'approve' ? percent[id] : undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error || t('business.admin.failed')); return; }
      setItems((prev) => prev.filter((i) => i.id !== id));
      setRejecting(null);
      setReason('');
      toast.success(t('business.admin.done'));
    } catch {
      toast.error(t('business.admin.failed'));
    } finally {
      setBusy(null);
    }
  };

  if (forbidden) return <div className="mx-auto max-w-xl p-8 text-center text-neutral-600">{t('business.admin.forbidden')}</div>;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto w-full max-w-4xl px-3 sm:px-6 pt-4 pb-28 md:pb-12 space-y-4">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-primary-700">
          <ArrowLeft className="w-4 h-4" /> {t('business.admin.back')}
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{t('business.admin.title')}</h1>
          <p className="text-sm text-neutral-500">{t('business.admin.subtitle')}</p>
        </div>

        <div role="tablist" className="grid grid-cols-3 rounded-full bg-white border border-neutral-200/70 p-1 shadow-sm">
          {(['pending', 'approved', 'rejected'] as Status[]).map((s) => (
            <button key={s} role="tab" type="button" aria-selected={status === s} onClick={() => { setItems([]); setCursor(null); setStatus(s); }}
              className={cn('rounded-full py-2 text-sm font-semibold transition', status === s ? 'bg-primary-500 text-white shadow' : 'text-neutral-600')}>
              {t(`business.admin.${s}`)}
            </button>
          ))}
        </div>

        {!loading && items.length === 0 && <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center text-neutral-600">{t('business.admin.empty')}</div>}

        <ul className="space-y-3">
          {items.map((a) => (
            <li key={a.id} className="bg-white rounded-2xl border border-neutral-200/70 shadow-sm p-4 space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-semibold text-neutral-900">{a.companyName}</h2>
                <span className="text-xs text-neutral-400">{formatDate(a.createdAt)}</span>
              </div>
              <p className="text-sm text-neutral-700">{a.activity} · {a.city}</p>
              <p className="text-xs text-neutral-500">
                {t('business.admin.applicant')}: <Link href={`/profile/${a.user.id}`} className="underline">{a.user.name}</Link> · {a.contactName ? `${a.contactName} · ` : ''}<a href={`tel:${a.phone.replace(/[^+0-9]/g, '')}`} className="underline">{a.phone}</a>
                {a.website && <> · <a href={a.website} target="_blank" rel="noopener noreferrer" className="underline">{a.website}</a></>}
              </p>
              <p className="text-sm text-neutral-700 whitespace-pre-wrap break-words">{a.description}</p>
              {a.rejectReason && <p className="text-xs text-red-600">{t('business.reason')}: {a.rejectReason}</p>}
              {a.proposedRewardPercent !== null && <p className="text-xs text-green-700">{t('business.reward')}: {a.proposedRewardPercent}%</p>}

              {status === 'pending' && rejecting !== a.id && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <input type="number" inputMode="decimal" min={0} max={50} step="0.5" value={percent[a.id] ?? ''} onChange={(e) => setPercent((p) => ({ ...p, [a.id]: e.target.value }))}
                    placeholder={t('business.admin.percent')} aria-label={t('business.admin.percent')} className="w-44 rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
                  <button type="button" disabled={busy === a.id} onClick={() => moderate(a.id, 'approve')} className="rounded-full bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2 disabled:opacity-60">
                    {busy === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : t('business.admin.approve')}
                  </button>
                  <button type="button" onClick={() => { setRejecting(a.id); setReason(''); }} className="rounded-full bg-red-50 hover:bg-red-100 text-red-700 text-sm font-semibold px-5 py-2">{t('business.admin.reject')}</button>
                </div>
              )}
              {rejecting === a.id && (
                <div className="space-y-2">
                  <textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} rows={2} placeholder={t('business.admin.reasonPlaceholder')} className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
                  <div className="flex gap-2">
                    <button type="button" disabled={!reason.trim() || busy === a.id} onClick={() => moderate(a.id, 'reject')} className="rounded-full bg-red-600 text-white text-sm font-semibold px-5 py-2 disabled:opacity-50">{t('business.admin.confirmReject')}</button>
                    <button type="button" onClick={() => setRejecting(null)} className="rounded-full bg-neutral-100 text-sm font-semibold px-5 py-2">{t('business.admin.cancel')}</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>

        {loading && <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}
        {!loading && cursor && <div className="flex justify-center"><button type="button" onClick={() => load(status, cursor)} className="rounded-full bg-white border border-neutral-200 px-6 py-2 text-sm font-semibold">{t('business.admin.loadMore')}</button></div>}
      </div>
    </div>
  );
}
