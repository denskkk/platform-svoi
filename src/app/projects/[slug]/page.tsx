'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ComingSoon } from '@/components/projects/ComingSoon';
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
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');

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

        {state === 'ready' && project && (
          <ComingSoon icon={project.icon} title={name} description={description} backHref="/projects" backLabel={t('projects.back')} />
        )}
      </div>
    </div>
  );
}
