'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Clapperboard, Heart, MessageCircle, Volume2, VolumeX } from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { useI18n } from '@/i18n/client';
import { FeedPost, authHeaders, jsonHeaders } from '@/lib/feedClient';

/** Відео-стрічка (Shorts): вертикальна прокрутка, автозапуск видимого відео, лайки та перехід до допису. */
export default function VideoPage() {
  const { t } = useI18n();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [muted, setMuted] = useState(true);
  const loadingRef = useRef(false);

  const load = useCallback(async (next: number | null) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const qs = new URLSearchParams({ videos: '1', limit: '8' });
      if (next) qs.set('cursor', String(next));
      const res = await fetch(`/api/feed?${qs}`, { credentials: 'include', headers: authHeaders() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      setPosts((prev) => [...prev, ...(data.posts as FeedPost[]).filter((p) => !prev.some((x) => x.id === p.id))]);
      setCursor(data.nextCursor);
      if (!data.nextCursor) setDone(true);
    } catch {
      setDone(true);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(null); }, [load]);

  const toggleLike = async (id: number) => {
    const post = posts.find((p) => p.id === id);
    if (!post) return;
    const liked = !post.viewer.liked;
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, likesCount: p.likesCount + (liked ? 1 : -1), viewer: { ...p.viewer, liked } } : p));
    try {
      const res = await fetch(`/api/posts/${id}/like`, { method: liked ? 'POST' : 'DELETE', credentials: 'include', headers: jsonHeaders() });
      if (!res.ok) throw new Error();
    } catch {
      setPosts((prev) => prev.map((p) => p.id === id ? { ...p, likesCount: post.likesCount, viewer: { ...p.viewer, liked: post.viewer.liked } } : p));
    }
  };

  if (!loading && posts.length === 0) {
    return (
      <div className="min-h-[70vh] bg-neutral-100 flex items-center justify-center px-4">
        <EmptyState icon={Clapperboard} title={t('feed.video.empty')} description={t('feed.video.emptyHint')}
          actionLabel={t('feed.video.add')} actionHref="/feed?create=post" />
      </div>
    );
  }

  return (
    <div className="bg-black">
      <div className="mx-auto max-w-md h-[calc(100dvh-9.5rem)] md:h-[calc(100dvh-4rem)] overflow-y-scroll snap-y snap-mandatory scrollbar-none">
        {posts.map((p, i) => (
          <ShortItem key={p.id} post={p} muted={muted} onToggleMute={() => setMuted((m) => !m)} onLike={() => toggleLike(p.id)}
            nearEnd={!done && i >= posts.length - 3} onNearEnd={() => cursor && load(cursor)} />
        ))}
        {loading && <div className="h-full snap-start flex items-center justify-center text-white/60 text-sm">…</div>}
      </div>
    </div>
  );
}

function ShortItem({ post, muted, onToggleMute, onLike, nearEnd, onNearEnd }: {
  post: FeedPost; muted: boolean; onToggleMute: () => void; onLike: () => void; nearEnd: boolean; onNearEnd: () => void;
}) {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const vref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    const video = vref.current;
    if (!el || !video) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
        video.play().catch(() => undefined);
        if (nearEnd) onNearEnd();
      } else {
        video.pause();
      }
    }, { threshold: [0, 0.6, 1] });
    io.observe(el);
    return () => io.disconnect();
  }, [nearEnd, onNearEnd]);

  if (!post.video) return null;
  const { author } = post;
  return (
    <div ref={ref} className="relative h-full snap-start snap-always flex items-center justify-center">
      <video ref={vref} src={post.video.url} poster={post.video.posterUrl || undefined} loop playsInline muted={muted} preload="metadata"
        onClick={() => { const v = vref.current; if (v) (v.paused ? v.play() : v.pause()); }}
        className="h-full w-full object-contain" />
      <button type="button" onClick={onToggleMute} aria-label={muted ? t('feed.video.unmute') : t('feed.video.mute')}
        className="absolute top-3 right-3 h-9 w-9 rounded-full bg-black/50 text-white flex items-center justify-center">
        {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>
      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-4 text-white">
        <button type="button" onClick={onLike} aria-label="like" className="flex flex-col items-center gap-1">
          <span className="h-11 w-11 rounded-full bg-black/50 flex items-center justify-center">
            <Heart className={`w-6 h-6 ${post.viewer.liked ? 'fill-red-500 text-red-500' : ''}`} />
          </span>
          <span className="text-xs">{post.likesCount}</span>
        </button>
        <Link href={`/feed#post-${post.id}`} aria-label={t('feed.video.open')} className="flex flex-col items-center gap-1">
          <span className="h-11 w-11 rounded-full bg-black/50 flex items-center justify-center"><MessageCircle className="w-6 h-6" /></span>
          <span className="text-xs">{post.commentsCount}</span>
        </Link>
      </div>
      <div className="absolute left-0 right-16 bottom-0 p-4 bg-gradient-to-t from-black/70 to-transparent text-white">
        <Link href={`/profile/${author.id}`} className="flex items-center gap-2 font-semibold">
          <UserAvatar src={author.avatarUrl} alt={author.name} fallbackName={author.name} className="w-8 h-8 rounded-full" />
          <span className="truncate">{author.name}</span>
        </Link>
        {post.content && <p className="mt-2 text-sm line-clamp-3">{post.content}</p>}
      </div>
    </div>
  );
}
