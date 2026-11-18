'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Search, UserCheck, UserPlus, Users } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { authHeaders, jsonHeaders, readStoredUser } from '@/lib/feedClient';

type Tab = 'following' | 'followers' | 'mutual';
interface Person { id: number; name: string; avatarUrl: string | null; subtitle: string | null; isVerified: boolean; isFollowing: boolean }

export default function FriendsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('following');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [people, setPeople] = useState<Person[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [counts, setCounts] = useState({ following: 0, followers: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!readStoredUser()) router.replace('/auth/login?returnUrl=/friends');
  }, [router]);

  // Невелика затримка, щоб не робити запит на кожну літеру
  useEffect(() => {
    const id = setTimeout(() => setQuery(q.trim()), 300);
    return () => clearTimeout(id);
  }, [q]);

  const load = useCallback(async (after: number | null) => {
    const qs = new URLSearchParams({ tab });
    if (query) qs.set('q', query);
    if (after) qs.set('cursor', String(after));
    try {
      const res = await fetch(`/api/friends?${qs}`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
      if (res.status === 401) { router.replace('/auth/login?returnUrl=/friends'); return; }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPeople((prev) => (after ? [...prev, ...data.users] : data.users));
      setCursor(data.nextCursor ?? null);
      setCounts(data.counts);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [tab, query, router]);

  useEffect(() => { setLoading(true); load(null); }, [load]);

  const toggle = async (p: Person) => {
    const next = !p.isFollowing;
    const set = (v: boolean) => setPeople((list) => list.map((x) => (x.id === p.id ? { ...x, isFollowing: v } : x)));
    set(next);
    try {
      const res = next
        ? await fetch('/api/follows', { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ userId: p.id }) })
        : await fetch(`/api/follows?userId=${p.id}`, { method: 'DELETE', credentials: 'include', headers: authHeaders() });
      if (!res.ok) throw new Error();
      setCounts((c) => ({ ...c, following: Math.max(0, c.following + (next ? 1 : -1)) }));
    } catch {
      set(!next);
      toast.error(t('feed.toast.actionFailed'));
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'following', label: `${t('feed.friends.following')} · ${counts.following}` },
    { key: 'followers', label: `${t('feed.friends.followers')} · ${counts.followers}` },
    { key: 'mutual', label: t('feed.friends.mutual') },
  ];

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 space-y-3">
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2"><Users className="w-6 h-6 text-primary-600" />{t('feed.friends.title')}</h1>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            maxLength={60}
            placeholder={t('feed.friends.searchPlaceholder')}
            aria-label={t('feed.friends.searchPlaceholder')}
            className="w-full rounded-full bg-white shadow-sm pl-9 pr-3 py-2.5 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>

        <div role="tablist" className="flex gap-1 bg-white rounded-xl shadow-sm p-1 overflow-x-auto">
          {tabs.map((x) => (
            <button key={x.key} role="tab" aria-selected={tab === x.key} onClick={() => setTab(x.key)}
              className={cn('flex-1 whitespace-nowrap px-3 py-2 rounded-lg text-sm font-semibold transition', tab === x.key ? 'bg-primary-50 text-primary-700' : 'text-neutral-600 hover:bg-neutral-100')}>
              {x.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2" aria-hidden>
            {[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-white animate-pulse" />)}
          </div>
        ) : error ? (
          <EmptyState icon={Users} title={t('feed.errors.load')} description="" />
        ) : people.length === 0 ? (
          <EmptyState icon={Users} title={query ? t('feed.friends.noResults') : t(`feed.friends.empty.${tab}`)} description="" />
        ) : (
          <ul className="space-y-2">
            {people.map((p) => (
              <li key={p.id} className="flex items-center gap-3 bg-white rounded-xl shadow-sm p-3">
                <Link href={`/profile/${p.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                  <UserAvatar src={p.avatarUrl} alt={p.name} fallbackName={p.name} className="w-12 h-12 rounded-full shrink-0" />
                  <span className="min-w-0">
                    <span className="block font-semibold text-neutral-900 truncate">{p.name}</span>
                    {p.subtitle && <span className="block text-sm text-neutral-500 truncate">{p.subtitle}</span>}
                  </span>
                </Link>
                <button type="button" onClick={() => toggle(p)}
                  className={cn('inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition active:scale-95 shrink-0', p.isFollowing ? 'bg-neutral-200 text-neutral-800 hover:bg-neutral-300' : 'bg-primary-500 text-white hover:bg-primary-600')}>
                  {p.isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  {p.isFollowing ? t('feed.post.following') : t('feed.post.follow')}
                </button>
              </li>
            ))}
          </ul>
        )}

        {cursor && !loading && (
          <button type="button" disabled={loadingMore} onClick={() => { setLoadingMore(true); load(cursor); }}
            className="w-full rounded-lg bg-white shadow-sm py-2.5 text-sm font-semibold text-primary-700 hover:bg-neutral-50 inline-flex items-center justify-center gap-2">
            {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}{t('feed.comments.loadMore')}
          </button>
        )}
      </div>
    </div>
  );
}
