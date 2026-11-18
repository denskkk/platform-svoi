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
import { FeedSidebar } from './FeedSidebar';
import { StoriesBar } from './StoriesBar';
import { PostComposer } from './PostComposer';

type Scope = 'all' | 'following';

function PostSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.12)] p-4 space-y-3" aria-hidden>
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-neutral-100 animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-3 w-1/3 rounded bg-neutral-100 animate-pulse" />
          <div className="h-3 w-1/4 rounded bg-neutral-100 animate-pulse" />
        </div>
      </div>
      <div className="h-3 rounded bg-neutral-100 animate-pulse" />
      <div className="h-3 w-4/5 rounded bg-neutral-100 animate-pulse" />
      <div className="h-48 rounded-lg bg-neutral-100 animate-pulse" />
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

  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const isViewer = user?.accountType === 'viewer';
  const canInteract = !isViewer;

  return (
    <div className="min-h-screen bg-neutral-100">
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

      <div className="mx-auto w-full max-w-[1180px] px-2 sm:px-4 pt-3 sm:pt-4 pb-28 md:pb-10 lg:grid lg:grid-cols-[250px_minmax(0,1fr)_300px] lg:gap-6 xl:grid-cols-[280px_minmax(0,680px)_320px] xl:justify-center">
        <FeedSidebar user={user} />
        <div className="min-w-0 space-y-3">
        <h1 className="sr-only">{t('feed.title')}</h1>

        {canInteract && <StoriesBar me={user} />}
        <PostComposer canPost={canInteract} user={user} onPosted={onPosted} />

        <Link href="/video" className="flex items-center justify-between rounded-lg bg-white shadow-[0_1px_2px_rgba(0,0,0,0.12)] px-4 py-3">
          <span className="inline-flex items-center gap-2 font-semibold text-neutral-900"><Clapperboard className="w-5 h-5 text-primary-700" /> {t('projects.video.chip')}</span>
          <span className="text-sm font-semibold text-primary-700">{t('projects.video.open')}</span>
        </Link>

        {/* Вкладки */}
        <div role="tablist" className="grid grid-cols-2 rounded-lg bg-white shadow-[0_1px_2px_rgba(0,0,0,0.12)] overflow-hidden">
          {(['all', 'following'] as Scope[]).map((s) => (
            <button
              key={s}
              role="tab"
              type="button"
              aria-selected={scope === s}
              onClick={() => { if (scope !== s) changeScope(s); }}
              className={cn('py-3 text-[15px] font-semibold border-b-[3px] transition-colors', scope === s ? 'text-primary-600 border-primary-500' : 'text-neutral-500 border-transparent hover:bg-neutral-100')}
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
          <div className="bg-white rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.12)] p-6 text-center space-y-3">
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
          {!isDesktop && scope === 'all' && index === Math.min(2, posts.length - 1) && <Recommendations canFollow={canInteract} onFollowed={(id) => setFollowing(id, true)} />}
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

        {isDesktop && (
          <aside className="sticky top-20 self-start space-y-3">
            <Recommendations vertical canFollow={canInteract} onFollowed={(id) => setFollowing(id, true)} />
          </aside>
        )}
      </div>
    </div>
  );
}
