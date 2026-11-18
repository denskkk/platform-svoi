'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Globe2, Handshake, Search, Store } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { projectTheme, projectWallpaper } from '@/lib/projectThemes';

interface Project {
  slug: string;
  icon: string | null;
  color: string | null;
  bannerUrl: string | null;
  nameUk: string;
  nameEn: string;
  descriptionUk: string | null;
  descriptionEn: string | null;
  status: 'active' | 'coming_soon' | 'hidden';
}

export default function ProjectsPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [q, setQ] = useState('');

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/projects', { cache: 'no-store' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProjects(data.projects);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const name = (p: Project) => (locale === 'uk' ? p.nameUk : p.nameEn) || p.nameUk;
  const description = (p: Project) => (locale === 'uk' ? p.descriptionUk : p.descriptionEn) || p.descriptionUk;
  const submit = (e: FormEvent) => { e.preventDefault(); const s = q.trim(); router.push(`/search?type=business${s ? `&q=${encodeURIComponent(s)}` : ''}`); };

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-gradient-to-br from-space-800 via-space-700 to-space-500 text-white">
        <div className="mx-auto w-full max-w-5xl px-3 sm:px-6 pt-6 pb-8">
          <h1 className="text-3xl font-extrabold">{t('cabinet.projects.title')}</h1>
          <p className="text-white/75 mt-1">{t('cabinet.projects.subtitle')}</p>
          <form onSubmit={submit} role="search" className="mt-4 flex items-center gap-2 rounded-full bg-white px-4 py-2.5 shadow-lg">
            <Search className="w-5 h-5 text-neutral-500 shrink-0" />
            <input value={q} onChange={(e) => setQ(e.target.value)} maxLength={80} placeholder={t('cabinet.projects.searchPlaceholder')} aria-label={t('cabinet.projects.searchPlaceholder')} className="min-w-0 flex-1 bg-transparent text-neutral-900 placeholder:text-neutral-500 focus:outline-none text-[16px]" />
          </form>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl px-3 sm:px-6 pt-5 pb-28 md:pb-12 space-y-5">
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4" aria-hidden>
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 rounded-2xl bg-neutral-200 animate-pulse" />)}
          </div>
        )}

        {!loading && error && (
          <div className="bg-white rounded-2xl border border-red-100 p-6 text-center space-y-3">
            <p className="text-sm text-red-600">{t('projects.loadFailed')}</p>
            <button type="button" onClick={load} className="rounded-full bg-primary-500 text-neutral-900 text-sm font-semibold px-5 py-2">{t('projects.retry')}</button>
          </div>
        )}

        {!loading && !error && (
          <ul className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {projects.map((p, i) => {
              const th = projectTheme(p.slug);
              const featured = i === 0;
              return (
                <li key={p.slug} className={featured ? 'col-span-2 md:col-span-3' : undefined}>
                  <Link
                    href={`/projects/${p.slug}`}
                    className={`relative flex h-full flex-col justify-between overflow-hidden rounded-2xl p-4 text-white shadow-md hover:shadow-xl transition active:scale-[0.98] ${featured ? 'min-h-[9rem]' : 'min-h-[10.5rem]'}`}
                    style={projectWallpaper(p.slug)}
                  >
                    {p.status === 'coming_soon' && (
                      <span className="absolute right-3 top-3 rounded-full bg-black/35 backdrop-blur text-[10px] font-bold uppercase tracking-wide px-2 py-0.5" style={{ color: th.accent }}>{t('projects.soon')}</span>
                    )}
                    <span className={featured ? 'text-5xl' : 'text-4xl'} aria-hidden>{p.icon || '✨'}</span>
                    <span>
                      <span className={`block font-bold leading-snug drop-shadow ${featured ? 'text-xl' : ''}`}>{name(p)}</span>
                      {description(p) && <span className="mt-1 block text-xs text-white/80 line-clamp-2">{description(p)}</span>}
                    </span>
                    <span aria-hidden className="absolute inset-x-0 bottom-0 h-1" style={{ background: th.accent }} />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Link href="/companies" className="rounded-2xl bg-white border border-neutral-200/70 shadow-sm p-4 hover:shadow-md transition">
            <Store className="w-7 h-7 text-space-500" />
            <p className="mt-2 font-bold text-neutral-900">{t('cabinet.projects.offline')}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{t('cabinet.projects.offlineHint')}</p>
          </Link>
          <Link href="/search?type=business" className="rounded-2xl bg-white border border-neutral-200/70 shadow-sm p-4 hover:shadow-md transition">
            <Globe2 className="w-7 h-7 text-space-500" />
            <p className="mt-2 font-bold text-neutral-900">{t('cabinet.projects.online')}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{t('cabinet.projects.onlineHint')}</p>
          </Link>
        </div>

        <Link href="/menu/earn" className="flex items-center gap-3 rounded-2xl bg-primary-500 hover:bg-primary-600 text-neutral-900 p-4 shadow-md transition">
          <Handshake className="w-7 h-7 shrink-0" />
          <span><span className="block font-bold">{t('cabinet.projects.earnTile')}</span><span className="block text-xs text-neutral-800/80">{t('cabinet.projects.earnHint')}</span></span>
        </Link>
      </div>
    </div>
  );
}
