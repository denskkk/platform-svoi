'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BadgeCheck, Loader2, Plus, Store } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { useI18n } from '@/i18n/client';
import { authHeaders, readStoredUser } from '@/lib/feedClient';
import { BusinessRequired } from './BusinessRequired';
import { ListingCard } from './ListingCard';
import type { ListingCardData } from './helpers';

interface Biz { id: number; name: string; logoUrl: string | null; isVerified: boolean; count: number; city: string | null }

/**
 * Відділ «Крамниці» за ТЗ веде до бізнес-кабінетів, а не до загальної стрічки товарів.
 * Натискання на кабінет показує його товари у цьому відділі та посилання на профіль.
 */
export function BusinessDirectory({ slug, sectionId }: { slug: string; sectionId: string }) {
  const { t } = useI18n();
  const user = readStoredUser();
  const [items, setItems] = useState<Biz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState<Biz | null>(null);
  const [goods, setGoods] = useState<ListingCardData[]>([]);
  const [goodsLoading, setGoodsLoading] = useState(false);

  useEffect(() => {
    let off = false;
    setLoading(true);
    fetch(`/api/listings/businesses?project=${slug}&f_section=${encodeURIComponent(sectionId)}`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => { if (!off) { setItems(d.businesses); setError(false); } })
      .catch(() => { if (!off) setError(true); })
      .finally(() => { if (!off) setLoading(false); });
    return () => { off = true; };
  }, [slug, sectionId]);

  const show = (b: Biz) => {
    setOpen(b); setGoods([]); setGoodsLoading(true);
    fetch(`/api/listings?project=${slug}&f_section=${encodeURIComponent(sectionId)}&ownerId=${b.id}`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setGoods(d.listings || []))
      .catch(() => setGoods([]))
      .finally(() => setGoodsLoading(false));
  };

  const postHref = `/projects/${slug}/new?section=${encodeURIComponent(sectionId)}`;
  const needBusiness = !!user && user.accountType !== 'business';

  if (open) {
    return (
      <div className="space-y-3">
        <button type="button" onClick={() => setOpen(null)} className="inline-flex items-center gap-2 rounded-full bg-white shadow-sm text-sm font-semibold text-neutral-800 px-3.5 py-2">
          <ArrowLeft className="w-4 h-4" /> {t('listings.directory.back')}
        </button>
        <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between gap-3">
          <h2 className="font-bold text-neutral-900 truncate">{open.name}</h2>
          <Link href={`/profile/${open.id}`} className="shrink-0 rounded-full bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2">{t('listings.directory.profile')}</Link>
        </div>
        {goodsLoading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div> : (
          <div className="grid grid-cols-2 gap-3">
            {goods.map((l) => <ListingCard key={l.id} listing={l} canSave={!!user && user.accountType !== 'viewer'} onSavedChange={(id, saved) => setGoods((p) => p.map((x) => (x.id === id ? { ...x, saved } : x)))} />)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {needBusiness
        ? <BusinessRequired returnUrl={postHref} />
        : user && user.accountType === 'business' && (
          <Link href={postHref} className="inline-flex items-center gap-2 rounded-full bg-primary-500 hover:bg-primary-600 text-white font-semibold px-5 py-2.5"><Plus className="w-4 h-4" />{t('listings.directory.add')}</Link>
        )}
      {loading ? (
        <div className="space-y-2" aria-hidden>{[0, 1, 2].map((i) => <div key={i} className="h-20 rounded-2xl bg-white animate-pulse" />)}</div>
      ) : error ? (
        <EmptyState icon={Store} title={t('listings.common.loadFailed')} description="" />
      ) : items.length === 0 ? (
        <EmptyState icon={Store} title={t('listings.directory.empty')} description={t('listings.directory.emptyHint')} />
      ) : (
        <ul className="space-y-2">
          {items.map((b) => (
            <li key={b.id}>
              <button type="button" onClick={() => show(b)} className="w-full bg-white rounded-2xl shadow-sm hover:shadow-md p-3 flex items-center gap-3 text-left transition">
                {b.logoUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={b.logoUrl} alt="" className="h-14 w-14 rounded-xl object-cover bg-neutral-100" />
                  : <span className="h-14 w-14 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center"><Store className="w-6 h-6" /></span>}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 font-semibold text-neutral-900"><span className="truncate">{b.name}</span>{b.isVerified && <BadgeCheck className="w-4 h-4 text-primary-600 shrink-0" />}</span>
                  <span className="block text-xs text-neutral-500">{[b.city, t('listings.directory.count', { count: b.count })].filter(Boolean).join(' · ')}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
