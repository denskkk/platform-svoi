'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BadgeCheck, Building2, Loader2, MapPin, Search, Star } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useI18n } from '@/i18n/client';
import { authHeaders, readStoredUser } from '@/lib/feedClient';

interface Company {
  id: number; name: string; logoUrl: string | null; bannerUrl: string | null; city: string | null; category: string | null;
  description: string | null; isVerified: boolean; rating: number; reviewsCount: number;
}

export default function CompaniesPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const [filters, setFilters] = useState({ q: '', city: '' });
  const [items, setItems] = useState<Company[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!readStoredUser()) router.replace('/auth/login?returnUrl=/companies');
    // читаємо початкові фільтри з адреси (?q=&city=)
    const sp = new URLSearchParams(window.location.search);
    const iq = (sp.get('q') || '').slice(0, 80);
    const ic = (sp.get('city') || '').slice(0, 100);
    if (iq || ic) { setQ(iq); setCity(ic); setFilters({ q: iq, city: ic }); }
  }, [router]);

  useEffect(() => {
    const id = setTimeout(() => setFilters({ q: q.trim(), city: city.trim() }), 350);
    return () => clearTimeout(id);
  }, [q, city]);

  const load = useCallback(async (after: number | null) => {
    const qs = new URLSearchParams();
    if (filters.q) qs.set('q', filters.q);
    if (filters.city) qs.set('city', filters.city);
    if (after) qs.set('cursor', String(after));
    try {
      const res = await fetch(`/api/companies?${qs}`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
      if (res.status === 401) { router.replace('/auth/login?returnUrl=/companies'); return; }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems((prev) => (after ? [...prev, ...data.companies] : data.companies));
      setCursor(data.nextCursor ?? null);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters, router]);

  useEffect(() => { setLoading(true); load(null); }, [load]);

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 space-y-3">
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2"><Building2 className="w-6 h-6 text-primary-600" />{t('companies.title')}</h1>

        <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} maxLength={80} placeholder={t('companies.searchPlaceholder')} aria-label={t('companies.searchPlaceholder')}
              className="w-full rounded-full bg-white shadow-sm pl-9 pr-3 py-2.5 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
            <input type="search" value={city} onChange={(e) => setCity(e.target.value)} maxLength={100} placeholder={t('companies.cityPlaceholder')} aria-label={t('companies.cityPlaceholder')}
              className="w-full rounded-full bg-white shadow-sm pl-9 pr-3 py-2.5 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
          </div>
        </div>

        {loading ? (
          <div className="space-y-2" aria-hidden>{[0, 1, 2].map((i) => <div key={i} className="h-28 rounded-2xl bg-white animate-pulse" />)}</div>
        ) : error ? (
          <EmptyState icon={Building2} title={t('companies.loadFailed')} description="" />
        ) : items.length === 0 ? (
          <EmptyState icon={Building2} title={t('companies.empty')} description={t('companies.emptyHint')} actionLabel={t('companies.apply')} actionHref="/business/apply" />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {items.map((c) => (
              <li key={c.id}>
                <Link href={`/companies/${c.id}`} className="block bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition">
                  <div className="h-20 bg-gradient-to-r from-primary-100 to-accent-100">
                    {c.bannerUrl && <img src={c.bannerUrl} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />}
                  </div>
                  <div className="px-4 pb-4 -mt-7 flex gap-3">
                    <UserAvatar src={c.logoUrl} alt={c.name} fallbackName={c.name} className="w-14 h-14 rounded-xl border-2 border-white bg-white shrink-0" />
                    <div className="min-w-0 pt-8">
                      <h2 className="font-semibold text-neutral-900 truncate flex items-center gap-1">{c.name}{c.isVerified && <BadgeCheck className="w-4 h-4 text-primary-600 shrink-0" />}</h2>
                      <p className="text-sm text-neutral-500 truncate">{[c.category, c.city].filter(Boolean).join(' · ')}</p>
                    </div>
                  </div>
                  <div className="px-4 pb-4 -mt-1 space-y-1">
                    {c.description && <p className="text-sm text-neutral-600 line-clamp-2">{c.description}</p>}
                    {c.reviewsCount > 0 && (
                      <p className="text-xs text-neutral-500 flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-400 fill-current" />{c.rating.toLocaleString(locale === 'uk' ? 'uk-UA' : 'en', { maximumFractionDigits: 1 })} · {c.reviewsCount}</p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {cursor && !loading && (
          <button type="button" disabled={loadingMore} onClick={() => { setLoadingMore(true); load(cursor); }}
            className="w-full rounded-lg bg-white shadow-sm py-2.5 text-sm font-semibold text-primary-700 hover:bg-neutral-50 inline-flex items-center justify-center gap-2">
            {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}{t('companies.loadMore')}
          </button>
        )}
      </div>
    </div>
  );
}
