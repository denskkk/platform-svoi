'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ComingSoon } from '@/components/projects/ComingSoon';
import { ProjectCatalog } from '@/components/listings/ProjectCatalog';
import { hasListings } from '@/lib/listingFields';
import { readStoredUser } from '@/lib/feedClient';
import { useI18n } from '@/i18n/client';

interface Project {
  slug: string;
  icon: string | null;
  color: string | null;
  nameUk: string;
  nameEn: string;
  descriptionUk: string | null;
  descriptionEn: string | null;
  status: 'active' | 'coming_soon' | 'hidden';
}

export default function ProjectPage() {
  const params = useParams<{ slug: string }>();
  const { t, locale } = useI18n();
  const [project, setProject] = useState<Project | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');

  useEffect(() => { setLoggedIn(!!readStoredUser()); }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/projects', { cache: 'no-store' });
        if (!res.ok) throw new Error();
        const data = await res.json();
        const found = (data.projects as Project[]).find((p) => p.slug === params.slug);
        if (cancelled) return;
        if (!found) { setState('missing'); return; }
        setProject(found);
        setState('ready');
      } catch {
        if (!cancelled) setState('error');
      }
    })();
    return () => { cancelled = true; };
  }, [params.slug]);

  const name = project ? (locale === 'uk' ? project.nameUk : project.nameEn) || project.nameUk : '';
  const description = project ? (locale === 'uk' ? project.descriptionUk : project.descriptionEn) || project.descriptionUk : null;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto w-full max-w-3xl px-3 sm:px-6 pt-4 pb-28 md:pb-12 space-y-4">
        <Link href="/projects" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-primary-700">
          <ArrowLeft className="w-4 h-4" /> {t('projects.back')}
        </Link>

        {state === 'loading' && <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}
        {state === 'missing' && <div className="bg-white rounded-2xl border border-neutral-200 p-6 text-center text-neutral-600">{t('projects.notFound')}</div>}
        {state === 'error' && <div className="bg-white rounded-2xl border border-red-100 p-6 text-center text-sm text-red-600">{t('projects.loadFailed')}</div>}

        {state === 'ready' && project && project.status === 'active' && hasListings(project.slug) && (
          <>
            <header className="bg-white rounded-3xl border border-neutral-200/70 shadow-sm p-5 flex items-center gap-4">
              <span className="text-4xl" aria-hidden>{project.icon}</span>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-neutral-900">{name}</h1>
                {description && <p className="text-sm text-neutral-600 mt-0.5">{description}</p>}
              </div>
            </header>
            <Link href={`/projects/${project.slug}/earn`} className="block rounded-2xl bg-accent-50 hover:bg-accent-100 border border-accent-200 text-accent-800 font-semibold text-center py-3">
              💼 {t('projects.earn.button')}
            </Link>
            {loggedIn ? (
              <ProjectCatalog slug={project.slug} />
            ) : (
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 text-center space-y-3">
                <p className="text-neutral-700">{t('listings.common.loginRequired')}</p>
                <Link href={`/auth/login?returnUrl=/projects/${project.slug}`} className="inline-block rounded-full bg-primary-500 hover:bg-primary-600 text-white font-semibold px-6 py-2.5">{t('listings.common.login')}</Link>
              </div>
            )}
          </>
        )}
        {state === 'ready' && project && !(project.status === 'active' && hasListings(project.slug)) && (
          <ComingSoon icon={project.icon} title={name} description={description} backHref="/projects" backLabel={t('projects.back')} />
        )}
      </div>
    </div>
  );
}
