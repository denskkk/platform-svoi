'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, Check, Loader2, UserPlus } from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { authHeaders, jsonHeaders } from '@/lib/feedClient';

interface Rec { id: number; name: string; avatarUrl: string | null; city: string | null; subtitle: string | null; isVerified: boolean }

function Row({ title, items, followed, busyId, onFollow, followLabel, followedLabel }: {
  title: string; items: Rec[]; followed: Set<number>; busyId: number | null;
  onFollow: (id: number) => void; followLabel: string; followedLabel: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
      <ul className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
        {items.map((r) => (
          <li key={r.id} className="snap-start shrink-0 w-36 rounded-2xl border border-neutral-200/70 bg-neutral-50 p-3 flex flex-col items-center text-center gap-1.5">
            <Link href={`/profile/${r.id}`} className="flex flex-col items-center gap-1 min-w-0 w-full">
              <UserAvatar src={r.avatarUrl} alt={r.name} fallbackName={r.name} className="w-14 h-14 rounded-full" />
              <span className="flex items-center gap-1 max-w-full text-sm font-semibold text-neutral-900"><span className="truncate">{r.name}</span>{r.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-accent-500 shrink-0" />}</span>
              <span className="text-[11px] text-neutral-500 truncate max-w-full">{[r.city, r.subtitle].filter(Boolean).join(' · ') || ' '}</span>
            </Link>
            <button type="button" disabled={followed.has(r.id) || busyId === r.id} onClick={() => onFollow(r.id)}
              className="mt-auto inline-flex items-center gap-1 rounded-full bg-primary-500 hover:bg-primary-600 disabled:bg-neutral-200 disabled:text-neutral-600 text-white text-xs font-semibold px-3 py-1.5">
              {busyId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : followed.has(r.id) ? <Check className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
              {followed.has(r.id) ? followedLabel : followLabel}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Recommendations({ canFollow, onFollowed }: { canFollow: boolean; onFollowed?: (userId: number) => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const [data, setData] = useState<{ people: Rec[]; business: Rec[] } | null>(null);
  const [followed, setFollowed] = useState<Set<number>>(new Set());
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/recommendations', { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch { /* рекомендації необов’язкові */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const follow = async (id: number) => {
    if (!canFollow || busyId) return;
    setBusyId(id);
    try {
      const res = await fetch('/api/follows', { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ userId: id }) });
      if (!res.ok) throw new Error();
      setFollowed((prev) => new Set(prev).add(id));
      onFollowed?.(id);
      toast.success(t('feed.toast.followed'));
    } catch {
      toast.error(t('feed.toast.actionFailed'));
    } finally {
      setBusyId(null);
    }
  };

  if (!data || (data.people.length === 0 && data.business.length === 0)) return null;
  const common = { followed, busyId, onFollow: follow, followLabel: t('feed.recommendations.follow'), followedLabel: t('feed.recommendations.followed') };
  return (
    <section className="bg-white rounded-2xl border border-neutral-200/70 shadow-sm p-4 space-y-4" aria-label={t('feed.recommendations.title')}>
      <Row title={t('feed.recommendations.people')} items={data.people} {...common} />
      <Row title={t('feed.recommendations.business')} items={data.business} {...common} />
    </section>
  );
}
