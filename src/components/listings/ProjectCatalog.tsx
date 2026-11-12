'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Loader2, PlusCircle, Search, SlidersHorizontal } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { fieldsFor } from '@/lib/listingFields';
import { authHeaders, readStoredUser } from '@/lib/feedClient';
import { ListingCard } from './ListingCard';
import { ListingCardData } from './helpers';

type Filters = Record<string, string>;

export function ProjectCatalog({ slug }: { slug: string }) {
  const { t } = useI18n();
  const fields = fieldsFor(slug).filter((f) => f.filter);
  const [user, setUser] = useState<ReturnType<typeof readStoredUser>>(null);
  const [draft, setDraft] = useState<Filters>({});
  const [applied, setApplied] = useState<Filters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [items, setItems] = useState<ListingCardData[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setUser(readStoredUser()); }, []);

  const query = useCallback((after: number | null, filters: Filters) => {
    const qs = new URLSearchParams({ project: slug });
    Object.entries(filters).forEach(([k, v]) => { if (v !== '') qs.set(k, v); });
    if (after) qs.set('cursor', String(after));
    return qs.toString();
  }, [slug]);

  const load = useCallback(async (filters: Filters) => {
    const id = ++requestId.current;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/listings?${query(null, filters)}`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (id !== requestId.current) return;
      setItems(data.listings);
      setCursor(data.nextCursor);
    } catch {
      if (id === requestId.current) setError(true);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [query]);

  useEffect(() => { if (user) load(applied); }, [user, applied, load]);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore || loading) return;
    const id = requestId.current;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/listings?${query(cursor, applied)}`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (id !== requestId.current) return;
      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...data.listings.filter((l: ListingCardData) => !seen.has(l.id))];
      });
      setCursor(data.nextCursor);
    } catch {
      setError(true);
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, loadingMore, loading, query, applied]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver((e) => { if (e[0]?.isIntersecting) loadMore(); }, { rootMargin: '600px 0px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  const set = (k: string, v: string) => setDraft((d) => ({ ...d, [k]: v }));
  const apply = (e?: React.FormEvent) => { e?.preventDefault(); setApplied({ ...draft }); };
  const reset = () => { setDraft({}); setApplied({}); };
  const onSavedChange = useCallback((id: number, saved: boolean) => setItems((prev) => prev.map((l) => (l.id === id ? { ...l, saved } : l))), []);

  const inputCls = 'w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary-400';
  const canPost = user && user.accountType !== 'viewer';

  if (!user) return null;

  return (
    <div className="space-y-4">
      {/* Основні дії */}
      <div className="flex flex-wrap gap-2">
        {canPost ? (
          <Link href={`/projects/${slug}/new`} className="inline-flex items-center gap-2 rounded-full bg-primary-500 hover:bg-primary-600 text-white font-semibold px-5 py-2.5">
            <PlusCircle className="w-5 h-5" /> {t('listings.common.post')}
          </Link>
        ) : (
          <Link href="/auth/register" className="inline-flex items-center gap-2 rounded-full bg-primary-500 hover:bg-primary-600 text-white font-semibold px-5 py-2.5">
            {t('listings.common.viewerAction')}
          </Link>
        )}
        <button type="button" onClick={() => { searchRef.current?.focus(); searchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}
          className="inline-flex items-center gap-2 rounded-full bg-white border border-neutral-200 font-semibold px-5 py-2.5 text-neutral-800">
          <Search className="w-5 h-5" /> {t('listings.common.search')}
        </button>
      </div>

      {/* Пошук і фільтри */}
      <form onSubmit={apply} className="bg-white rounded-2xl border border-neutral-200/70 p-3 space-y-3">
        <div className="flex gap-2">
          <input ref={searchRef} value={draft.q ?? ''} onChange={(e) => set('q', e.target.value)} placeholder={t('listings.common.searchPlaceholder')} className={inputCls} />
          <button type="button" onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters} aria-label={t('listings.common.filters')} className="shrink-0 rounded-xl border border-neutral-200 px-3 text-neutral-700">
            <SlidersHorizontal className="w-5 h-5" />
          </button>
          <button type="submit" className="shrink-0 rounded-xl bg-primary-500 text-white font-semibold px-4">{t('listings.common.apply')}</button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <input value={draft.city ?? ''} onChange={(e) => set('city', e.target.value)} placeholder={t('listings.common.city')} className={inputCls} />
            <input type="number" inputMode="numeric" min={0} value={draft.priceMin ?? ''} onChange={(e) => set('priceMin', e.target.value)} placeholder={t('listings.common.priceFrom')} className={inputCls} />
            <input type="number" inputMode="numeric" min={0} value={draft.priceMax ?? ''} onChange={(e) => set('priceMax', e.target.value)} placeholder={t('listings.common.priceTo')} className={inputCls} />
            <span className="hidden md:block" />
            {fields.map((f) => {
              const label = t(`listings.fields.${slug}.${f.key}`);
              if (f.filter === 'select') {
                return (
                  <select key={f.key} value={draft[`f_${f.key}`] ?? ''} onChange={(e) => set(`f_${f.key}`, e.target.value)} className={inputCls} aria-label={label}>
                    <option value="">{label}: {t('listings.common.any')}</option>
                    {f.options?.map((o) => <option key={o} value={o}>{t(`listings.options.${f.key}.${o}`)}</option>)}
                  </select>
                );
              }
              if (f.filter === 'text') {
                return <input key={f.key} value={draft[`f_${f.key}`] ?? ''} onChange={(e) => set(`f_${f.key}`, e.target.value)} placeholder={label} className={inputCls} />;
              }
              return (
                <div key={f.key} className="col-span-2 grid grid-cols-2 gap-2">
                  <input type="number" inputMode="numeric" value={draft[`f_${f.key}_min`] ?? ''} onChange={(e) => set(`f_${f.key}_min`, e.target.value)} placeholder={`${label} ${t('listings.common.from')}`} className={inputCls} />
                  <input type="number" inputMode="numeric" value={draft[`f_${f.key}_max`] ?? ''} onChange={(e) => set(`f_${f.key}_max`, e.target.value)} placeholder={`${label} ${t('listings.common.to')}`} className={inputCls} />
                </div>
              );
            })}
            <button type="button" onClick={reset} className="col-span-2 md:col-span-4 text-sm text-neutral-500 hover:text-neutral-800 text-left">{t('listings.common.reset')}</button>
          </div>
        )}
      </form>

      {/* Список */}
      {loading && <div className="grid grid-cols-2 lg:grid-cols-3 gap-3" aria-hidden>{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-56 rounded-2xl bg-neutral-100 animate-pulse" />)}</div>}

      {!loading && error && items.length === 0 && (
        <div className="bg-white rounded-2xl border border-red-100 p-6 text-center space-y-3">
          <p className="text-sm text-red-600">{t('listings.common.loadFailed')}</p>
          <button type="button" onClick={() => load(applied)} className="rounded-full bg-primary-500 text-white text-sm font-semibold px-5 py-2">{t('listings.common.retry')}</button>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center space-y-1">
          <p className="font-semibold text-neutral-800">{t('listings.common.empty')}</p>
          <p className="text-sm text-neutral-500">{t('listings.common.emptyHint')}</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <ul className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((l) => <li key={l.id}><ListingCard listing={l} canSave onSavedChange={onSavedChange} /></li>)}
        </ul>
      )}

      <div ref={sentinel} aria-hidden className="h-1" />
      {loadingMore && <div className="flex justify-center py-3"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}
      {!loading && !loadingMore && !cursor && items.length > 0 && <p className="text-center text-xs text-neutral-400 py-3">{t('listings.common.endOfList')}</p>}
    </div>
  );
}
