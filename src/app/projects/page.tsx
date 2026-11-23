'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ArrowUpRight } from 'lucide-react';
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
                    className={`group relative flex h-full flex-col justify-end overflow-hidden rounded-3xl p-4 sm:p-5 text-white shadow-md ring-1 ring-white/10 hover:shadow-2xl transition duration-300 active:scale-[0.98] ${featured ? 'min-h-[11rem] sm:min-h-[13rem]' : 'min-h-[10.5rem] sm:min-h-[12rem]'}`}
                    style={p.bannerUrl ? undefined : projectWallpaper(p.slug)}
                  >
                    {p.bannerUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.bannerUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    )}
                    <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                    {p.status === 'coming_soon' && (
                      <span className="absolute left-3 top-3 rounded-full bg-black/40 backdrop-blur text-[10px] font-bold uppercase tracking-wide px-2.5 py-1" style={{ color: th.accent }}>{t('projects.soon')}</span>
                    )}
                    <span aria-hidden className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 backdrop-blur ring-1 ring-white/25 transition group-hover:bg-white/30"><ArrowUpRight className="h-4 w-4" /></span>
                    <span className="relative">
                      <span className={`block font-bold leading-snug drop-shadow ${featured ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'}`}>{name(p)}</span>
                      {description(p) && <span className="mt-1 block text-xs sm:text-sm text-white/80 line-clamp-2">{description(p)}</span>}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
