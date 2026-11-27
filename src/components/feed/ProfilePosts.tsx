'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Bookmark, Clapperboard, Copy, Grid3x3, Heart, Image as ImageIcon, Loader2, Lock, Play, Repeat2 } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { FeedPost, authHeaders, readStoredUser } from '@/lib/feedClient';

type Tab = 'posts' | 'photos' | 'videos' | 'reposts' | 'private' | 'saved' | 'reacted';

const ICONS = { posts: Grid3x3, photos: ImageIcon, videos: Clapperboard, reposts: Repeat2, private: Lock, saved: Bookmark, reacted: Heart } as const;

/** Обкладинка плитки: відео, фото, медіа репосту або кольорова плитка з текстом. */
function mediaOf(post: FeedPost): { kind: 'poster' | 'video' | 'image' | 'text'; src?: string; isVideo: boolean } {
  const v = post.video ?? post.repostOf?.video ?? null;
  if (v) return v.posterUrl ? { kind: 'poster', src: v.posterUrl, isVideo: true } : { kind: 'video', src: v.url, isVideo: true };
  const img = post.images[0] ?? post.repostOf?.images?.[0];
  if (img) return { kind: 'image', src: img.url, isVideo: false };
  return { kind: 'text', isVideo: false };
}

/**
 * Профіль як у TikTok: ряд іконок-вкладок і сітка плиток 3 в ряд.
 *  - сітка: усі дописи автора (відео, фото, текст);
 *  - дві кругові стрілки: репости (вкладка з'являється, лише коли репости є);
 *  - замок, закладка, серце: лише у власному профілі (закриті, збережені, вподобані й прокоментовані).
 * Гостям (без входу) блок не показується.
 */
