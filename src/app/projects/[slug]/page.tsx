'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2, MapPin, Car, UserPlus } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { projectWallpaper } from '@/lib/projectThemes';
import { ComingSoon } from '@/components/projects/ComingSoon';
import { ProjectCatalog } from '@/components/listings/ProjectCatalog';
import { hasListings } from '@/lib/listingFields';
import { findFolder, foldersFor } from '@/lib/projectFolders';
import { readStoredUser } from '@/lib/feedClient';
import { SuggestBox } from '@/components/projects/SuggestBox';
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
  const toast = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  // Папка проєкту живе в адресі (?folder=a або a.b), щоб працювала кнопка «назад»
  const [folderPath, setFolderPath] = useState<string | null>(null);
  useEffect(() => {
    const read = () => setFolderPath(new URLSearchParams(window.location.search).get('folder'));
    read();
    window.addEventListener('popstate', read);
    return () => window.removeEventListener('popstate', read);
  }, []);
  const openFolder = (path: string | null) => {
    setFolderPath(path);
    window.history.pushState(null, '', path ? `?folder=${path}` : window.location.pathname);
    window.scrollTo({ top: 0 });
  };
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
    <div className="min-h-screen bg-space-800" style={project ? projectWallpaper(project.slug) : undefined}>
      <div className="mx-auto w-full max-w-3xl px-3 sm:px-6 pt-4 pb-28 md:pb-12 space-y-4">
        <Link href="/projects" className="inline-flex items-center gap-2 rounded-full bg-black/30 backdrop-blur text-sm font-semibold text-white px-3 py-1.5 hover:bg-black/40">
          <ArrowLeft className="w-4 h-4" /> {t('projects.back')}
        </Link>

        {state === 'loading' && <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}
        {state === 'missing' && <div className="bg-white rounded-2xl border border-neutral-200 p-6 text-center text-neutral-600">{t('projects.notFound')}</div>}
        {state === 'error' && <div className="bg-white rounded-2xl border border-red-100 p-6 text-center text-sm text-red-600">{t('projects.loadFailed')}</div>}

        {state === 'ready' && project && project.status === 'active' && hasListings(project.slug) && (
          <>
            <header className="bg-black/30 backdrop-blur rounded-3xl border border-white/15 shadow-lg p-5 flex items-center gap-4 text-white">
              <span className="text-4xl" aria-hidden>{project.icon}</span>
              <div className="min-w-0">
                <h1 className="text-xl font-bold">{name}</h1>
                {description && <p className="text-sm text-white/80 mt-0.5">{description}</p>}
              </div>
            </header>
            <Link href={`/projects/${project.slug}/earn`} className="block rounded-2xl bg-primary-500 hover:bg-primary-600 text-neutral-900 font-bold text-center py-3 shadow-md">
              💼 {t('projects.earn.button')}
            </Link>
            {loggedIn ? (
              (() => {
                const folders = foldersFor(project.slug);
                const found = findFolder(project.slug, folderPath);
                // Є папки, але жодну ще не обрано (або обрана має підпапки) → показуємо плитки папок
                const list = found ? found.folder.children : folders;
                if (folders.length > 0 && (!found || (found.folder.children && found.folder.children.length > 0))) {
                  return (
                    <div className="space-y-3">
                      {found && (
                        <button type="button" onClick={() => openFolder(found.parent ? found.parent.key : null)} className="inline-flex items-center gap-2 rounded-full bg-white/90 text-sm font-semibold text-neutral-800 px-3 py-1.5">
                          <ArrowLeft className="w-4 h-4" /> {t('cabinet.foldersUi.back')}
                        </button>
                      )}
                      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {(list || []).map((f) => (
                          <li key={f.key}>
                            <button type="button" onClick={() => openFolder(found ? `${found.folder.key}.${f.key}` : f.key)}
                              className="w-full h-full min-h-[7rem] rounded-2xl bg-white shadow-md hover:shadow-lg active:scale-[0.98] transition p-3 flex flex-col items-center justify-center gap-2 text-center">
                              <span className="text-4xl" aria-hidden>{f.icon}</span>
                              <span className="text-sm font-bold text-neutral-900 leading-snug">{t(f.labelKey)}</span>
                              {f.children && <span aria-hidden className="text-neutral-400 text-xs">›</span>}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                }
                return (
                  <div className="space-y-3">
                    {found && (
                      <button type="button" onClick={() => openFolder(found.parent ? found.parent.key : null)} className="inline-flex items-center gap-2 rounded-full bg-white/90 text-sm font-semibold text-neutral-800 px-3 py-1.5">
                        <ArrowLeft className="w-4 h-4" /> {t('cabinet.foldersUi.back')} · {t(found.folder.labelKey)}
                      </button>
                    )}
                    <ProjectCatalog key={folderPath || 'all'} slug={project.slug} initialFilters={found?.folder.filters} />
                  </div>
                );
              })()
            ) : (
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 text-center space-y-3">
                <p className="text-neutral-700">{t('listings.common.loginRequired')}</p>
                <Link href={`/auth/login?returnUrl=/projects/${project.slug}`} className="inline-block rounded-full bg-primary-500 hover:bg-primary-600 text-white font-semibold px-6 py-2.5">{t('listings.common.login')}</Link>
              </div>
            )}
          </>
        )}
        {state === 'ready' && project && project.status === 'active' && project.slug === 'clubs' && (
          <header className="bg-black/30 backdrop-blur rounded-3xl border border-white/15 shadow-lg p-5 space-y-3 text-center text-white">
            <span className="text-4xl" aria-hidden>{project.icon}</span>
            <h1 className="text-xl font-bold">{name}</h1>
            {description && <p className="text-sm text-white/80">{description}</p>}
            <Link href="/clubs" className="inline-block rounded-full bg-primary-500 hover:bg-primary-600 text-white font-semibold px-6 py-2.5">{t('clubs.title')}</Link>
          </header>
        )}
        {state === 'ready' && project && project.slug === 'taxi' && (
          <div className="space-y-4">
            <header className="bg-black/30 backdrop-blur rounded-3xl border border-white/15 shadow-lg p-5 flex items-center gap-4 text-white">
              <span className="text-5xl" aria-hidden>{project.icon}</span>
              <div className="min-w-0">
                <h1 className="text-2xl font-extrabold">{name}</h1>
                {description && <p className="text-sm text-white/80 mt-0.5">{description}</p>}
              </div>
            </header>
            <button type="button" onClick={() => toast.info(t('cabinet.projects.taxi.soon'))} className="w-full rounded-2xl bg-primary-500 hover:bg-primary-600 text-neutral-900 shadow-lg p-5 flex items-center gap-4 text-left active:scale-[0.99] transition">
              <Car className="w-9 h-9 shrink-0" />
              <span><span className="block text-xl font-extrabold">{t('cabinet.projects.taxi.order')}</span><span className="block text-sm text-neutral-800/80">{t('cabinet.projects.taxi.orderHint')}</span></span>
            </button>
            <button type="button" onClick={() => toast.info(t('cabinet.projects.taxi.soon'))} className="w-full relative overflow-hidden rounded-2xl bg-space-700 text-white shadow-lg h-40 text-left active:scale-[0.99] transition" aria-label={t('cabinet.projects.taxi.map')}>
              <span aria-hidden className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.35) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
              <MapPin aria-hidden className="absolute right-8 top-8 w-10 h-10 text-primary-400 drop-shadow" />
              <span className="absolute left-4 bottom-4"><span className="block font-bold text-lg">{t('cabinet.projects.taxi.map')}</span><span className="block text-xs text-white/75">{t('cabinet.projects.taxi.mapHint')}</span></span>
            </button>
            <Link href={`/projects/${project.slug}/earn`} className="flex items-center gap-4 rounded-2xl bg-white shadow-md p-4 hover:shadow-lg transition">
              <UserPlus className="w-7 h-7 shrink-0 text-space-500" />
              <span><span className="block font-bold text-neutral-900">{t('cabinet.projects.taxi.apply')}</span><span className="block text-xs text-neutral-500">{t('cabinet.projects.taxi.applyHint')}</span></span>
            </Link>
            <Link href={`/projects/${project.slug}/earn`} className="block rounded-2xl bg-primary-500 hover:bg-primary-600 text-neutral-900 font-bold text-center py-3 shadow-md">
              💼 {t('projects.earn.button')}
            </Link>
          </div>
        )}
        {state === 'ready' && project && !(project.slug === 'taxi' || (project.status === 'active' && (hasListings(project.slug) || project.slug === 'clubs'))) && (
          <ComingSoon icon={project.icon} title={name} description={description} backHref="/projects" backLabel={t('projects.back')} />
        )}
        {state === 'ready' && project && loggedIn && <SuggestBox projectSlug={project.slug} />}
      </div>
    </div>
  );
}
