'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, Loader2, Star, UserCheck, UserPlus } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { authHeaders, jsonHeaders, readStoredUser } from '@/lib/feedClient';

interface Stats { posts: number; followers: number; following: number; isFollowing: boolean; likes?: number; isActiveParticipant?: boolean; invited?: number; completedDeals?: number }

/** Соціальна панель профілю: лічильники та кнопка «Стежити». Для гостей не показується. */
export function ProfileSocialBar({ userId, isOwn }: { userId: number; isOwn: boolean }) {
  const { t } = useI18n();
  const toast = useToast();
  const [stats, setStats] = useState<Stats | null>(null);
  const [busy, setBusy] = useState(false);
  const [canFollow, setCanFollow] = useState(false);

  useEffect(() => {
    const me = readStoredUser();
    if (!me) return;
    setCanFollow(me.accountType !== 'viewer');
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/users/${userId}/social`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setStats(data);
      } catch { /* панель необов’язкова */ }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  if (!stats) return null;

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    const next = !stats.isFollowing;
    setStats({ ...stats, isFollowing: next, followers: Math.max(0, stats.followers + (next ? 1 : -1)) });
    try {
      const res = next
        ? await fetch('/api/follows', { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ userId }) })
        : await fetch(`/api/follows?userId=${userId}`, { method: 'DELETE', credentials: 'include', headers: authHeaders() });
      if (!res.ok) throw new Error();
    } catch {
      setStats(stats);
      toast.error(t('feed.toast.actionFailed'));
    } finally {
      setBusy(false);
    }
  };

  const items = [
    { label: t('feed.profile.stats.posts'), value: stats.posts },
    { label: t('feed.profile.stats.followers'), value: stats.followers },
    { label: t('feed.profile.stats.following'), value: stats.following },
    { label: t('feed.profile.stats.likes'), value: stats.likes ?? 0 },
    ...(isOwn ? [
      { label: t('feed.profile.stats.invited'), value: stats.invited ?? 0 },
      { label: t('feed.profile.stats.deals'), value: stats.completedDeals ?? 0 },
    ] : []),
  ];

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-4">
      <dl className="flex flex-wrap gap-x-6 gap-y-3">
        {items.map((i) => (
          <div key={i.label} className="text-center">
            <dd className="text-xl font-bold text-neutral-900 leading-none">{i.value}</dd>
            <dt className="mt-1 text-xs text-neutral-500">{i.label}</dt>
          </div>
        ))}
      </dl>
      {stats.isActiveParticipant && (
        <span title={t('feed.profile.active.hint')} className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 text-primary-900 text-sm font-semibold px-3 py-1.5">
          <Star className="w-4 h-4 fill-primary-500 text-primary-600" /> {t('feed.profile.active.label')}
        </span>
      )}
      {isOwn && (
        <Link href="/menu/viewers" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-700 hover:underline">
          <Eye className="w-4 h-4" /> {t('feed.profile.viewers')}
        </Link>
      )}
      {!isOwn && canFollow && (
        <button type="button" onClick={toggle} disabled={busy}
          className={cn('inline-flex items-center gap-2 rounded-lg px-5 py-2.5 font-semibold transition active:scale-95', stats.isFollowing ? 'bg-neutral-200 text-neutral-800 hover:bg-neutral-300' : 'bg-primary-500 text-white hover:bg-primary-600')}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : stats.isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          {stats.isFollowing ? t('feed.post.following') : t('feed.post.follow')}
        </button>
      )}
    </div>
  );
}
