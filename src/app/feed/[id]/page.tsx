'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { PostCard } from '@/components/feed/PostCard';
import { useI18n } from '@/i18n/client';
import { FeedPost, authHeaders, readStoredUser } from '@/lib/feedClient';

export default function SinglePostPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const [post, setPost] = useState<FeedPost | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [user, setUser] = useState<ReturnType<typeof readStoredUser>>(null);

  useEffect(() => {
    const stored = readStoredUser();
    if (!stored) {
      router.replace(`/auth/login?returnUrl=/feed/${params.id}`);
      return;
    }
    setUser(stored);
  }, [router, params.id]);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/posts/${params.id}`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
      if (res.status === 401) { router.replace(`/auth/login?returnUrl=/feed/${params.id}`); return; }
      if (res.status === 404) { setState('missing'); return; }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error();
      setPost(data.post);
      setState('ready');
    } catch {
      setState('error');
    }
  }, [params.id, router]);

  useEffect(() => { if (user) load(); }, [user, load]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto w-full max-w-xl px-3 sm:px-4 pt-4 pb-28 md:pb-10 space-y-4">
        <Link href="/feed" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-primary-700">
          <ArrowLeft className="w-4 h-4" /> {t('feed.single.back')}
        </Link>

        {state === 'loading' && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}

        {state === 'missing' && (
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 text-center text-neutral-600">{t('feed.single.notFound')}</div>
        )}

        {state === 'error' && (
          <div className="bg-white rounded-2xl border border-red-100 p-6 text-center space-y-3">
            <p className="text-sm text-red-600">{t('feed.errors.load')}</p>
            <button type="button" onClick={() => { setState('loading'); load(); }} className="rounded-full bg-primary-500 text-white text-sm font-semibold px-5 py-2">{t('feed.retry')}</button>
          </div>
        )}

        {state === 'ready' && post && (
          <PostCard
            post={post}
            canInteract={user.accountType !== 'viewer'}
            canFollow
            autoOpenComments
            onChange={(_id, patch) => setPost((p) => (p ? { ...p, ...patch } : p))}
            onFollowChange={(_authorId, following) => setPost((p) => (p ? { ...p, viewer: { ...p.viewer, following } } : p))}
            onDeleted={() => router.replace('/feed')}
            onBlocked={() => router.replace('/feed')}
          />
        )}
      </div>
    </div>
  );
}
