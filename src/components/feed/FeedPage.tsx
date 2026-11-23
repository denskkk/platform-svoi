'use client';

import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowDown, Clapperboard, Loader2, Newspaper, Radio, Search, Users } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { useI18n } from '@/i18n/client';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { cn } from '@/lib/utils';
import { FeedPost, authHeaders, readStoredUser } from '@/lib/feedClient';
import { PostCard } from './PostCard';
import { Recommendations } from './Recommendations';
import { FeedMenuDrawer, FeedSidebar } from './FeedSidebar';
import { StoriesBar } from './StoriesBar';
import { PostComposer } from './PostComposer';
import { MarketFeed } from './MarketFeed';
import { GuestBanner, useGuestGate } from '@/components/ui/GuestGate';

type Scope = 'all' | 'following';
/** Вкладки стрічки за ТЗ: LIVE, Товари/Послуги, Підписки, Рекомендоване */
type Tab = 'live' | 'market' | 'following' | 'all';
const TABS: Tab[] = ['live', 'market', 'following', 'all'];

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
  const [view, setView] = useState<'feed' | 'live' | 'market'>('feed');
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const sentinel = useRef<HTMLDivElement>(null);
  // Захист від гонок: відповідь на застарілий запит (інша вкладка/оновлення) ігнорується
  const requestId = useRef(0);

  useEffect(() => {
    // Без входу показуємо публічну стрічку (режим гостя): дивитись можна, будь-яка дія веде на вхід/реєстрацію
    const stored = readStoredUser();
    // Гість стрічку не бачить: ведемо на екран вибору мови й реєстрації
    if (!stored) { router.replace('/'); return; }
    setUser(stored);
    setReady(true);
  }, [router]);
  const isGuest = ready && !user;
  const gate = useGuestGate(isGuest);
  const pageCount = useRef(0);

  const fetchPage = useCallback(async (after: number | null, currentScope: Scope) => {
    const qs = new URLSearchParams({ scope: currentScope });
    if (after) qs.set('cursor', String(after));
    if (!user) {
      pageCount.current = after ? pageCount.current + 1 : 0;
      qs.set('page', String(pageCount.current));
      const g = await fetch(`/api/feed/public?${qs}`, { cache: 'no-store' });
      const gd = await g.json().catch(() => ({}));
      if (!g.ok) throw new Error(gd.error || t('feed.errors.load'));
      return gd as { posts: FeedPost[]; nextCursor: number | null };
    }
    const res = await fetch(`/api/feed?${qs}`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
    if (res.status === 401) {
      router.replace('/auth/login?returnUrl=/feed');
      throw new Error('unauthorized');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || t('feed.errors.load'));
    return data as { posts: FeedPost[]; nextCursor: number | null };
  }, [router, t, user]);

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

  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1280px)'); // права колонка з рекомендаціями лише на широких екранах
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  if (!ready) return null;

  const isViewer = user?.accountType === 'viewer';
  const canInteract = !isViewer;

  return (
    <div className="min-h-screen bg-neutral-100" onClickCapture={gate.onClickCapture}>
      {gate.modal}
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

      <div className="mx-auto w-full max-w-2xl lg:max-w-[1180px] px-2 sm:px-4 pt-3 sm:pt-4 pb-28 lg:pb-10 lg:grid lg:grid-cols-[240px_minmax(0,680px)] lg:gap-6 lg:justify-center xl:grid-cols-[minmax(220px,280px)_minmax(0,680px)_minmax(240px,320px)]">
        <FeedSidebar user={user} />
        <div className="min-w-0 space-y-3">
        <h1 className="sr-only">{t('feed.title')}</h1>

        <div data-guest-ok className="flex items-center gap-2">
          <FeedMenuDrawer user={user} />
          <Link href="/search?type=people" className="flex-1 min-w-0 flex items-center gap-3 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.12)] px-4 py-2.5 text-neutral-500 hover:bg-neutral-50">
            <Search className="w-5 h-5 shrink-0" /> <span className="text-[15px] truncate">{t('cabinet.feedSearch')}</span>
          </Link>
        </div>

        {isGuest && <GuestBanner />}
        {canInteract && !isGuest && <StoriesBar me={user} />}
        {/* На ПК (де немає нижнього меню з «+») лишається панель допису з фото, відео й оголошенням; на телефоні — студія «+» */}
        {!isGuest && <div className="hidden md:block"><PostComposer canPost={canInteract} user={user} onPosted={onPosted} /></div>}

        <Link href="/video" data-guest-ok className="flex items-center justify-between rounded-lg bg-white shadow-[0_1px_2px_rgba(0,0,0,0.12)] px-4 py-3">
          <span className="inline-flex items-center gap-2 font-semibold text-neutral-900"><Clapperboard className="w-5 h-5 text-primary-700" /> {t('projects.video.chip')}</span>
          <span className="text-sm font-semibold text-primary-700">{t('projects.video.open')}</span>
        </Link>

        {/* Вкладки */}
        <div role="tablist" data-guest-ok className="grid grid-cols-4 rounded-lg bg-white shadow-[0_1px_2px_rgba(0,0,0,0.12)] overflow-hidden">
          {TABS.map((tab) => {
            const active = tab === 'live' || tab === 'market' ? view === tab : view === 'feed' && scope === tab;
            return (
              <button
                key={tab}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => {
                  if (tab === 'market' && isGuest) { gate.show(); return; }
                  if (tab === 'live' || tab === 'market') { setView(tab); return; }
                  if (isGuest && tab === 'following') { gate.show(); return; }
                  setView('feed');
                  if (scope !== tab) changeScope(tab);
                }}
                className={cn('py-3 px-1 text-[13px] sm:text-[15px] font-semibold border-b-[3px] transition-colors leading-tight', active ? 'text-primary-600 border-primary-500' : 'text-neutral-500 border-transparent hover:bg-neutral-100')}
              >
                {t(`feed.tabs.${tab}`)}
              </button>
            );
          })}
        </div>

        {view === 'live' && (
          <div className="bg-white rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.12)] p-8 text-center space-y-3">
            <span className="mx-auto h-14 w-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center"><Radio className="w-7 h-7" /></span>
            <h2 className="text-lg font-bold text-neutral-900">{t('feed.live.title')}</h2>
            <p className="text-sm text-neutral-600">{t('feed.live.soon')}</p>
          </div>
        )}
        {view === 'market' && <MarketFeed canSave={canInteract} />}
        {view === 'feed' && (<>
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
          {!isGuest && !isDesktop && scope === 'all' && index === Math.min(2, posts.length - 1) && <Recommendations canFollow={canInteract} onFollowed={(id) => setFollowing(id, true)} />}
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
        </>)}
        </div>

        {isDesktop && !isGuest && (
          <aside className="sticky top-20 self-start space-y-3 max-h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain [scrollbar-width:thin]">
            <Recommendations vertical canFollow={canInteract} onFollowed={(id) => setFollowing(id, true)} />
          </aside>
        )}
      </div>
    </div>
  );
}
