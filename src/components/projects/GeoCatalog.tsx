'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { authHeaders } from '@/lib/feedClient';
import { ProjectFolder } from '@/lib/projectFolders';
import { ProjectCatalog } from '@/components/listings/ProjectCatalog';
import { FieldsForm } from './FieldsForm';

interface Opt { value: string; count: number }

/**
 * Каталог із «папками» з наявних оголошень: країна → область → місто (або порода). Показуються лише значення, за якими вже є
 * оголошення; далі — звичайний каталог із відповідними фільтрами. Адміністрація додає нове (країну, область…) через заявку.
 */
export function GeoCatalog({ slug, node, label }: { slug: string; node: ProjectFolder; label: string }) {
  const { t } = useI18n();
  const levels = node.drill ?? [];
  const [chosen, setChosen] = useState<string[]>([]);
  const [options, setOptions] = useState<Opt[] | null>(null);
  const [all, setAll] = useState(false);
  const [adding, setAdding] = useState(false);
  const level = levels[chosen.length];

  useEffect(() => {
    if (!level || all) return;
    let cancelled = false;
    setOptions(null);
    const qs = new URLSearchParams({ project: slug, section: node.sectionId || '', field: level });
    chosen.forEach((v, i) => qs.set(levels[i], v));
    fetch(`/api/listings/facets?${qs.toString()}`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { options: [] }))
      .then((d) => { if (!cancelled) setOptions(d.options || []); })
      .catch(() => { if (!cancelled) setOptions([]); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, all, chosen.join('|'), slug, node.sectionId]);

  const filters: Record<string, string> = { ...node.filters };
  chosen.forEach((v, i) => { filters[levels[i] === 'city' ? 'city' : `f_${levels[i]}`] = v; });
  const showCatalog = all || !level || (options !== null && options.length === 0);
  const chip = 'rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-neutral-800';

  return (
    <div className="space-y-3">
      {(chosen.length > 0 || (level && !showCatalog)) && (
        <div className="flex flex-wrap items-center gap-2">
          {chosen.map((v, i) => <button key={`${v}-${i}`} type="button" onClick={() => { setChosen(chosen.slice(0, i)); setAll(false); }} className={chip}>{v} ×</button>)}
          {level && !all && <button type="button" onClick={() => setAll(true)} className="rounded-full bg-primary-500 px-3 py-1 text-sm font-semibold text-white">{t('projects.drill.showAll')}</button>}
          {all && <button type="button" onClick={() => setAll(false)} className={chip}>{t('projects.drill.byPlace')}</button>}
        </div>
      )}
      {!showCatalog && (
        <div className="space-y-3">
          <p className="rounded-xl bg-black/30 backdrop-blur px-3 py-2 text-sm font-semibold text-white">{t(`projects.drill.pick.${level}`)}</p>
          {options === null
            ? <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-white" /></div>
            : (
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {options.map((o) => (
                  <li key={o.value}>
                    <button type="button" onClick={() => setChosen(chosen.concat(o.value))} className="w-full h-full min-h-[5rem] rounded-2xl bg-white shadow-md hover:shadow-lg active:scale-[0.98] transition p-3 flex flex-col items-center justify-center gap-1 text-center">
                      <span className="text-sm font-bold text-neutral-900 leading-snug">{o.value}</span>
                      <span className="text-xs text-neutral-500">{t('projects.drill.count', { count: o.count })}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
        </div>
      )}
      {showCatalog && <ProjectCatalog key={`${chosen.join('|')}-${all}`} slug={slug} initialFilters={filters} sectionId={node.sectionId} business={node.business} />}
      {level && (
        <div className="space-y-2">
          <button type="button" onClick={() => setAdding((v) => !v)} aria-expanded={adding} className="w-full rounded-xl bg-white/90 text-sm font-semibold text-neutral-900 px-3 py-2.5">{t(`projects.drill.add.${level}`)}</button>
          {adding && <FieldsForm projectSlug={slug} formId="addPlace" label={`${label} · ${t(`projects.drill.add.${level}`)}`} onSent={() => setAdding(false)} />}
        </div>
      )}
    </div>
  );
}
