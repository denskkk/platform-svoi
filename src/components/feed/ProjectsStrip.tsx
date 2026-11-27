'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { authHeaders } from '@/lib/feedClient';
import { projectTheme, projectWallpaper } from '@/lib/projectThemes';

interface Project { slug: string; bannerUrl: string | null; nameUk: string; nameEn: string; descriptionUk: string | null; descriptionEn: string | null; status: 'active' | 'coming_soon' | 'hidden' }

/** Окрема стрічка «Проєкти» у новинах: великі квадратні картки напрямків платформи, гортаються вбік. */
export function ProjectsStrip({ round = 0 }: { round?: number }) {
  const { t, locale } = useI18n();
  const [projects, setProjects] = useState<Project[]>([]);
  const [matched, setMatched] = useState(false);
  useEffect(() => {
    let off = false;
    fetch('/api/projects', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(async (d) => {
        const active: Project[] = (d.projects || []).filter((p: Project) => p.status === 'active');
        // Порядок за інтересами людини (якщо вдалося отримати); інакше — звичайний
        try {
          const r = await fetch('/api/recommendations', { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
          const rec = r.ok ? await r.json() : null;
          const order: string[] = rec?.projectSlugs ?? [];
          if (order.length) { active.sort((a, b) => (order.indexOf(a.slug) + 1 || 999) - (order.indexOf(b.slug) + 1 || 999)); if (!off) setMatched(!!rec.projectsMatched); }
        } catch { /* лишаємо звичайний порядок */ }
        if (!off) setProjects(active);
      })
      .catch(() => undefined);
    return () => { off = true; };
  }, []);
  if (projects.length === 0) return null;
  const shown = Array.from({ length: Math.min(5, projects.length) }, (_, i) => projects[(round * 4 + i) % projects.length]);
  const nm = (p: Project) => (locale === 'uk' ? p.nameUk : p.nameEn || p.nameUk);
  const ds = (p: Project) => (locale === 'uk' ? p.descriptionUk : p.descriptionEn || p.descriptionUk);
  return (
    <section className="space-y-2 rounded-lg bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.12)]" aria-label={matched ? t('feed.projectsStrip.titleInterest') : t('feed.projectsStrip.title')}>
      <div className="flex items-end justify-between px-0.5">
        <div>
          <h3 className="text-base font-bold text-neutral-900">{matched ? t('feed.projectsStrip.titleInterest') : t('feed.projectsStrip.title')}</h3>
          <p className="text-xs text-neutral-500">{t('feed.projectsStrip.hint')}</p>
        </div>
        <Link href="/projects" className="text-sm font-semibold text-primary-700 hover:underline">{t('feed.recommendations.seeAll')}</Link>
      </div>
      <ul className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none]">
        {shown.map((p) => {
          const th = projectTheme(p.slug);
          return (
            <li key={p.slug} className="w-[78%] max-w-[18rem] shrink-0 snap-start">
              <Link href={`/projects/${p.slug}`} className="group relative flex aspect-square flex-col justify-end overflow-hidden rounded-2xl p-4 text-white shadow-sm ring-1 ring-white/10"
                style={p.bannerUrl ? undefined : projectWallpaper(p.slug)}>
                {p.bannerUrl && /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.bannerUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />}
                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <span aria-hidden className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25"><ArrowUpRight className="h-4 w-4" style={{ color: th.accent }} /></span>
                <span className="relative">
                  <span className="block text-lg font-extrabold leading-snug drop-shadow">{nm(p)}</span>
                  {ds(p) && <span className="mt-1 block line-clamp-2 text-xs text-white/80">{ds(p)}</span>}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
