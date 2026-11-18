'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BadgeCheck, Loader2, MapPin, Search as SearchIcon, X } from 'lucide-react';
import { ListingCard } from '@/components/listings/ListingCard';
import { ListingCardData } from '@/components/listings/helpers';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { authHeaders, readStoredUser } from '@/lib/feedClient';

interface Person { id: number; name: string; avatarUrl: string | null; city: string | null; profession?: string | null; businessType?: string | null; isVerified: boolean }
interface ClubHit { id: number; name: string; avatarUrl: string | null; city: string | null; category: string; membersCount: number }
interface PostHit { id: number; snippet: string; createdAt: string; author: { id: number; name: string; avatarUrl: string | null } }
interface Results { people: Person[]; business: Person[]; listings: ListingCardData[]; clubs: ClubHit[]; posts: PostHit[] }
type Tab = 'all' | 'people' | 'business' | 'listings' | 'clubs' | 'posts';

const EMPTY: Results = { people: [], business: [], listings: [], clubs: [], posts: [] };
const DIRECTION_SLUGS = ['cars', 'real-estate', 'health', 'sport', 'services', 'jobs', 'shops', 'events', 'trade', 'china'];

function PersonRow({ p, href, sub }: { p: Person; href: string; sub: string | null }) {
  return (
    <li>
      <Link href={href} className="flex items-center gap-3 rounded-2xl bg-white border border-neutral-200/70 p-3 hover:border-primary-300 transition">
        <UserAvatar src={p.avatarUrl} alt={p.name} fallbackName={p.name} className="w-11 h-11 rounded-full" />
        <span className="min-w-0">
          <span className="flex items-center gap-1 font-semibold text-neutral-900"><span className="truncate">{p.name}</span>{p.isVerified && <BadgeCheck className="w-4 h-4 text-accent-500 shrink-0" />}</span>
          <span className="flex items-center gap-1 text-xs text-neutral-500 truncate">
            {p.city && <><MapPin className="w-3 h-3 shrink-0" />{p.city}</>}{p.city && sub ? ' · ' : ''}{sub}
          </span>
        </span>
      </Link>
    </li>
  );
}

