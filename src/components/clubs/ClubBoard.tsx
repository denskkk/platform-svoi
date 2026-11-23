'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { PostCard } from '@/components/feed/PostCard';
import { PostComposer } from '@/components/feed/PostComposer';
import { useI18n } from '@/i18n/client';
import { authHeaders, readStoredUser, type FeedPost } from '@/lib/feedClient';

/** Дошка спільноти: дописи власника та учасників із правом писати. Коментувати можуть учасники. */
export function ClubBoard({ clubId, canPost, canComment }: { clubId: number; canPost: boolean; canComment: boolean }) {
  const { t } = useI18n();
  const me = readStoredUser();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [more, setMore] = useState(false);

  const load = useCallback(async (after: number | null) => {
    try {
      const qs = new URLSearchParams({ clubId: String(clubId) });
      if (after) qs.set('cursor', String(after));
      const res = await fetch(`/api/feed?${qs}`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPosts((prev) => (after ? [...prev, ...data.posts] : data.posts));
      setCursor(data.nextCursor ?? null);
      setState('ready');
    } catch { setState('error'); }
  }, [clubId]);
  useEffect(() => { load(null); }, [load]);

  const patch = useCallback((id: number, p: Partial<FeedPost>) => setPosts((prev) => prev.map((x) => (x.id === id ? { ...x, ...p } : x))), []);
  const remove = useCallback((id: number) => setPosts((prev) => prev.filter((x) => x.id !== id)), []);
  const noop = useCallback(() => {}, []);

  return (
    <section className="space-y-3">
      <h2 className="font-semibold text-neutral-900 px-1">{t('clubs.board')}</h2>
      {canPost && <PostComposer clubId={clubId} canPost user={me} onPosted={(p) => setPosts((prev) => [p, ...prev])} />}
      {!canPost && <p className="text-xs text-neutral-500 px-1">{t('clubs.readOnly')}</p>}
      {state === 'loading' && <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-neutral-400" /></div>}
      {state === 'error' && <p className="text-sm text-red-600 px-1">{t('clubs.loadFailed')}</p>}
      {state === 'ready' && posts.length === 0 && <div className="rounded-2xl bg-white p-6 text-center text-sm text-neutral-600">{t('clubs.boardEmpty')}</div>}
      {posts.map((post) => (
        <PostCard key={post.id} post={post} canInteract={canComment} canFollow={false} onChange={patch} onFollowChange={noop} onDeleted={remove} />
      ))}
      {cursor && (
        <button type="button" disabled={more} onClick={async () => { setMore(true); await load(cursor); setMore(false); }} className="w-full rounded-xl bg-white border border-neutral-200 py-2.5 text-sm font-semibold">
          {more ? <Loader2 className="w-4 h-4 animate-spin inline" /> : t('clubs.loadMore')}
        </button>
      )}
    </section>
  );
}
