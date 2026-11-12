'use client';

import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowDown, Clapperboard, Loader2, Newspaper, Users } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { useI18n } from '@/i18n/client';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { cn } from '@/lib/utils';
import { FeedPost, authHeaders, readStoredUser } from '@/lib/feedClient';
import { PostCard } from './PostCard';
import { Recommendations } from './Recommendations';
import { PostComposer } from './PostComposer';

type Scope = 'all' | 'following';

function PostSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200/70 p-4 space-y-3" aria-hidden>
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-neutral-100 animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-3 w-1/3 rounded bg-neutral-100 animate-pulse" />
          <div className="h-3 w-1/4 rounded bg-neutral-100 animate-pulse" />
        </div>
      </div>
      <div className="h-3 rounded bg-neutral-100 animate-pulse" />
      <div className="h-3 w-4/5 rounded bg-neutral-100 animate-pulse" />
      <div className="h-48 rounded-xl bg-neutral-100 animate-pulse" />
    </div>
  );
}

export function FeedPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [user, setUser] = useState<ReturnType<typeof readStoredUser>>(null);
  const [ready, setReady] = useState(false);
  const [scope, setScope] = useState<Scope>('all');
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const sentinel = useRef<HTMLDivElement>(null);
  // Захист від гонок: відповідь на застарілий запит (інша вкладка/оновлення) ігнорується
  const requestId = useRef(0);

  useEffect(() => {
    const stored = readStoredUser();
    if (!stored) {
      router.replace('/auth/login?returnUrl=/feed');
      return;
    }
    setUser(stored);
    setReady(true);
  }, [router]);

  const fetchPage = useCallback(async (after: number | null, currentScope: Scope) => {
    const qs = new URLSearchParams({ scope: currentScope });
    if (after) qs.set('cursor', String(after));
    const res = await fetch(`/api/feed?${qs}`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
    if (res.status === 401) {
      router.replace('/auth/login?returnUrl=/feed');
      throw new Error('unauthorized');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || t('feed.errors.load'));
    return data as { posts: FeedPost[]; nextCursor: number | null };
  }, [router, t]);

  const reload = useCallback(async (currentScope: Scope, silent = false) => {
    const id = ++requestId.current;
    if (!silent) setLoading(true);
    setError('');
    try {
      const data = await fetchPage(null, currentScope);
      if (id !== requestId.current) return;
      setPosts(data.posts);
      setCursor(data.nextCursor);
    } catch (e: any) {
      if (id !== requestId.current || e?.message === 'unauthorized') return;
      setError(e?.message || t('feed.errors.load'));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [fetchPage, t]);

  useEffect(() => {
    if (ready) reload(scope);
  }, [ready, scope, reload]);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore || loading) return;
    const id = requestId.current;
    setLoadingMore(true);
    try {
      const data = await fetchPage(cursor, scope);
      if (id !== requestId.current) return;
      setPosts((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...data.posts.filter((p) => !seen.has(p.id))];
      });
      setCursor(data.nextCursor);
    } catch (e: any) {
      if (e?.message !== 'unauthorized') setError(e?.message || t('feed.errors.load'));
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, loadingMore, loading, fetchPage, scope, t]);

  // Нескінченна прокрутка: підвантажуємо за ~600px до кінця списку
  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) loadMore();
    }, { rootMargin: '600px 0px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const pull = usePullToRefresh(() => reload(scope, true), ready);

  const patchPost = useCallback((id: number, patch: Partial<FeedPost>) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const setFollowing = useCallback((authorId: number, following: boolean) => {
    setPosts((prev) => prev.map((p) => (p.author.id === authorId ? { ...p, viewer: { ...p.viewer, following } } : p)));
  }, []);

  const changeScope = useCallback((next: Scope) => {
    setPosts([]);
    setCursor(null);
    setLoading(true);
    setScope(next);
  }, []);

  const removeByAuthor = useCallback((authorId: number) => setPosts((prev) => prev.filter((p) => p.author.id !== authorId)), []);

  const removePost = useCallback((id: number) => setPosts((prev) => prev.filter((p) => p.id !== id)), []);

  const onPosted = useCallback((post: FeedPost) => {
    setPosts((prev) => [post, ...prev]);
  }, []);

  if (!ready) return null;

  const isViewer = user?.accountType === 'viewer';
  const canInteract = !isViewer;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Індикатор pull-to-refresh */}
      <div
        className="flex items-center justify-center text-xs text-neutral-500 overflow-hidden transition-[height] duration-150"
        style={{ height: pull.distance }}
        aria-live="polite"
      >
        {pull.distance > 8 && (
          <span className="inline-flex items-center gap-2">
            {pull.refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowDown className={cn('w-4 h-4 transition-transform', pull.ready && 'rotate-180')} />}
            {pull.refreshing ? t('feed.pull.refreshing') : pull.ready ? t('feed.pull.release') : t('feed.pull.pull')}
          </span>
        )}
      </div>

      <div className="mx-auto w-full max-w-xl px-3 sm:px-4 pt-4 pb-28 md:pb-10 space-y-4">
        <h1 className="sr-only">{t('feed.title')}</h1>

        <PostComposer canPost={canInteract} user={user} onPosted={onPosted} />

        <Link href="/video" className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-primary-100 to-white border border-primary-200 px-4 py-3">
          <span className="inline-flex items-center gap-2 font-semibold text-neutral-900"><Clapperboard className="w-5 h-5 text-primary-700" /> {t('projects.video.chip')}</span>
          <span className="rounded-full bg-primary-500 text-white text-[10px] font-bold uppercase tracking-wide px-2 py-0.5">{t('projects.soon')}</span>
        </Link>

        {/* Вкладки */}
        <div role="tablist" className="grid grid-cols-2 rounded-full bg-white border border-neutral-200/70 p-1 shadow-sm">
          {(['all', 'following'] as Scope[]).map((s) => (
            <button
              key={s}
              role="tab"
              type="button"
              aria-selected={scope === s}
              onClick={() => { if (scope !== s) changeScope(s); }}
              className={cn('rounded-full py-2 text-sm font-semibold transition', scope === s ? 'bg-primary-500 text-white shadow' : 'text-neutral-600 hover:bg-neutral-50')}
            >
              {s === 'all' ? t('feed.tabs.forYou') : t('feed.tabs.following')}
            </button>
          ))}
        </div>

        {loading && (
          <div className="space-y-4">
            <PostSkeleton />
            <PostSkeleton />
          </div>
        )}

        {!loading && error && posts.length === 0 && (
          <div className="bg-white rounded-2xl border border-red-100 p-6 text-center space-y-3">
            <p className="text-sm text-red-600">{error}</p>
            <button type="button" onClick={() => reload(scope)} className="rounded-full bg-primary-500 text-white text-sm font-semibold px-5 py-2">
              {t('feed.retry')}
            </button>
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          scope === 'all' ? (
            <EmptyState icon={Newspaper} title={t('feed.empty.forYou.title')} description={t('feed.empty.forYou.description')} />
          ) : (
            <EmptyState
              icon={Users}
              title={t('feed.empty.following.title')}
              description={t('feed.empty.following.description')}
              actionLabel={t('feed.empty.following.action')}
              actionOnClick={() => changeScope('all')}
            />
          )
        )}

        {!loading && posts.map((post, index) => (
          <Fragment key={post.id}>
          <PostCard
            post={post}
            canInteract={canInteract}
            canFollow
            onChange={patchPost}
            onFollowChange={setFollowing}
            onDeleted={removePost}
            onBlocked={removeByAuthor}
          />
          {scope === 'all' && index === Math.min(2, posts.length - 1) && <Recommendations canFollow={canInteract} onFollowed={(id) => setFollowing(id, true)} />}
          </Fragment>
        ))}

        <div ref={sentinel} aria-hidden className="h-1" />

        {loadingMore && (
          <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>
        )}
        {!loading && !loadingMore && error && posts.length > 0 && (
          <div className="text-center">
            <button type="button" onClick={loadMore} className="text-sm font-medium text-accent-600">{t('feed.retry')}</button>
          </div>
        )}
        {!loading && !cursor && !error && posts.length > 0 && (
          <p className="text-center text-xs text-neutral-400 py-4">{t('feed.end')}</p>
        )}
      </div>
    </div>
  );
}
