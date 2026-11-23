'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bookmark, Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { PostCard } from '@/components/feed/PostCard';
import { useI18n } from '@/i18n/client';
import { FeedPost, authHeaders, readStoredUser } from '@/lib/feedClient';

export default function SavedPostsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [canInteract, setCanInteract] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  const fetchPage = useCallback(async (after: number | null) => {
    const qs = new URLSearchParams({ saved: '1' });
    if (after) qs.set('cursor', String(after));
    const res = await fetch(`/api/feed?${qs}`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
    if (res.status === 401) { router.replace('/auth/login?returnUrl=/saved'); throw new Error('auth'); }
    if (!res.ok) throw new Error();
    return (await res.json()) as { posts: FeedPost[]; nextCursor: number | null };
  }, [router]);

  useEffect(() => {
    const user = readStoredUser();
    if (!user) { router.replace('/auth/login?returnUrl=/saved'); return; }
    setCanInteract(user.accountType !== 'viewer');
    (async () => {
      try {
        const data = await fetchPage(null);
        setPosts(data.posts);
        setCursor(data.nextCursor);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [router, fetchPage]);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore || loading) return;
    setLoadingMore(true);
    try {
      const data = await fetchPage(cursor);
      setPosts((prev) => [...prev, ...data.posts.filter((p) => !prev.some((x) => x.id === p.id))]);
      setCursor(data.nextCursor);
    } catch {
      setError(true);
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, loadingMore, loading, fetchPage]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => { if (entries[0].isIntersecting) loadMore(); }, { rootMargin: '600px 0px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const patchPost = useCallback((id: number, patch: Partial<FeedPost>) => {
    setPosts((prev) => {
      // зняття закладки прибирає допис зі списку
      if (patch.viewer && patch.viewer.saved === false) return prev.filter((p) => p.id !== id);
      return prev.map((p) => (p.id === id ? { ...p, ...patch } : p));
    });
  }, []);
  const setFollowing = useCallback((authorId: number, following: boolean) => {
    setPosts((prev) => prev.map((p) => (p.author.id === authorId ? { ...p, viewer: { ...p.viewer, following } } : p)));
  }, []);
  const removePost = useCallback((id: number) => setPosts((prev) => prev.filter((p) => p.id !== id)), []);
  const removeByAuthor = useCallback((authorId: number) => setPosts((prev) => prev.filter((p) => p.author.id !== authorId)), []);

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto w-full max-w-xl px-3 sm:px-4 pt-4 pb-28 md:pb-10 space-y-4">
        <Link href="/feed" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-primary-700">
          <ArrowLeft className="w-4 h-4" /> {t('feed.saved.back')}
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900">{t('feed.saved.title')}</h1>

        {loading && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}
        {!loading && error && posts.length === 0 && <p className="text-center text-sm text-red-600 py-6">{t('feed.errors.load')}</p>}
        {!loading && !error && posts.length === 0 && <EmptyState icon={Bookmark} title={t('feed.saved.title')} description={t('feed.saved.empty')} />}

        {posts.map((post) => (
          <PostCard key={post.id} post={post} canInteract={canInteract} canFollow onChange={patchPost} onFollowChange={setFollowing} onDeleted={removePost} onBlocked={removeByAuthor} />
        ))}

        <div ref={sentinel} aria-hidden className="h-1" />
        {loadingMore && <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}
      </div>
    </div>
  );
}
