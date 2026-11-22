'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/client';
import { FeedPost, authHeaders, readStoredUser } from '@/lib/feedClient';
import { PostCard } from './PostCard';

type Tab = 'posts' | 'reposts' | 'videos' | 'saved' | 'reacted';

/**
 * Профіль як стрічка з вкладками: Дописи, Репости (дві кругові стрілки), Відео, а для власного профілю
 * ще Збережене та Вподобане / Прокоментоване. Для гостей (без входу) блок не показується.
 */
export function ProfilePosts({ authorId }: { authorId: number }) {
  const { t } = useI18n();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [available, setAvailable] = useState(true);
  const [viewerType, setViewerType] = useState<string | null>(null);
  const [isMe, setIsMe] = useState(false);
  const [tab, setTab] = useState<Tab>('posts');

  const load = useCallback(async (after?: number | null) => {
    try {
      const qs = new URLSearchParams({ limit: '5' });
      if (tab === 'saved') qs.set('saved', '1');
      else if (tab === 'reacted') qs.set('reacted', '1');
      else qs.set('authorId', String(authorId));
      if (tab === 'reposts') qs.set('reposts', '1');
      if (tab === 'videos') qs.set('videos', '1');
      if (after) qs.set('cursor', String(after));
      const res = await fetch(`/api/feed?${qs}`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
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
  }, [authorId, tab]);

  useEffect(() => {
    const me = readStoredUser();
    if (!me) { setAvailable(false); setLoading(false); return; }
    setViewerType(me.accountType);
    setIsMe(Number(me.id) === authorId);
  }, [authorId]);

  useEffect(() => { setLoading(true); setPosts([]); setCursor(null); load(null); }, [load]);

  const tabs: Tab[] = isMe ? ['posts', 'reposts', 'videos', 'saved', 'reacted'] : ['posts', 'reposts', 'videos'];

  const patch = useCallback((id: number, p: Partial<FeedPost>) => setPosts((prev) => prev.map((x) => (x.id === id ? { ...x, ...p } : x))), []);
  const follow = useCallback((_a: number, following: boolean) => setPosts((prev) => prev.map((x) => ({ ...x, viewer: { ...x.viewer, following } }))), []);
  const remove = useCallback((id: number) => setPosts((prev) => prev.filter((x) => x.id !== id)), []);

  if (!available) return null;

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-xl font-bold text-neutral-900 mb-3">{t('feed.profile.title')}</h2>
      <div role="tablist" className="flex gap-2 overflow-x-auto pb-3">
        {tabs.map((k) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => { if (tab !== k) setTab(k); }}
            className={cn('shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold border transition', tab === k ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-neutral-700 border-neutral-200 hover:border-primary-300')}>
            {k === 'reposts' && <span aria-hidden>🔁</span>}{t(`feed.profile.tabs.${k}`)}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-neutral-400" /></div>
      ) : posts.length === 0 ? (
        <p className="text-neutral-500 text-sm">{t(`feed.profile.emptyTab.${tab}`)}</p>
      ) : (
        <div className="space-y-4 max-w-xl">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} canInteract={viewerType !== 'viewer'} canFollow onChange={patch} onFollowChange={follow} onDeleted={remove} onBlocked={() => setPosts([])} />
          ))}
          {cursor && (
            <button type="button" disabled={loadingMore} onClick={() => { setLoadingMore(true); load(cursor); }} className="text-sm font-medium text-accent-600">
              {loadingMore ? t('feed.pull.refreshing') : t('feed.profile.loadMore')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
