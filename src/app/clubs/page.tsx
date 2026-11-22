'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Plus, Search, ShoppingBag, Users } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { CLUB_CATEGORIES, CLUB_ICONS } from '@/lib/clubs';
import { authHeaders, jsonHeaders, readStoredUser } from '@/lib/feedClient';
import { canCreateGroups } from '@/lib/groupRights';

interface Club { id: number; name: string; description: string; category: string; city: string | null; membersCount: number; joined: boolean; isOwner: boolean; membership?: 'active' | 'pending' | null; joinMode?: string }

export default function ClubsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const toast = useToast();
  const [scope, setScope] = useState<'all' | 'mine'>('all');
  const [category, setCategory] = useState('');
  // Спочатку кубики категорій; після вибору кубика (або «Усі клуби») — список
  const [browse, setBrowse] = useState(false);
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Club[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [canCreate, setCanCreate] = useState(false);

  useEffect(() => {
    const me = readStoredUser();
    if (!me) { router.replace('/auth/login?returnUrl=/clubs'); return; }
    setCanCreate(canCreateGroups(me));
    const wanted = new URLSearchParams(window.location.search).get('category') || '';
    if ((CLUB_CATEGORIES as readonly string[]).includes(wanted)) { setCategory(wanted); setBrowse(true); }
  }, [router]);

  useEffect(() => {
    const id = setTimeout(() => setQuery(q.trim()), 350);
    return () => clearTimeout(id);
  }, [q]);

  const load = useCallback(async (after: number | null) => {
    const qs = new URLSearchParams({ scope });
    if (query) qs.set('q', query);
    if (category) qs.set('category', category);
    if (after) qs.set('cursor', String(after));
    try {
      const res = await fetch(`/api/clubs?${qs}`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
      if (res.status === 401) { router.replace('/auth/login?returnUrl=/clubs'); return; }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems((prev) => (after ? [...prev, ...data.clubs] : data.clubs));
      setCursor(data.nextCursor ?? null);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [scope, query, category, router]);

  useEffect(() => { setLoading(true); load(null); }, [load]);

  const toggle = async (c: Club) => {
    const leaving = c.joined || c.membership === 'pending';
    try {
      const res = await fetch(`/api/clubs/${c.id}/join`, { method: leaving ? 'DELETE' : 'POST', credentials: 'include', headers: jsonHeaders() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      setItems((l) => l.map((x) => (x.id === c.id ? { ...x, joined: !!data.joined, membership: data.pending ? 'pending' : data.joined ? 'active' : null, membersCount: typeof data.membersCount === 'number' ? data.membersCount : x.membersCount } : x)));
      if (data.pending) toast.success(t('clubs.requested'));
    } catch (e: any) {
      toast.error(e?.message || t('feed.toast.actionFailed'));
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2"><Users className="w-6 h-6 text-primary-600" />{t('clubs.title')}</h1>
          {canCreate && <Link href={`/clubs/new${category ? `?category=${category}` : ''}`} className="inline-flex items-center gap-1.5 rounded-full bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2"><Plus className="w-4 h-4" />{t('clubs.create')}</Link>}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} maxLength={80} placeholder={t('clubs.searchPlaceholder')} aria-label={t('clubs.searchPlaceholder')}
            className="w-full rounded-full bg-white shadow-sm pl-9 pr-3 py-2.5 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
        </div>

        {!browse && !query && scope === 'all' ? (
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <li>
              <button type="button" onClick={() => { setCategory(''); setBrowse(true); }} className="w-full h-full min-h-[7rem] rounded-2xl bg-white shadow-md hover:shadow-lg active:scale-[0.98] transition p-3 flex flex-col items-center justify-center gap-2 text-center">
                <span className="text-4xl" aria-hidden>🤝</span>
                <span className="text-sm font-bold text-neutral-900 leading-snug">{t('clubs.browse.allClubs')}</span>
              </button>
            </li>
            {CLUB_CATEGORIES.map((c) => (
              <li key={c}>
                <button type="button" onClick={() => { setCategory(c); setBrowse(true); }} className="w-full h-full min-h-[7rem] rounded-2xl bg-white shadow-md hover:shadow-lg active:scale-[0.98] transition p-3 flex flex-col items-center justify-center gap-2 text-center">
                  <span className="text-4xl" aria-hidden>{CLUB_ICONS[c]}</span>
                  <span className="text-sm font-bold text-neutral-900 leading-snug">{t(`clubs.categories.${c}`)}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (<>
        <div className="flex flex-wrap gap-2">
          {browse && (
            <button type="button" onClick={() => { setBrowse(false); setCategory(''); setQ(''); }} className="inline-flex items-center gap-1.5 rounded-full bg-white shadow-sm text-sm font-semibold text-neutral-800 px-3.5 py-2">
              <ArrowLeft className="w-4 h-4" />{t('clubs.browse.back')}
            </button>
          )}
          {category && (
            <Link href={`/projects/clubs?folder=${category}.shop`} className="inline-flex items-center gap-1.5 rounded-full bg-white shadow-sm text-sm font-semibold text-primary-700 px-3.5 py-2">
              <ShoppingBag className="w-4 h-4" />{t('clubs.browse.shop')}
            </Link>
          )}
        </div>
        <div role="tablist" className="flex gap-1 bg-white rounded-xl shadow-sm p-1">
          {(['all', 'mine'] as const).map((s) => (
            <button key={s} role="tab" aria-selected={scope === s} onClick={() => setScope(s)}
              className={cn('flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition', scope === s ? 'bg-primary-50 text-primary-700' : 'text-neutral-600 hover:bg-neutral-100')}>{t(`clubs.scope.${s}`)}</button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {['', ...CLUB_CATEGORIES].map((c) => (
            <button key={c || 'all'} type="button" onClick={() => setCategory(c)} aria-pressed={category === c}
              className={cn('whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium border transition', category === c ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50')}>
              {c ? t(`clubs.categories.${c}`) : t('clubs.allCategories')}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2" aria-hidden>{[0, 1, 2].map((i) => <div key={i} className="h-24 rounded-2xl bg-white animate-pulse" />)}</div>
        ) : error ? (
          <EmptyState icon={Users} title={t('clubs.loadFailed')} description="" />
        ) : items.length === 0 ? (
          <EmptyState icon={Users} title={t('clubs.empty')} description={t('clubs.emptyHint')} />
        ) : (
          <ul className="space-y-2">
            {items.map((c) => (
              <li key={c.id} className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3">
                <Link href={`/clubs/${c.id}`} className="min-w-0 flex-1">
                  <h2 className="font-semibold text-neutral-900 truncate">{c.name}</h2>
                  <p className="text-xs text-neutral-500">{[t(`clubs.categories.${c.category}`), c.city, t('clubs.members', { count: c.membersCount })].filter(Boolean).join(' · ')}</p>
                  <p className="text-sm text-neutral-600 line-clamp-2 mt-1">{c.description}</p>
                </Link>
                {!c.isOwner && (
                  <button type="button" onClick={() => toggle(c)} className={cn('shrink-0 rounded-lg px-3.5 py-2 text-sm font-semibold transition active:scale-95', c.joined || c.membership === 'pending' ? 'bg-neutral-200 text-neutral-800 hover:bg-neutral-300' : 'bg-primary-500 text-neutral-900 hover:bg-primary-600')}>
                    {c.joined ? t('clubs.leave') : c.membership === 'pending' ? t('clubs.cancelRequest') : c.joinMode === 'approval' ? t('clubs.joinRequest') : t('clubs.join')}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {cursor && !loading && (
          <button type="button" disabled={loadingMore} onClick={() => { setLoadingMore(true); load(cursor); }} className="w-full rounded-lg bg-white shadow-sm py-2.5 text-sm font-semibold text-primary-700 hover:bg-neutral-50 inline-flex items-center justify-center gap-2">
            {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}{t('clubs.loadMore')}
          </button>
        )}
        </>)}
      </div>
    </div>
  );
}
