'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, ShoppingBag } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { useI18n } from '@/i18n/client';
import { authHeaders } from '@/lib/feedClient';
import { ListingCard } from '@/components/listings/ListingCard';
import type { ListingCardData } from '@/components/listings/helpers';

/** Вкладка «Товари/Послуги»: свіжі оголошення з усіх проєктів платформи. */
export function MarketFeed({ canSave }: { canSave: boolean }) {
  const { t } = useI18n();
  const [items, setItems] = useState<ListingCardData[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async (after: number | null) => {
    try {
      const qs = new URLSearchParams({ all: '1' });
      if (after) qs.set('cursor', String(after));
      const res = await fetch(`/api/listings?${qs}`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems((prev) => (after ? [...prev, ...data.listings] : data.listings));
      setCursor(data.nextCursor ?? null);
      setError(false);
    } catch { setError(true); } finally { setLoading(false); setMore(false); }
  }, []);

  useEffect(() => { load(null); }, [load]);

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>;
  if (error && items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.12)] p-6 text-center space-y-3">
        <p className="text-sm text-red-600">{t('listings.common.loadFailed')}</p>
        <button type="button" onClick={() => { setLoading(true); load(null); }} className="rounded-full bg-primary-500 text-white text-sm font-semibold px-5 py-2">{t('feed.retry')}</button>
      </div>
    );
  }
  if (items.length === 0) {
    return <EmptyState icon={ShoppingBag} title={t('feed.market.empty')} description={t('feed.market.emptyHint')} actionLabel={t('feed.market.projects')} actionHref="/projects" />;
  }
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {items.map((l) => (
          <ListingCard key={l.id} listing={l} canSave={canSave} onSavedChange={(id, saved) => setItems((prev) => prev.map((x) => (x.id === id ? { ...x, saved } : x)))} />
        ))}
      </div>
      {cursor && (
        <button type="button" disabled={more} onClick={() => { setMore(true); load(cursor); }} className="w-full rounded-lg bg-white shadow-sm py-2.5 text-sm font-semibold text-primary-700 inline-flex items-center justify-center gap-2">
          {more && <Loader2 className="w-4 h-4 animate-spin" />}{t('clubs.loadMore')}
        </button>
      )}
      <Link href="/projects" className="block text-center text-sm font-semibold text-primary-700 py-2">{t('feed.market.projects')}</Link>
    </div>
  );
}
