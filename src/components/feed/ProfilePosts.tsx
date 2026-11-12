'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { FeedPost, authHeaders, readStoredUser } from '@/lib/feedClient';
import { PostCard } from './PostCard';

/** Дописи одного автора на сторінці профілю. Для гостей (без входу) блок не показується. */
export function ProfilePosts({ authorId }: { authorId: number }) {
  const { t } = useI18n();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [available, setAvailable] = useState(true);
  const [viewerType, setViewerType] = useState<string | null>(null);

  const load = useCallback(async (after?: number | null) => {
    try {
      const qs = new URLSearchParams({ authorId: String(authorId), limit: '5' });
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
  }, [authorId]);

  useEffect(() => {
    const me = readStoredUser();
    if (!me) { setAvailable(false); setLoading(false); return; }
    setViewerType(me.accountType);
    load(null);
  }, [load]);

  const patch = useCallback((id: number, p: Partial<FeedPost>) => setPosts((prev) => prev.map((x) => (x.id === id ? { ...x, ...p } : x))), []);
  const follow = useCallback((_a: number, following: boolean) => setPosts((prev) => prev.map((x) => ({ ...x, viewer: { ...x.viewer, following } }))), []);
  const remove = useCallback((id: number) => setPosts((prev) => prev.filter((x) => x.id !== id)), []);

  if (!available) return null;

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-xl font-bold text-neutral-900 mb-4">{t('feed.profile.title')}</h2>
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-neutral-400" /></div>
      ) : posts.length === 0 ? (
        <p className="text-neutral-500 text-sm">{t('feed.profile.empty')}</p>
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
