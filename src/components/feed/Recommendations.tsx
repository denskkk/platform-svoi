'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, Check, Loader2, UserPlus } from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { authHeaders, jsonHeaders } from '@/lib/feedClient';

interface Rec { id: number; name: string; avatarUrl: string | null; bannerUrl?: string | null; city: string | null; subtitle: string | null; isVerified: boolean }

const GRADIENTS = ['from-[#0a2a5e] to-[#1f4fb5]', 'from-[#0a1f44] to-[#0e7490]', 'from-[#1b1a5e] to-[#6d28d9]', 'from-[#0a2a5e] to-[#15803d]', 'from-[#3b2a1a] to-[#b45309]', 'from-[#4a1d6b] to-[#be185d]'];

function Row({ title, items, followed, busyId, onFollow, followLabel, followedLabel, vertical }: {
  vertical?: boolean; title: string; items: Rec[]; followed: Set<number>; busyId: number | null;
  onFollow: (id: number) => void; followLabel: string; followedLabel: string;
}) {
  if (items.length === 0) return null;
  if (vertical) {
    return (
      <div className="space-y-1">
        <h3 className="text-[17px] font-semibold text-neutral-700 px-1 pb-1">{title}</h3>
        <ul>
          {items.map((r) => (
            <li key={r.id} className="flex items-center gap-3 rounded-lg px-1 py-2 hover:bg-neutral-100">
              <Link href={`/profile/${r.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                <UserAvatar src={r.avatarUrl} alt={r.name} fallbackName={r.name} className="w-10 h-10 rounded-full shrink-0" />
                <span className="min-w-0">
                  <span className="flex items-center gap-1 text-[15px] font-semibold text-neutral-900"><span className="truncate">{r.name}</span>{r.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-accent-500 shrink-0" />}</span>
                  <span className="block text-xs text-neutral-500 truncate">{[r.city, r.subtitle].filter(Boolean).join(' · ')}</span>
                </span>
              </Link>
              <button type="button" disabled={followed.has(r.id) || busyId === r.id} onClick={() => onFollow(r.id)}
                className="shrink-0 inline-flex items-center gap-1 rounded-md bg-primary-50 hover:bg-primary-100 disabled:bg-neutral-100 disabled:text-neutral-500 text-primary-700 text-xs font-semibold px-3 py-1.5">
                {busyId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : followed.has(r.id) ? <Check className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                {followed.has(r.id) ? followedLabel : followLabel}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }
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

/** Бізнеси — великі квадратні картки (обкладинка, логотип, назва, місто/сфера, кнопка «Стежити»). */
function BusinessSquares({ title, hint, items, followed, busyId, onFollow, followLabel, followedLabel, vertical }: {
  title: string; hint?: string; items: Rec[]; followed: Set<number>; busyId: number | null; onFollow: (id: number) => void; followLabel: string; followedLabel: string; vertical?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="px-0.5">
        <h3 className={vertical ? 'text-[17px] font-semibold text-neutral-700' : 'text-base font-bold text-neutral-900'}>{title}</h3>
        {hint && <p className="text-xs text-neutral-500">{hint}</p>}
      </div>
      <ul className={vertical ? 'grid grid-cols-2 gap-2' : 'flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory [scrollbar-width:none]'}>
        {items.map((r) => {
          const done = followed.has(r.id);
          return (
            <li key={r.id} className={vertical ? 'min-w-0' : 'snap-start shrink-0 w-[78%] max-w-[18rem]'}>
              <div className={`relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br ${GRADIENTS[r.id % GRADIENTS.length]} text-white shadow-sm`}>
                {r.bannerUrl && /* eslint-disable-next-line @next/next/no-img-element */ <img src={r.bannerUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" aria-hidden />
                <Link href={`/profile/${r.id}`} aria-label={r.name} className="absolute inset-0 z-10" />
                <div className="absolute left-3 top-3 z-20 pointer-events-none">
                  <UserAvatar src={r.avatarUrl} alt={r.name} fallbackName={r.name} className={vertical ? 'h-10 w-10 rounded-full border-2 border-white' : 'h-14 w-14 rounded-full border-2 border-white'} />
                </div>
                <div className="absolute inset-x-0 bottom-0 z-20 space-y-1.5 p-3 pointer-events-none">
                  <p className="flex items-center gap-1 font-extrabold leading-tight"><span className={vertical ? 'line-clamp-2 text-sm' : 'line-clamp-2 text-lg'}>{r.name}</span>{r.isVerified && <BadgeCheck className="h-4 w-4 shrink-0 text-primary-400" />}</p>
                  <p className="truncate text-xs text-white/80">{[r.city, r.subtitle].filter(Boolean).join(' · ') || ' '}</p>
                  <button type="button" disabled={done || busyId === r.id} onClick={() => onFollow(r.id)}
                    className="pointer-events-auto relative z-30 mt-1 inline-flex items-center gap-1.5 rounded-full bg-primary-500 px-4 py-1.5 text-sm font-extrabold text-neutral-900 disabled:bg-white/80 disabled:text-neutral-600">
                    {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : done ? <Check className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                    {done ? followedLabel : followLabel}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Кілька блоків у стрічці беруть дані одним запитом (кеш на хвилину)
let recCache: { at: number; p: Promise<any> } | null = null;
function loadRecs(): Promise<any> {
  if (!recCache || Date.now() - recCache.at > 60_000) {
    const p = fetch('/api/recommendations', { credentials: 'include', headers: authHeaders(), cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    recCache = { at: Date.now(), p };
  }
  return recCache.p;
}
const rotate = <T,>(list: T[], by: number, take: number): T[] => (list.length === 0 ? list : Array.from({ length: Math.min(take, list.length) }, (_, i) => list[(by + i) % list.length]));

/**
 * `only` — показати лише один блок («people» | «business» | «interesting»), `round` — котре це повторення у стрічці:
 * кожне наступне показує інші люди/бізнеси, а не ті самі.
 */
export function Recommendations({ canFollow, onFollowed, vertical = false, only, round = 0 }: { canFollow: boolean; onFollowed?: (userId: number) => void; vertical?: boolean; only?: 'people' | 'business' | 'interesting'; round?: number }) {
  const { t } = useI18n();
  const toast = useToast();
  const [data, setData] = useState<{ people: Rec[]; business: Rec[]; interesting?: Rec[] } | null>(null);
  const [followed, setFollowed] = useState<Set<number>>(new Set());
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const json = await loadRecs();
        if (json && !cancelled) setData(json);
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

  if (!data) return null;
  const take = only ? 3 : 6;
  const people = only && only !== 'people' ? [] : rotate(data.people, round * 3, take);
  const business = only && only !== 'business' ? [] : rotate(data.business, round * 2, only ? 3 : 6);
  const interesting = only && only !== 'interesting' ? [] : rotate(data.interesting ?? [], round * 2, only ? 3 : 6);
  if (people.length === 0 && business.length === 0 && interesting.length === 0) return null;
  const common = { vertical, followed, busyId, onFollow: follow, followLabel: t('feed.recommendations.follow'), followedLabel: t('feed.recommendations.followed') };
  return (
    <section className={vertical ? 'bg-white rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.12)] p-3 space-y-3' : 'bg-white rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.12)] p-4 space-y-4'} aria-label={t('feed.recommendations.title')}>
      <Row title={t('feed.recommendations.people')} items={people} {...common} />
      <BusinessSquares title={t('feed.recommendations.business')} hint={t('feed.recommendations.businessHint')} items={business} {...common} />
      <BusinessSquares title={t('feed.recommendations.interesting')} hint={t('feed.recommendations.interestingHint')} items={interesting} {...common} />
    </section>
  );
}
