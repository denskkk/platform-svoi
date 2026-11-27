'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n/client';
import { authHeaders } from '@/lib/feedClient';
import { ListingCard } from '@/components/listings/ListingCard';
import type { ListingCardData } from '@/components/listings/helpers';

/** «Дошка оголошень» у стрічці: свіжі оголошення з усіх проєктів, гортаються вбік; «Усе» відкриває вкладку «Товари/Послуги». */
export function ListingsStrip({ canSave, onSeeAll, round = 0 }: { canSave: boolean; onSeeAll: () => void; round?: number }) {
  const { t } = useI18n();
  const [items, setItems] = useState<ListingCardData[]>([]);
  useEffect(() => {
    let off = false;
    fetch('/api/listings?all=1', { credentials: 'include', headers: authHeaders(), cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { if (!off) setItems((d.listings || []).slice(0, 8)); })
      .catch(() => undefined);
    return () => { off = true; };
  }, []);
  if (items.length === 0) return null;
  const shown = Array.from({ length: Math.min(4, items.length) }, (_, i) => items[(round * 3 + i) % items.length]);
  return (
    <section className="space-y-2 rounded-lg bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.12)]" aria-label={t('feed.listingsStrip.title')}>
      <div className="flex items-end justify-between px-0.5">
        <div>
          <h3 className="text-base font-bold text-neutral-900">{t('feed.listingsStrip.title')}</h3>
          <p className="text-xs text-neutral-500">{t('feed.listingsStrip.hint')}</p>
        </div>
        <button type="button" onClick={onSeeAll} className="text-sm font-semibold text-primary-700 hover:underline">{t('feed.recommendations.seeAll')}</button>
      </div>
      <ul className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none]">
        {shown.map((l) => (
          <li key={l.id} className="w-44 shrink-0 snap-start">
            <ListingCard listing={l} canSave={canSave} onSavedChange={(id, saved) => setItems((prev) => prev.map((x) => (x.id === id ? { ...x, saved } : x)))} />
          </li>
        ))}
      </ul>
    </section>
  );
}
