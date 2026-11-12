'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/i18n/client';

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
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto w-full max-w-5xl px-3 sm:px-6 pt-6 pb-28 md:pb-12">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-neutral-900">{t('projects.title')}</h1>
          <p className="text-neutral-600 mt-1">{t('projects.subtitle')}</p>
        </header>

        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4" aria-hidden>
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 rounded-2xl bg-neutral-100 animate-pulse" />)}
          </div>
        )}

        {!loading && error && (
          <div className="bg-white rounded-2xl border border-red-100 p-6 text-center space-y-3">
            <p className="text-sm text-red-600">{t('projects.loadFailed')}</p>
            <button type="button" onClick={load} className="rounded-full bg-primary-500 text-white text-sm font-semibold px-5 py-2">{t('projects.retry')}</button>
          </div>
        )}

        {!loading && !error && (
          <ul className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {projects.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/projects/${p.slug}`}
                  className="relative flex h-full min-h-[10rem] flex-col justify-between rounded-2xl bg-white border border-neutral-200/70 p-4 shadow-sm hover:shadow-md transition active:scale-[0.98]"
                  style={{ borderTop: `4px solid ${p.color || '#facc15'}` }}
                >
                  {p.status === 'coming_soon' && (
                    <span className="absolute right-3 top-3 rounded-full bg-primary-100 text-primary-800 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5">{t('projects.soon')}</span>
                  )}
                  <span className="text-4xl" aria-hidden>{p.icon || '✨'}</span>
                  <span>
                    <span className="block font-semibold text-neutral-900 leading-snug">{name(p)}</span>
                    {description(p) && <span className="mt-1 block text-xs text-neutral-500 line-clamp-2">{description(p)}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
