'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, Loader2, MapPin, MessageCircle, Pencil, UserCheck, UserPlus } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { authHeaders, jsonHeaders } from '@/lib/feedClient';

interface Stats { followers: number; following: number; isFollowing: boolean; likes?: number }

/**
 * Шапка кабінету як у TikTok: ім'я, місто, кругла аватарка, три лічильники (Підписки, Підписники, Вподобання),
 * опис і кнопки в один ряд. Нижче одразу вкладки й сітка (ProfilePosts).
 */
export function ProfileHeaderTT({ profile, isOwn, canWrite, canFollow, editHref }: { profile: any; isOwn: boolean; canWrite: boolean; canFollow: boolean; editHref: string }) {
  const { t } = useI18n();
  const toast = useToast();
  const userId = Number(profile.id);
  const [stats, setStats] = useState<Stats | null>(null);
  const [busy, setBusy] = useState(false);
  const name = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim();

  useEffect(() => {
    let off = false;
    fetch(`/api/users/${userId}/social`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!off && d) setStats(d); })
      .catch(() => undefined);
    return () => { off = true; };
  }, [userId]);

  const toggle = async () => {
    if (!stats || busy) return;
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

  const counters = [
    { label: t('feed.profile.stats.following'), value: stats?.following ?? 0 },
    { label: t('feed.profile.stats.followers'), value: stats?.followers ?? 0 },
    { label: t('feed.profile.stats.likes'), value: stats?.likes ?? 0 },
  ];
  const btn = 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition active:scale-95';

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-extrabold text-neutral-900 leading-tight break-words">{name}</h1>
          {profile.city && <p className="mt-1 inline-flex items-center gap-1 text-sm text-neutral-500"><MapPin className="w-4 h-4" />{profile.city}</p>}
        </div>
        <UserAvatar src={profile.avatarUrl} alt={name} fallbackName={name} className="h-24 w-24 shrink-0 rounded-full" />
      </div>

      <dl className="flex gap-8">
        {counters.map((c) => (
          <div key={c.label}>
            <dd className="text-2xl font-bold text-neutral-900 leading-none">{c.value}</dd>
            <dt className="mt-1 text-sm text-neutral-500">{c.label}</dt>
          </div>
        ))}
      </dl>

      {profile.bio && <p className="text-neutral-800 whitespace-pre-line break-words">{profile.bio}</p>}

      <div className="flex flex-wrap gap-2">
        {isOwn ? (
          <>
            <Link href={editHref} className={cn(btn, 'bg-primary-500 hover:bg-primary-600 text-white')}><Pencil className="w-4 h-4" />{t('profile.view.actions.edit')}</Link>
            <Link href="/menu/viewers" className={cn(btn, 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800')}><Eye className="w-4 h-4" />{t('feed.profile.viewers')}</Link>
          </>
        ) : (
          <>
            {canFollow && (
              <button type="button" onClick={toggle} disabled={busy || !stats} className={cn(btn, stats?.isFollowing ? 'bg-neutral-200 text-neutral-800 hover:bg-neutral-300' : 'bg-primary-500 hover:bg-primary-600 text-white')}>
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : stats?.isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {stats?.isFollowing ? t('feed.post.following') : t('feed.post.follow')}
              </button>
            )}
            {canWrite && <Link href={`/chat?with=${profile.id}`} className={cn(btn, 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800')}><MessageCircle className="w-4 h-4" />{t('profile.view.actions.write')}</Link>}
          </>
        )}
      </div>
    </section>
  );
}
