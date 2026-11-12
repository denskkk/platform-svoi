'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Heart, Loader2, MessageCircle, UserPlus } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { authHeaders, jsonHeaders, timeAgo } from '@/lib/feedClient';

interface Item {
  id: number;
  type: string;
  title: string;
  message: string | null;
  isRead: boolean;
  createdAt: string;
  relatedEntityType: string | null;
  relatedEntityId: number | null;
  actor: { id: number; name: string; avatarUrl: string | null } | null;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [items, setItems] = useState<Item[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (after?: number | null) => {
    try {
      const res = await fetch(`/api/notifications${after ? `?cursor=${after}` : ''}`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
      if (res.status === 401) { router.replace('/auth/login?returnUrl=/notifications'); return; }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      setItems((prev) => (after ? [...prev, ...data.notifications] : data.notifications));
      setCursor(data.nextCursor ?? null);
      setUnread(data.unreadCount ?? 0);
      setError('');
    } catch (e: any) {
      setError(e?.message || t('feed.notifications.loadFailed'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [router, t]);

  useEffect(() => { load(null); }, [load]);

  const markRead = async (body: { all: true } | { ids: number[] }) => {
    try {
      const res = await fetch('/api/notifications/read', { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setUnread(data.unreadCount ?? 0);
        window.dispatchEvent(new Event('notifications:changed'));
      }
    } catch { /* не критично */ }
  };

  const markAll = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await markRead({ all: true });
  };

  const open = (n: Item) => {
    if (!n.isRead) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      markRead({ ids: [n.id] });
    }
  };

  const hrefFor = (n: Item): string | null => {
    if (n.relatedEntityType === 'post' && n.relatedEntityId) return `/feed/${n.relatedEntityId}`;
    if (n.relatedEntityType === 'listing' && n.relatedEntityId) return `/listings/${n.relatedEntityId}`;
    if (n.relatedEntityType === 'business_application') return '/business/apply';
    if (n.type === 'new_follower' && n.actor) return `/profile/${n.actor.id}`;
    return null;
  };

  const textFor = (n: Item) => {
    const who = n.actor?.name || t('feed.notifications.someone');
    if (n.type === 'post_like') return t('feed.notifications.postLike', { name: who });
    if (n.type === 'post_comment') return t('feed.notifications.postComment', { name: who });
    if (n.type === 'new_follower') return t('feed.notifications.newFollower', { name: who });
    if (n.type === 'listing_approved') return t('feed.notifications.listingApproved');
    if (n.type === 'listing_rejected') return t('feed.notifications.listingRejected');
    if (n.type === 'business_approved') return t('feed.notifications.businessApproved');
    if (n.type === 'business_rejected') return t('feed.notifications.businessRejected');
    return n.title;
  };

  const iconFor = (type: string) => {
    if (type === 'post_like') return <Heart className="w-3.5 h-3.5 fill-current" />;
    if (type === 'post_comment') return <MessageCircle className="w-3.5 h-3.5" />;
    if (type === 'new_follower') return <UserPlus className="w-3.5 h-3.5" />;
    return <Bell className="w-3.5 h-3.5" />;
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto w-full max-w-xl px-3 sm:px-4 pt-4 pb-28 md:pb-10 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900">{t('feed.notifications.title')}</h1>
          {unread > 0 && (
            <button type="button" onClick={markAll} className="text-sm font-medium text-accent-600">{t('feed.notifications.markAll')}</button>
          )}
        </div>

        {loading && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}

        {!loading && error && items.length === 0 && (
          <div className="bg-white rounded-2xl border border-red-100 p-6 text-center space-y-3">
            <p className="text-sm text-red-600">{error}</p>
            <button type="button" onClick={() => { setLoading(true); load(null); }} className="rounded-full bg-primary-500 text-white text-sm font-semibold px-5 py-2">{t('feed.retry')}</button>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <EmptyState icon={Bell} title={t('feed.notifications.empty.title')} description={t('feed.notifications.empty.description')} />
        )}

        <ul className="space-y-2">
          {items.map((n) => {
            const href = hrefFor(n);
            const body = (
              <div className={cn('flex gap-3 rounded-2xl border p-3 transition', n.isRead ? 'bg-white border-neutral-200/70' : 'bg-primary-50 border-primary-200')}>
                <div className="relative shrink-0">
                  <UserAvatar src={n.actor?.avatarUrl} alt={n.actor?.name || ''} fallbackName={n.actor?.name || '?'} className="w-11 h-11 rounded-full" />
                  <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-accent-500 text-white flex items-center justify-center border-2 border-white">{iconFor(n.type)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-neutral-900">{textFor(n)}</p>
                  {n.message && <p className="text-sm text-neutral-600 line-clamp-2 mt-0.5">{n.message}</p>}
                  <p className="text-xs text-neutral-500 mt-1">{timeAgo(n.createdAt, locale, t('feed.post.justNow'))}</p>
                </div>
                {!n.isRead && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary-500 shrink-0" aria-hidden />}
              </div>
            );
            return (
              <li key={n.id}>
                {href ? <Link href={href} onClick={() => open(n)}>{body}</Link> : <button type="button" className="w-full text-left" onClick={() => open(n)}>{body}</button>}
              </li>
            );
          })}
        </ul>

        {cursor && (
          <div className="text-center">
            <button type="button" disabled={loadingMore} onClick={() => { setLoadingMore(true); load(cursor); }} className="text-sm font-medium text-accent-600">
              {loadingMore ? t('feed.pull.refreshing') : t('feed.comments.loadMore')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