export default function SearchPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const [results, setResults] = useState<Results>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [searched, setSearched] = useState(false);
  const [city, setCity] = useState('');
  const [project, setProject] = useState('');
  const reqId = useRef(0);

  useEffect(() => {
    if (!readStoredUser()) { router.replace('/auth/login?returnUrl=/search'); return; }
    const initial = new URLSearchParams(window.location.search).get('q');
    if (initial) setQ(initial.slice(0, 80));
    const initialType = new URLSearchParams(window.location.search).get('type');
    if (initialType && (['posts', 'people', 'business', 'listings', 'clubs'] as string[]).includes(initialType)) setTab(initialType as Tab);
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('city')) setCity((sp.get('city') as string).slice(0, 60));
    if (sp.get('project')) setProject((sp.get('project') as string).slice(0, 60));
  }, [router]);

  useEffect(() => {
    const text = q.trim();
    if (text.length < 2 && !city.trim() && !project) { setResults(EMPTY); setSearched(false); setLoading(false); setError(false); return; }
    const id = ++reqId.current;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?${new URLSearchParams({ q: text, type: tab, city: city.trim(), project })}`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (id !== reqId.current) return;
        setResults({ people: data.people, business: data.business, listings: data.listings, clubs: data.clubs || [], posts: data.posts || [] });
        setError(false);
        setSearched(true);
      } catch {
        if (id === reqId.current) setError(true);
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [q, tab, city, project]);

  const total = results.people.length + results.business.length + results.listings.length + results.clubs.length + results.posts.length;
  const tabs: Tab[] = ['all', 'posts', 'people', 'business', 'listings', 'clubs'];
  const hasQuery = q.trim().length >= 2 || city.trim().length > 0 || !!project;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto w-full max-w-3xl px-3 sm:px-6 pt-4 pb-28 md:pb-12 space-y-4">
        <h1 className="text-2xl font-bold text-neutral-900">{t('search.title')}</h1>

        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            autoFocus
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            maxLength={80}
            placeholder={t('search.placeholder')}
            aria-label={t('search.placeholder')}
            className="w-full rounded-full border border-neutral-300 bg-white pl-12 pr-11 py-3 text-[16px] focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
          {q && (
            <button type="button" onClick={() => setQ('')} aria-label={t('search.clear')} className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full hover:bg-neutral-100">
              <X className="w-4 h-4 text-neutral-500" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input value={city} onChange={(e) => setCity(e.target.value)} maxLength={60} placeholder={t('search.cityPlaceholder')} aria-label={t('search.cityPlaceholder')}
            className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-[16px] md:text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
          <select value={project} onChange={(e) => setProject(e.target.value)} aria-label={t('search.directionLabel')}
            className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-[16px] md:text-sm focus:outline-none focus:ring-2 focus:ring-primary-400">
            <option value="">{t('search.allDirections')}</option>
            {DIRECTION_SLUGS.map((slug) => <option key={slug} value={slug}>{t(`search.directions.${slug}`)}</option>)}
          </select>
        </div>

        <div role="tablist" className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((k) => (
            <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => setTab(k)}
              className={cn('shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold border transition', tab === k ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-neutral-600 border-neutral-200')}>
              {t(`search.tabs.${k}`)}
            </button>
          ))}
        </div>

        {!hasQuery && <p className="text-center text-sm text-neutral-500 py-10">{t('search.hint')}</p>}
        {loading && <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}
        {error && !loading && <p className="text-center text-sm text-red-600 py-6">{t('search.failed')}</p>}
        {searched && !loading && !error && total === 0 && <p className="text-center text-neutral-600 py-10">{t('search.empty')}</p>}

        {!error && results.posts.length > 0 && (
          <section className="space-y-2">
            <h2 className="font-semibold text-neutral-900">{t('search.tabs.posts')}</h2>
            <ul className="space-y-2">{results.posts.map((p) => (
              <li key={p.id}>
                <Link href={`/feed/${p.id}`} className="block rounded-2xl bg-white border border-neutral-200/70 p-3 hover:border-primary-300 transition">
                  <span className="flex items-center gap-2 text-sm font-semibold text-neutral-900"><UserAvatar src={p.author.avatarUrl} alt={p.author.name} fallbackName={p.author.name} className="w-7 h-7 rounded-full" /><span className="truncate">{p.author.name}</span></span>
                  <span className="mt-1 block text-sm text-neutral-700 whitespace-pre-wrap break-words">{p.snippet}</span>
                </Link>
              </li>
            ))}</ul>
          </section>
        )}
        {!error && results.people.length > 0 && (
          <section className="space-y-2">
            <h2 className="font-semibold text-neutral-900">{t('search.tabs.people')}</h2>
            <ul className="space-y-2">{results.people.map((p) => <PersonRow key={p.id} p={p} href={`/profile/${p.id}`} sub={p.profession ?? null} />)}</ul>
          </section>
        )}
        {!error && results.business.length > 0 && (
          <section className="space-y-2">
            <h2 className="font-semibold text-neutral-900">{t('search.tabs.business')}</h2>
            <ul className="space-y-2">{results.business.map((p) => <PersonRow key={p.id} p={p} href={`/companies/${p.id}`} sub={p.businessType ?? null} />)}</ul>
          </section>
        )}
        {!error && results.clubs.length > 0 && (
          <section className="space-y-2">
            <h2 className="font-semibold text-neutral-900">{t('search.tabs.clubs')}</h2>
            <ul className="space-y-2">{results.clubs.map((c) => (
              <PersonRow key={c.id} p={{ id: c.id, name: c.name, avatarUrl: c.avatarUrl, city: c.city, isVerified: false }} href={`/clubs/${c.id}`} sub={t('search.members', { count: c.membersCount })} />
            ))}</ul>
          </section>
        )}
        {!error && results.listings.length > 0 && (
          <section className="space-y-2">
            <h2 className="font-semibold text-neutral-900">{t('search.tabs.listings')}</h2>
            <ul className="grid grid-cols-2 gap-3">
              {results.listings.map((l) => (
                <li key={l.id}><ListingCard listing={l} canSave /></li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
