'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Bookmark, Clapperboard, Heart, MessageCircle, Play, Plus, Check, Share2, Volume2, VolumeX, X } from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { PostComments } from '@/components/feed/PostComments';
import { RichText } from '@/components/feed/RichText';
import { useI18n } from '@/i18n/client';
import { FeedPost, authHeaders, jsonHeaders, readStoredUser } from '@/lib/feedClient';
import { cn } from '@/lib/utils';

type Tab = 'all' | 'following';

/** Рілси «як у TikTok»: повний екран, автозапуск, подвійний тап = лайк, бокова панель дій, коментарі знизу, вкладки «Підписки / Для вас». */
export default function VideoPage() {
  const { t } = useI18n();
  const toast = useToast();
  const me = readStoredUser();
  const [tab, setTab] = useState<Tab>('all');
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [muted, setMuted] = useState(true);
  const [commentsFor, setCommentsFor] = useState<FeedPost | null>(null);
  const loadingRef = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (next: number | null, scope: Tab) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const qs = new URLSearchParams({ videos: '1', limit: '8', scope });
      if (next) qs.set('cursor', String(next));
      const res = await fetch(`/api/feed?${qs}`, { credentials: 'include', headers: authHeaders() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      setPosts((prev) => (next ? [...prev, ...(data.posts as FeedPost[]).filter((p) => !prev.some((x) => x.id === p.id))] : data.posts));
      setCursor(data.nextCursor);
      setDone(!data.nextCursor);
    } catch {
      setDone(true);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => { setLoading(true); setPosts([]); setDone(false); listRef.current?.scrollTo({ top: 0 }); load(null, tab); }, [tab, load]);

  const patch = useCallback((id: number, fn: (p: FeedPost) => Partial<FeedPost>) => setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...fn(p) } : p))), []);

  const like = useCallback(async (id: number, force?: boolean) => {
    const post = posts.find((p) => p.id === id);
    if (!post || !me) return;
    const liked = force ?? !post.viewer.liked;
    if (liked === post.viewer.liked) return;
    patch(id, (p) => ({ likesCount: p.likesCount + (liked ? 1 : -1), viewer: { ...p.viewer, liked } }));
    try {
      const res = await fetch(`/api/posts/${id}/like`, { method: liked ? 'POST' : 'DELETE', credentials: 'include', headers: jsonHeaders() });
      if (!res.ok) throw new Error();
    } catch {
      patch(id, (p) => ({ likesCount: post.likesCount, viewer: { ...p.viewer, liked: post.viewer.liked } }));
    }
  }, [posts, me, patch]);

  const follow = useCallback(async (post: FeedPost) => {
    if (!me || post.viewer.isOwn || post.viewer.following) return;
    const authorId = post.author.id;
    setPosts((prev) => prev.map((p) => (p.author.id === authorId ? { ...p, viewer: { ...p.viewer, following: true } } : p)));
    try {
      const res = await fetch('/api/follows', { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ userId: authorId }) });
      if (!res.ok) throw new Error();
    } catch {
      setPosts((prev) => prev.map((p) => (p.author.id === authorId ? { ...p, viewer: { ...p.viewer, following: false } } : p)));
      toast.error(t('feed.toast.actionFailed'));
    }
  }, [me, toast, t]);

  const save = useCallback(async (post: FeedPost) => {
    if (!me) return;
    const was = !!post.viewer.saved;
    patch(post.id, (p) => ({ viewer: { ...p.viewer, saved: !was } }));
    try {
      const res = await fetch(`/api/posts/${post.id}/save`, { method: was ? 'DELETE' : 'POST', credentials: 'include', headers: authHeaders() });
      if (!res.ok) throw new Error();
      toast.success(was ? t('feed.post.unsavedToast') : t('feed.post.savedToast'));
    } catch { patch(post.id, (p) => ({ viewer: { ...p.viewer, saved: was } })); }
  }, [me, patch, toast, t]);

  const share = useCallback(async (post: FeedPost) => {
    const url = `${window.location.origin}/feed/${post.id}`;
    try {
      if (navigator.share) { await navigator.share({ title: post.author.name, url }); return; }
      await navigator.clipboard.writeText(url);
      toast.success(t('feed.post.linkCopied'));
    } catch { /* скасовано */ }
  }, [toast, t]);

  // Клавіатура на десктопі: стрілки вгору/вниз гортають рілси
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = listRef.current;
      if (!el || commentsFor) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        el.scrollBy({ top: (e.key === 'ArrowDown' ? 1 : -1) * el.clientHeight, behavior: 'smooth' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [commentsFor]);

  const empty = !loading && posts.length === 0;

  return (
    <div className="fixed inset-x-0 top-0 bottom-[calc(4rem+var(--safe-area-inset-bottom,0px))] z-40 bg-black md:static md:inset-auto md:z-auto md:h-[calc(100dvh-4rem)]">
      {/* Вкладки зверху */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-center gap-6 pt-[calc(0.75rem+var(--safe-area-inset-top,0px))] pb-3 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        {(['following', 'all'] as Tab[]).map((k) => (
          <button key={k} type="button" onClick={() => setTab(k)} aria-pressed={tab === k}
            className={cn('pointer-events-auto text-[17px] font-bold drop-shadow transition', tab === k ? 'text-white border-b-2 border-white pb-0.5' : 'text-white/60')}>
            {k === 'all' ? t('cabinet.reels.forYou') : t('cabinet.reels.following')}
          </button>
        ))}
        <button type="button" onClick={() => setMuted((m) => !m)} aria-label={muted ? t('feed.video.unmute') : t('feed.video.mute')}
          className="pointer-events-auto absolute right-3 top-[calc(0.6rem+var(--safe-area-inset-top,0px))] h-9 w-9 rounded-full bg-black/40 text-white flex items-center justify-center">
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {empty ? (
        <div className="h-full flex items-center justify-center px-4 bg-neutral-100">
          <EmptyState icon={Clapperboard} title={tab === 'following' ? t('cabinet.reels.emptyFollowing') : t('feed.video.empty')}
            description={tab === 'following' ? t('cabinet.reels.emptyFollowingHint') : t('feed.video.emptyHint')}
            actionLabel={tab === 'following' ? t('cabinet.reels.seeAll') : t('feed.video.add')}
            actionHref={tab === 'following' ? undefined : '/feed?create=post'} actionOnClick={tab === 'following' ? () => setTab('all') : undefined} />
        </div>
      ) : (
        <div ref={listRef} className="mx-auto max-w-md h-full overflow-y-scroll snap-y snap-mandatory scrollbar-none overscroll-contain">
          {posts.map((p, i) => (
            <Reel key={p.id} post={p} muted={muted} active={undefined} signedIn={!!me}
              onUnmute={() => setMuted(false)} onLike={like} onFollow={follow} onSave={save} onShare={share} onComments={() => setCommentsFor(p)}
              nearEnd={!done && i >= posts.length - 3} onNearEnd={() => cursor && load(cursor, tab)} />
          ))}
          {loading && <div className="h-full snap-start flex items-center justify-center text-white/60 text-sm">…</div>}
        </div>
      )}

      {/* Коментарі знизу */}
      {commentsFor && (
        <div className="absolute inset-0 z-30 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label={t('cabinet.reels.comments')}>
          <button type="button" className="absolute inset-0 bg-black/50" aria-label={t('cabinet.feedMenu.close')} onClick={() => setCommentsFor(null)} />
          <div className="relative mx-auto w-full max-w-md max-h-[75%] min-h-[50%] bg-white rounded-t-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
              <h2 className="font-bold">{t('cabinet.reels.comments')} · {commentsFor.commentsCount}</h2>
              <button type="button" onClick={() => setCommentsFor(null)} aria-label={t('cabinet.feedMenu.close')} className="h-8 w-8 rounded-full hover:bg-neutral-100 flex items-center justify-center"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-3">
              <PostComments postId={commentsFor.id} canComment={!!me} onCountChange={(d) => { const id = commentsFor.id; patch(id, (p) => ({ commentsCount: Math.max(0, p.commentsCount + d) })); setCommentsFor((c) => (c ? { ...c, commentsCount: Math.max(0, c.commentsCount + d) } : c)); }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ReelProps {
  post: FeedPost; muted: boolean; active?: undefined; signedIn: boolean; nearEnd: boolean;
  onUnmute: () => void; onLike: (id: number, force?: boolean) => void; onFollow: (p: FeedPost) => void; onSave: (p: FeedPost) => void;
  onShare: (p: FeedPost) => void; onComments: () => void; onNearEnd: () => void;
}

function Reel({ post, muted, signedIn, nearEnd, onUnmute, onLike, onFollow, onSave, onShare, onComments, onNearEnd }: ReelProps) {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const vref = useRef<HTMLVideoElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const lastTap = useRef(0);
  const [paused, setPaused] = useState(false);
  const [burst, setBurst] = useState<{ x: number; y: number; k: number } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const nearEndRef = useRef(onNearEnd);
  nearEndRef.current = onNearEnd;

  // Автозапуск, коли рілс займає екран; пауза, коли його прокрутили
  useEffect(() => {
    const el = ref.current, video = vref.current;
    if (!el || !video) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.intersectionRatio > 0.65) {
        video.currentTime = 0;
        video.play().then(() => setPaused(false)).catch(() => setPaused(true));
        if (nearEnd) nearEndRef.current();
      } else {
        video.pause();
      }
    }, { threshold: [0, 0.65, 1] });
    io.observe(el);
    return () => io.disconnect();
  }, [nearEnd]);

  const onTime = () => {
    const v = vref.current, bar = barRef.current;
    if (v && bar && v.duration) bar.style.width = `${(v.currentTime / v.duration) * 100}%`;
  };

  const onTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    const rect = e.currentTarget.getBoundingClientRect();
    if (now - lastTap.current < 300) {
      // подвійний тап — лайк із серцем
      lastTap.current = 0;
      setBurst({ x: e.clientX - rect.left, y: e.clientY - rect.top, k: now });
      if (!post.viewer.liked) onLike(post.id, true);
      setTimeout(() => setBurst((b) => (b && b.k === now ? null : b)), 800);
      return;
    }
    lastTap.current = now;
    setTimeout(() => {
      if (lastTap.current !== now) return; // це був подвійний тап
      lastTap.current = 0;
      const v = vref.current;
      if (!v) return;
      if (muted) onUnmute(); // перший тап вмикає звук (браузер вимагає жест)
      else if (v.paused) { v.play().catch(() => undefined); setPaused(false); }
      else { v.pause(); setPaused(true); }
    }, 300);
  };

  if (!post.video) return null;
  const { author } = post;
  const num = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : String(n));
  const showFollow = signedIn && !post.viewer.isOwn && !post.viewer.following;

  return (
    <div ref={ref} className="relative h-full snap-start snap-always bg-black overflow-hidden select-none">
      <video ref={vref} src={post.video.url} poster={post.video.posterUrl || undefined} loop playsInline muted={muted} preload="metadata"
        onTimeUpdate={onTime} className="absolute inset-0 h-full w-full object-contain" />
      {/* Область тапу (пауза / подвійний тап) */}
      <div onClick={onTap} className="absolute inset-0 z-10" aria-hidden />
      {paused && <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"><span className="h-20 w-20 rounded-full bg-black/40 flex items-center justify-center"><Play className="w-10 h-10 text-white fill-white" /></span></div>}
      {burst && <Heart key={burst.k} className="absolute z-10 w-24 h-24 -ml-12 -mt-12 text-red-500 fill-red-500 pointer-events-none animate-ping" style={{ left: burst.x, top: burst.y }} />}

      {/* Права панель */}
      <div className="absolute right-2 bottom-24 z-20 flex flex-col items-center gap-5 text-white">
        <div className="relative">
          <Link href={`/profile/${author.id}`} aria-label={author.name}><UserAvatar src={author.avatarUrl} alt={author.name} fallbackName={author.name} className="w-12 h-12 rounded-full border-2 border-white" /></Link>
          {showFollow && (
            <button type="button" onClick={() => onFollow(post)} aria-label={t('cabinet.reels.follow')} className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-accent-500 text-white flex items-center justify-center shadow"><Plus className="w-4 h-4" /></button>
          )}
          {signedIn && !post.viewer.isOwn && post.viewer.following && (
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-white text-green-600 flex items-center justify-center shadow"><Check className="w-4 h-4" /></span>
          )}
        </div>
        <button type="button" onClick={() => onLike(post.id)} aria-label="like" aria-pressed={post.viewer.liked} className="flex flex-col items-center gap-0.5 drop-shadow">
          <Heart className={cn('w-9 h-9', post.viewer.liked ? 'fill-red-500 text-red-500' : '')} /><span className="text-xs font-semibold">{num(post.likesCount)}</span>
        </button>
        <button type="button" onClick={onComments} aria-label={t('cabinet.reels.comments')} className="flex flex-col items-center gap-0.5 drop-shadow">
          <MessageCircle className="w-9 h-9" /><span className="text-xs font-semibold">{num(post.commentsCount)}</span>
        </button>
        {signedIn && (
          <button type="button" onClick={() => onSave(post)} aria-label={t('cabinet.reels.save')} aria-pressed={!!post.viewer.saved} className="flex flex-col items-center gap-0.5 drop-shadow">
            <Bookmark className={cn('w-8 h-8', post.viewer.saved ? 'fill-yellow-400 text-yellow-400' : '')} />
          </button>
        )}
        <button type="button" onClick={() => onShare(post)} aria-label={t('cabinet.reels.share')} className="flex flex-col items-center gap-0.5 drop-shadow">
          <Share2 className="w-8 h-8" />
        </button>
      </div>

      {/* Підпис унизу */}
      <div className="absolute left-0 right-16 bottom-0 z-20 px-3 pb-5 pt-16 bg-gradient-to-t from-black/75 via-black/30 to-transparent text-white pointer-events-none">
        <Link href={`/profile/${author.id}`} className="pointer-events-auto inline-block font-bold text-[15px] drop-shadow">@{author.name}</Link>
        {post.content && (
          <p onClick={() => setExpanded((v) => !v)} className={cn('pointer-events-auto mt-1 text-sm leading-snug drop-shadow cursor-pointer', expanded ? '' : 'line-clamp-2')}><RichText text={post.content} /></p>
        )}
      </div>
      {/* Прогрес відео */}
      <div className="absolute inset-x-0 bottom-0 z-20 h-[3px] bg-white/25"><div ref={barRef} className="h-full w-0 bg-white" /></div>
    </div>
  );
}