export function ProfilePosts({ authorId }: { authorId: number }) {
  const { t } = useI18n();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [available, setAvailable] = useState(true);
  const [isMe, setIsMe] = useState(false);
  const [hasReposts, setHasReposts] = useState(false);
  const [tab, setTab] = useState<Tab>('posts');

  const query = useCallback((which: Tab, after?: number | null) => {
    const qs = new URLSearchParams({ limit: '12' });
    if (which === 'saved') qs.set('saved', '1');
    else if (which === 'reacted') qs.set('reacted', '1');
    else if (which === 'private') qs.set('private', '1');
    else qs.set('authorId', String(authorId));
    if (which === 'reposts') qs.set('reposts', '1');
    if (which === 'photos') qs.set('media', 'photo');
    if (which === 'videos') qs.set('media', 'video');
    if (after) qs.set('cursor', String(after));
    return fetch(`/api/feed?${qs}`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
  }, [authorId]);

  const load = useCallback(async (after?: number | null) => {
    try {
      const res = await query(tab, after);
      if (!res.ok) { setAvailable(false); return; }
      const data = await res.json();
      setPosts((prev) => (after ? [...prev, ...data.posts] : data.posts));
      setCursor(data.nextCursor ?? null);
    } catch {
      setAvailable(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [query, tab]);

  // Хто дивиться і чи є в автора репости (від цього залежить вкладка зі стрілками)
  useEffect(() => {
    const me = readStoredUser();
    if (!me) { setAvailable(false); setLoading(false); return; }
    setIsMe(Number(me.id) === authorId);
    let off = false;
    query('reposts').then((r) => (r.ok ? r.json() : null)).then((d) => { if (!off && d) setHasReposts(d.posts.length > 0); }).catch(() => undefined);
    return () => { off = true; };
  }, [authorId, query]);

  useEffect(() => { setLoading(true); setPosts([]); setCursor(null); load(null); }, [load]);

  if (!available) return null;

  const tabs: Tab[] = ['posts', 'photos', 'videos'];
  if (hasReposts) tabs.push('reposts');
  if (isMe) tabs.push('private', 'saved', 'reacted');
  const active: Tab = tabs.indexOf(tab) === -1 ? 'posts' : tab;

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
      <div role="tablist" aria-label={t('feed.profile.title')} className="flex border-b border-neutral-200">
        {tabs.map((k) => {
          const Icon = ICONS[k];
          return (
            <button key={k} type="button" role="tab" aria-selected={active === k} aria-label={t(`feed.profile.tabs.${k}`)} title={t(`feed.profile.tabs.${k}`)}
              onClick={() => { if (tab !== k) setTab(k); }}
              className={cn('flex-1 flex items-center justify-center py-3 border-b-2 transition', active === k ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-400 hover:text-neutral-700')}>
              <Icon className="w-6 h-6" />
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-neutral-400" /></div>
      ) : posts.length === 0 ? (
        <p className="text-neutral-500 text-sm text-center py-10 px-4">{t(`feed.profile.emptyTab.${active}`)}</p>
      ) : (
        <>
          <ul className="grid grid-cols-3 gap-px bg-neutral-200">
            {posts.map((post) => {
              const m = mediaOf(post);
              // Допис із кількох фото/відео: колаж з перших чотирьох і значок-лічильник (як карусель в Instagram)
              const album = !post.repostOf && (post.media?.length ?? 0) > 1 ? post.media! : null;
              return (
                <li key={post.id} className="bg-white">
                  <Link href={post.video && !post.repostOf && post.video.isVertical !== false ? `/video?post=${post.id}&author=${post.author.id}` : `/feed/${post.id}`} className="relative block aspect-[3/4] bg-neutral-900 overflow-hidden">
                    {album
                      ? (
                        <span className={cn('grid h-full w-full gap-px bg-neutral-900', album.length === 2 ? 'grid-cols-2' : 'grid-cols-2 grid-rows-2')}>
                          {album.slice(0, 4).map((it, i) => {
                            const src = it.type === 'image' ? it.url : it.posterUrl;
                            return src
                              // eslint-disable-next-line @next/next/no-img-element
                              ? <img key={`${it.type}-${it.id}`} src={src} alt="" loading="lazy" className={cn('h-full w-full object-cover', album.length === 3 && i === 0 && 'row-span-2')} />
                              : <span key={`${it.type}-${it.id}`} className={cn('flex h-full w-full items-center justify-center bg-neutral-800', album.length === 3 && i === 0 && 'row-span-2')}><Play className="w-5 h-5 fill-white text-white" aria-hidden /></span>;
                          })}
                        </span>
                      )
                    : m.kind === 'poster' || m.kind === 'image'
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={m.src} alt="" loading="lazy" className="h-full w-full object-cover" />
                      : m.kind === 'video'
                        ? <video src={`${m.src}#t=0.1`} preload="metadata" muted playsInline className="h-full w-full object-cover" />
                        : <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-500 to-space-700 p-2 text-center text-xs font-semibold text-white line-clamp-6">{post.content}</span>}
                    {post.repostOf && <Repeat2 className="absolute top-1.5 right-1.5 w-4 h-4 text-white drop-shadow" aria-hidden />}
                    {album && (
                      <span className="absolute top-1.5 right-1.5 inline-flex items-center gap-0.5 rounded-full bg-black/55 px-1.5 py-0.5 text-[11px] font-bold text-white" aria-label={`${album.length}`}>
                        <Copy className="w-3 h-3" aria-hidden />{album.length}
                      </span>
                    )}
                    {post.isPrivate && <Lock className="absolute top-1.5 left-1.5 w-4 h-4 text-white drop-shadow" aria-hidden />}
                    <span className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-6 text-xs font-semibold text-white">
                      {m.isVideo || album?.some((x) => x.type === 'video') ? <Play className="w-3.5 h-3.5 fill-white" aria-hidden /> : <Heart className="w-3.5 h-3.5" aria-hidden />}
                      {post.likesCount}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          {cursor && (
            <button type="button" disabled={loadingMore} onClick={() => { setLoadingMore(true); load(cursor); }} className="w-full py-3 text-sm font-semibold text-primary-700 hover:bg-neutral-50">
              {loadingMore ? t('feed.pull.refreshing') : t('feed.profile.loadMore')}
            </button>
          )}
        </>
      )}
    </div>
  );
}
