'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { authHeaders, jsonHeaders, readStoredUser } from '@/lib/feedClient';
import { formatPrice } from '@/components/listings/helpers';

type Status = 'pending' | 'approved' | 'rejected';

interface Item {
  id: number;
  projectSlug: string;
  title: string;
  description: string;
  price: number | null;
  currency: string;
  city: string | null;
  createdAt: string;
  rejectReason: string | null;
  images: { id: number; url: string }[];
  owner: { id: number; name: string };
}

export default function AdminListingsPage() {
  const router = useRouter();
  const { t, locale, formatDate } = useI18n();
  const toast = useToast();
  const [status, setStatus] = useState<Status>('pending');
  const [items, setItems] = useState<Item[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [rejecting, setRejecting] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async (s: Status, after: number | null) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ status: s });
      if (after) qs.set('cursor', String(after));
      const res = await fetch(`/api/admin/listings?${qs}`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
      if (res.status === 401) { router.replace('/auth/login?returnUrl=/admin/listings'); return; }
      if (res.status === 403) { setForbidden(true); return; }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems((prev) => (after ? [...prev, ...data.listings] : data.listings));
      setCursor(data.nextCursor);
    } catch {
      toast.error(t('listings.admin.failed'));
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    if (!readStoredUser()) { router.replace('/auth/login?returnUrl=/admin/listings'); return; }
    load(status, null);
  }, [status, load, router]);

  const moderate = async (id: number, action: 'approve' | 'reject') => {
    if (action === 'reject' && !reason.trim()) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/listings/${id}/moderate`, {
        method: 'POST', credentials: 'include', headers: jsonHeaders(),
        body: JSON.stringify({ action, reason: action === 'reject' ? reason.trim() : undefined }),
      });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((i) => i.id !== id));
      setRejecting(null);
      setReason('');
      toast.success(t('listings.admin.done'));
    } catch {
      toast.error(t('listings.admin.failed'));
    } finally {
      setBusy(null);
    }
  };

  if (forbidden) {
    return <div className="mx-auto max-w-xl p-8 text-center text-neutral-600">{t('listings.admin.forbidden')}</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto w-full max-w-4xl px-3 sm:px-6 pt-4 pb-28 md:pb-12 space-y-4">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-primary-700">
          <ArrowLeft className="w-4 h-4" /> {t('listings.admin.back')}
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{t('listings.admin.title')}</h1>
          <p className="text-sm text-neutral-500">{t('listings.admin.subtitle')}</p>
        </div>

        <div role="tablist" className="grid grid-cols-3 rounded-full bg-white border border-neutral-200/70 p-1 shadow-sm">
          {(['pending', 'approved', 'rejected'] as Status[]).map((s) => (
            <button key={s} role="tab" type="button" aria-selected={status === s} onClick={() => { setItems([]); setCursor(null); setStatus(s); }}
              className={cn('rounded-full py-2 text-sm font-semibold transition', status === s ? 'bg-primary-500 text-white shadow' : 'text-neutral-600')}>
              {t(`listings.admin.${s}`)}
            </button>
          ))}
        </div>

        {!loading && items.length === 0 && <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center text-neutral-600">{t('listings.admin.empty')}</div>}

        <ul className="space-y-3">
          {items.map((l) => (
            <li key={l.id} className="bg-white rounded-2xl border border-neutral-200/70 shadow-sm p-3 sm:p-4 space-y-3">
              <div className="flex gap-3">
                <Link href={`/listings/${l.id}`} className="h-24 w-28 shrink-0 rounded-xl bg-neutral-100 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {l.images[0] ? <img src={l.images[0].url} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center text-2xl">📷</span>}
                </Link>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <Link href={`/listings/${l.id}`} className="block font-semibold text-neutral-900 line-clamp-1">{l.title}</Link>
                  <p className="text-sm text-neutral-700">{formatPrice(l.price, l.currency, locale, t)}</p>
                  <p className="text-xs text-neutral-500">{t('listings.admin.project')}: {l.projectSlug} · {t('listings.admin.author')}: <Link href={`/profile/${l.owner.id}`} className="underline">{l.owner.name}</Link></p>
                  <p className="text-xs text-neutral-400">{formatDate(l.createdAt)}{l.city ? ` · ${l.city}` : ''}</p>
                  {l.rejectReason && <p className="text-xs text-red-600">{t('listings.mine.reason')}: {l.rejectReason}</p>}
                </div>
              </div>
              <p className="text-sm text-neutral-700 line-clamp-3 whitespace-pre-wrap">{l.description}</p>

              {status !== 'approved' && rejecting !== l.id && (
                <div className="flex gap-2">
                  {status === 'pending' && (
                    <button type="button" disabled={busy === l.id} onClick={() => moderate(l.id, 'approve')} className="rounded-full bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2 disabled:opacity-60">
                      {busy === l.id ? <Loader2 className="w-4 h-4 animate-spin" /> : t('listings.admin.approve')}
                    </button>
                  )}
                  {status === 'pending' && (
                    <button type="button" onClick={() => { setRejecting(l.id); setReason(''); }} className="rounded-full bg-red-50 hover:bg-red-100 text-red-700 text-sm font-semibold px-5 py-2">{t('listings.admin.reject')}</button>
                  )}
                </div>
              )}

              {rejecting === l.id && (
                <div className="space-y-2">
                  <textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} rows={2} placeholder={t('listings.admin.reasonPlaceholder')} className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
                  <div className="flex gap-2">
                    <button type="button" disabled={!reason.trim() || busy === l.id} onClick={() => moderate(l.id, 'reject')} className="rounded-full bg-red-600 text-white text-sm font-semibold px-5 py-2 disabled:opacity-50">{t('listings.admin.confirmReject')}</button>
                    <button type="button" onClick={() => setRejecting(null)} className="rounded-full bg-neutral-100 text-sm font-semibold px-5 py-2">{t('listings.admin.cancel')}</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>

        {loading && <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}
        {!loading && cursor && (
          <div className="flex justify-center"><button type="button" onClick={() => load(status, cursor)} className="rounded-full bg-white border border-neutral-200 px-6 py-2 text-sm font-semibold">{t('listings.common.loadMore')}</button></div>
        )}
      </div>
    </div>
  );
}
