'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2, UserPlus } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { projectWallpaper } from '@/lib/projectThemes';
import { ComingSoon } from '@/components/projects/ComingSoon';
import { ChinaActions } from '@/components/projects/ChinaActions';
import { MovingActions } from '@/components/projects/MovingActions';
import { BusinessDirectory } from '@/components/listings/BusinessDirectory';
import { ProjectCatalog } from '@/components/listings/ProjectCatalog';
import { hasListings } from '@/lib/listingFields';
import { applyIdOf, findFolder, folderLink, foldersFor } from '@/lib/projectFolders';
import { readStoredUser } from '@/lib/feedClient';
import { useFolderImages } from '@/lib/useFolderImages';
import { FolderTileInner, folderTileCls } from '@/components/projects/FolderTile';
import { GeoCatalog } from '@/components/projects/GeoCatalog';
import { SectionActions } from '@/components/projects/SectionActions';
import { TaxiFolders } from '@/components/projects/TaxiFolders';
import { KindLeaf } from '@/components/projects/KindLeaf';
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
  bannerUrl?: string | null;
}

/** Проєкти зі вступним текстом (головний текст концепції) над папками першого рівня */
const INTRO_SLUGS = ['trade', 'turnkey', 'health', 'pets', 'travel', 'invest', 'antiques', 'clubs', 'export-alliance', 'dating', 'mystic', 'grants', 'beauty', 'notable', 'media-network', 'cooperatives', 'apps', 'rebuild'];

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
  const folderImages = useFolderImages(params.slug);
  const parentOf = (path: string | null) => { const parts = (path || '').split('.'); parts.pop(); return parts.length ? parts.join('.') : null; };
  const nsOf = (slug: string) => slug.replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase());

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
    <div className="min-h-screen bg-space-800" style={project ? (project.bannerUrl ? { backgroundImage: `linear-gradient(to bottom, rgba(10,31,68,.55), rgba(10,31,68,.85)), url(${project.bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' } : projectWallpaper(project.slug)) : undefined}>
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
              <div className="min-w-0">
                <h1 className="text-xl font-bold">{name}</h1>
                {description && <p className="text-sm text-white/80 mt-0.5">{description}</p>}
              </div>
            </header>
            {loggedIn ? (
              (() => {
                const folders = foldersFor(project.slug);
                const found = findFolder(project.slug, folderPath);
                // Є папки, але жодну ще не обрано (або обрана має підпапки) → показуємо плитки папок
                const list = found ? found.folder.children : folders;
                if (folders.length > 0 && (!found || (found.folder.children && found.folder.children.length > 0))) {
                  return (
                    <div className="space-y-3">
                      {!found && project.slug === 'export-alliance' && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {([['cabinet', '🗂️', `/projects/${project.slug}/cabinet`], ['search', '🔎', `/search?project=${project.slug}`], ['map', '🗺️', `/projects/${project.slug}/map`]] as Array<[string, string, string]>).map(([k, , href]) => (
                            <Link key={k} href={href} className="flex items-center justify-center gap-1.5 rounded-full bg-white/90 text-sm font-bold text-neutral-900 px-3 py-2">{t(`projects.tools.${k}`)}</Link>
                          ))}
                          <button type="button" onClick={() => openFolder('markets.talks.active')} className="flex items-center justify-center gap-1.5 rounded-full bg-white/90 text-sm font-bold text-neutral-900 px-3 py-2">{t('projects.tools.talks')}</button>
                        </div>
                      )}
                      {!found && INTRO_SLUGS.indexOf(project.slug) !== -1 && <p className="rounded-2xl bg-black/30 backdrop-blur text-sm text-white p-3 whitespace-pre-line">{t(`projects.${nsOf(project.slug)}.intro`)}</p>}
                      {found && (
                        <button type="button" onClick={() => openFolder(parentOf(folderPath))} className="inline-flex items-center gap-2 rounded-full bg-white/90 text-sm font-semibold text-neutral-800 px-3 py-1.5">
                          <ArrowLeft className="w-4 h-4" /> {t('cabinet.foldersUi.back')}
                        </button>
                      )}
                      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {(list || []).map((f) => {
                          const childPath = folderPath ? `${folderPath}.${f.key}` : f.key;
                          const img = folderImages[childPath];
                          const tileCls = folderTileCls(img);
                          const inner = <FolderTileInner image={img} icon={f.icon} label={t(f.labelKey)} arrow={!!f.children} />;
                          // Заявка (кабінет, команда, новий напрям) і посилання в інший розділ — це не каталог, а перехід
                          const target = f.href ? f.href : f.apply
                            ? `/projects/${project.slug}/earn?apply=${encodeURIComponent(applyIdOf(project.slug, childPath.split('.')))}`
                            : null;
                          return (
                            <li key={f.key}>
                              {target && target.indexOf(folderLink(project.slug, '')) === 0
                                ? <button type="button" onClick={() => openFolder(target.slice(folderLink(project.slug, '').length))} className={tileCls}>{inner}</button>
                                : target
                                  ? <Link href={target} className={tileCls}>{inner}</Link>
                                  : <button type="button" onClick={() => openFolder(childPath)} className={tileCls}>{inner}</button>}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                }
                return (
                  <div className="space-y-3">
                    {found && (
                      <button type="button" onClick={() => openFolder(parentOf(folderPath))} className="inline-flex items-center gap-2 rounded-full bg-white/90 text-sm font-semibold text-neutral-800 px-3 py-1.5">
                        <ArrowLeft className="w-4 h-4" /> {t('cabinet.foldersUi.back')} · {t(found.folder.labelKey)}
                      </button>
                    )}
                    {found?.folder.kind && <KindLeaf project={project.slug} node={found.folder} path={folderPath || ''} />}
                    {found?.folder.kind ? null : (<>
                    {project.slug === 'real-estate' && found?.folder.sectionId === 'real_estate_home_moving' && <MovingActions />}
                    {project.slug === 'china' && found?.folder.sectionId && <ChinaActions sectionLabel={t(found.folder.labelKey)} />}
                    {found?.folder.acts && <SectionActions key={folderPath} projectSlug={project.slug} acts={found.folder.acts} label={t(found.folder.labelKey)} />}
                    {found?.folder.directory && found.folder.sectionId
                      ? <BusinessDirectory key={folderPath} slug={project.slug} sectionId={found.folder.sectionId} />
                      : found?.folder.drill?.length
                        ? <GeoCatalog key={folderPath} slug={project.slug} node={found.folder} label={t(found.folder.labelKey)} />
                        : <ProjectCatalog key={folderPath || 'all'} slug={project.slug} initialFilters={found?.folder.filters} sectionId={found?.folder.sectionId} business={found?.folder.business} />}
                    </>)}
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
        {state === 'ready' && project && project.slug === 'taxi' && (
          <div className="space-y-4">
            <header className="bg-black/30 backdrop-blur rounded-3xl border border-white/15 shadow-lg p-5 flex items-center gap-4 text-white">
              <span className="text-5xl" aria-hidden>{project.icon}</span>
              <div className="min-w-0">
                <h1 className="text-2xl font-extrabold">{name}</h1>
                {description && <p className="text-sm text-white/80 mt-0.5">{description}</p>}
              </div>
            </header>
            {loggedIn
              ? <TaxiFolders folderPath={folderPath} openFolder={openFolder} />
              : (
                <div className="bg-white rounded-2xl border border-neutral-200 p-6 text-center space-y-3">
                  <p className="text-neutral-700">{t('listings.common.loginRequired')}</p>
                  <Link href={`/auth/login?returnUrl=/projects/${project.slug}`} className="inline-block rounded-full bg-primary-500 hover:bg-primary-600 text-white font-semibold px-6 py-2.5">{t('listings.common.login')}</Link>
                </div>
              )}
            <Link href={`/projects/${project.slug}/earn`} className="flex items-center gap-4 rounded-2xl bg-white shadow-md p-4 hover:shadow-lg transition">
              <UserPlus className="w-7 h-7 shrink-0 text-space-500" />
              <span><span className="block font-bold text-neutral-900">{t('cabinet.projects.taxi.apply')}</span><span className="block text-xs text-neutral-500">{t('cabinet.projects.taxi.applyHint')}</span></span>
            </Link>
          </div>
        )}
        {state === 'ready' && project && !(project.slug === 'taxi' || (project.status === 'active' && hasListings(project.slug))) && (
          <ComingSoon icon={project.icon} title={name} description={description} backHref="/projects" backLabel={t('projects.back')} />
        )}
        {state === 'ready' && project && loggedIn && !(foldersFor(project.slug).some((f) => f.key === 'info') && foldersFor(project.slug).some((f) => f.key === 'feedback')) && <SuggestBox projectSlug={project.slug} />}
      </div>
    </div>
  );
}
