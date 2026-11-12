'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ListingCard } from '@/components/listings/ListingCard';
import { ListingCardData, formatPrice } from '@/components/listings/helpers';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { authHeaders, readStoredUser } from '@/lib/feedClient';

interface Mine extends ListingCardData { rejectReason: string | null; expiresAt: string | null }

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-primary-100 text-primary-900',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  expired: 'bg-neutral-200 text-neutral-700',
};

export default function MyListingsPage() {
  const router = useRouter();
  const { t, locale, formatDate } = useI18n();
  const toast = useToast();
  const [tab, setTab] = useState<'mine' | 'saved'>('mine');
  const [mine, setMine] = useState<Mine[]>([]);
  const [saved, setSaved] = useState<ListingCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([
        fetch('/api/listings/mine', { credentials: 'include', headers: authHeaders(), cache: 'no-store' }),
        fetch('/api/listings?saved=1', { credentials: 'include', headers: authHeaders(), cache: 'no-store' }),
      ]);
      if (a.status === 401) { router.replace('/auth/login?returnUrl=/my-listings'); return; }
      if (a.ok) setMine((await a.json()).listings);
      if (b.ok) setSaved((await b.json()).listings);
    } catch {
      toast.error(t('listings.common.loadFailed'));
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    if (!readStoredUser()) { router.replace('/auth/login?returnUrl=/my-listings'); return; }
    load();
  }, [router, load]);

  const remove = async (id: number) => {
    try {
      const res = await fetch(`/api/listings/${id}`, { method: 'DELETE', credentials: 'include', headers: authHeaders() });
      if (!res.ok) throw new Error();
      setMine((prev) => prev.filter((l) => l.id !== id));
      toast.success(t('listings.mine.deleted'));
    } catch {
      toast.error(t('listings.mine.actionFailed'));
    } finally {
      setConfirmId(null);
    }
  };

  const renew = async (id: number) => {
    try {
      const res = await fetch(`/api/listings/${id}/renew`, { method: 'POST', credentials: 'include', headers: authHeaders() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error();
      setMine((prev) => prev.map((l) => (l.id === id ? { ...l, status: 'approved', expiresAt: data.expiresAt } : l)));
      toast.success(t('listings.mine.renewed'));
    } catch {
      toast.error(t('listings.mine.actionFailed'));
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto w-full max-w-3xl px-3 sm:px-6 pt-4 pb-28 md:pb-12 space-y-4">
        <h1 className="text-2xl font-bold text-neutral-900">{t('listings.mine.title')}</h1>

        <div role="tablist" className="grid grid-cols-2 rounded-full bg-white border border-neutral-200/70 p-1 shadow-sm">
          {(['mine', 'saved'] as const).map((k) => (
            <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => setTab(k)}
              className={cn('rounded-full py-2 text-sm font-semibold transition', tab === k ? 'bg-primary-500 text-white shadow' : 'text-neutral-600')}>
              {k === 'mine' ? t('listings.mine.title') : t('listings.common.savedTitle')}
            </button>
          ))}
        </div>

        {loading && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}

        {!loading && tab === 'mine' && (
          mine.length === 0 ? (
            <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center text-neutral-600">
              <p>{t('listings.mine.empty')}</p>
              <Link href="/projects" className="mt-3 inline-block rounded-full bg-primary-500 text-white font-semibold px-6 py-2">{t('projects.title')}</Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {mine.map((l) => (
                <li key={l.id} className="bg-white rounded-2xl border border-neutral-200/70 shadow-sm p-3 flex gap-3">
                  <Link href={`/listings/${l.id}`} className="h-24 w-28 shrink-0 rounded-xl bg-neutral-100 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {l.thumb ? <img src={l.thumb} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center text-2xl">📷</span>}
                  </Link>
                  <div className="min-w-0 flex-1 space-y-1">
                    <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold', STATUS_STYLE[l.status] || STATUS_STYLE.pending)}>{t(`listings.status.${l.status}`)}</span>
                    <Link href={`/listings/${l.id}`} className="block font-semibold text-neutral-900 line-clamp-1">{l.title}</Link>
                    <p className="text-sm text-neutral-700">{formatPrice(l.price, l.currency, locale, t)}</p>
                    {l.status === 'rejected' && l.rejectReason && <p className="text-xs text-red-600">{t('listings.mine.reason')}: {l.rejectReason}</p>}
                    {l.expiresAt && (l.status === 'approved' || l.status === 'expired') && <p className="text-xs text-neutral-500">{t('listings.mine.expiresOn')}: {formatDate(l.expiresAt)}</p>}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Link href={`/listings/${l.id}/edit`} className="rounded-full bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold px-3 py-1.5">{t('listings.mine.edit')}</Link>
                      {(l.status === 'approved' || l.status === 'expired') && (
                        <button type="button" onClick={() => renew(l.id)} className="rounded-full bg-green-100 hover:bg-green-200 text-green-900 text-xs font-semibold px-3 py-1.5">{t('listings.mine.renew')}</button>
                      )}
                      {confirmId === l.id ? (
                        <>
                          <button type="button" onClick={() => remove(l.id)} className="rounded-full bg-red-600 text-white text-xs font-semibold px-3 py-1.5">{t('listings.mine.delete')}</button>
                          <button type="button" onClick={() => setConfirmId(null)} className="rounded-full bg-neutral-100 text-xs font-semibold px-3 py-1.5">{t('listings.admin.cancel')}</button>
                        </>
                      ) : (
                        <button type="button" onClick={() => setConfirmId(l.id)} className="rounded-full bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold px-3 py-1.5">{t('listings.mine.delete')}</button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )
        )}

        {!loading && tab === 'saved' && (
          saved.length === 0 ? (
            <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center text-neutral-600">{t('listings.common.savedEmpty')}</div>
          ) : (
            <ul className="grid grid-cols-2 gap-3">
              {saved.map((l) => (
                <li key={l.id}>
                  <ListingCard listing={l} canSave onSavedChange={(id, s) => { if (!s) setSaved((prev) => prev.filter((x) => x.id !== id)); }} />
                </li>
              ))}
            </ul>
          )
        )}
      </div>
    </div>
  );
}
