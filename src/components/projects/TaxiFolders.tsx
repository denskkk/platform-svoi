'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { authHeaders } from '@/lib/feedClient';
import { applyIdOf, findFolder, foldersFor, ProjectFolder } from '@/lib/projectFolders';
import { useFolderImages } from '@/lib/useFolderImages';
import { FolderTileInner, folderTileCls } from './FolderTile';
import { ProjectForm } from './ProjectForm';
import { TaxiOrder, TaxiOrderProps } from './TaxiOrder';

const SLUG = 'taxi';

interface Trip { id: number; kind: string; city: string; fromAddress: string | null; toAddress: string | null; rideType: string | null; carClass: string | null; scheduledAt: string | null; status: string; createdAt: string }

/** Мої запити на поїздки (історія). Дані лише поточного користувача. */
function TaxiTrips() {
  const { t, locale } = useI18n();
  const [items, setItems] = useState<Trip[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/taxi/requests', { credentials: 'include', headers: authHeaders(), cache: 'no-store' })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => { if (!cancelled) setItems(d.requests || []); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, []);
  const fmt = (v: string) => new Date(v).toLocaleString(locale === 'uk' ? 'uk-UA' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' });

  if (error) return <div className="rounded-2xl bg-white p-5 text-center text-sm text-red-600 shadow-md">{t('listings.common.loadFailed')}</div>;
  if (!items) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-white/80" /></div>;
  if (items.length === 0) return <div className="rounded-2xl bg-white p-6 text-center text-sm text-neutral-600 shadow-md">{t('projects.taxi.trips.empty')}</div>;
  return (
    <ul className="space-y-2">
      {items.map((r) => (
        <li key={r.id} className="rounded-2xl bg-white p-3 shadow-md space-y-0.5">
          <p className="text-sm font-bold text-neutral-900">{r.fromAddress || '—'} → {r.toAddress || '—'}</p>
          <p className="text-xs text-neutral-500">{[r.city, r.rideType && t(`projects.taxi.trips.ride.${r.rideType}`), r.scheduledAt ? fmt(r.scheduledAt) : fmt(r.createdAt)].filter(Boolean).join(' · ')}</p>
          <p className="text-xs font-semibold text-neutral-700">{r.kind === 'waitlist' ? t('projects.taxi.trips.waitlist') : t('projects.taxi.trips.accepted')}</p>
        </li>
      ))}
    </ul>
  );
}

/** Екран кінцевої папки «Таксі». */
function TaxiLeaf({ node, path }: { node: ProjectFolder; path: string }) {
  const { t } = useI18n();
  const kind = node.kind || '';
  const label = t(node.labelKey);
  const [type, arg] = kind.split(':');
  const textKey = `projects.taxi.text.${path.replace('.', '_')}`;

  if (type === 'order') return <TaxiOrder variant={arg as TaxiOrderProps['variant']} />;
  if (type === 'ride') return <TaxiOrder ride={arg as TaxiOrderProps['ride']} />;
  if (type === 'trips') return <TaxiTrips />;
  if (type === 'form') return (
    <div className="space-y-3">
      <p className="rounded-2xl bg-black/30 backdrop-blur text-sm text-white p-3">{t(textKey) !== textKey ? t(textKey) : t(`projects.taxi.form.lead.${arg}`)}</p>
      <ProjectForm projectSlug={SLUG} kind={arg as 'request' | 'consult' | 'suggestion' | 'complaint'} label={label} />
    </div>
  );
  // info / info:apply
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white p-4 shadow-md space-y-3">
        <p className="text-sm text-neutral-800 whitespace-pre-line">{t(textKey)}</p>
        {arg === 'apply' && (
          <Link href={`/projects/${SLUG}/earn?apply=${encodeURIComponent(applyIdOf(SLUG, path.split('.')))}`} className="inline-flex rounded-full bg-primary-500 hover:bg-primary-600 font-bold px-5 py-2.5">{t('projects.taxi.info.apply')}</Link>
        )}
      </div>
      <p className="text-xs font-semibold text-white/80 px-1">{t('projects.taxi.info.ask')}</p>
      <ProjectForm projectSlug={SLUG} kind="consult" label={label} />
    </div>
  );
}

/** Структура «Таксі для своїх»: 8 папок (за ТЗ замовника) з підпапками. Папка живе в адресі (?folder=a або a.b). */
export function TaxiFolders({ folderPath, openFolder }: { folderPath: string | null; openFolder: (path: string | null) => void }) {
  const { t } = useI18n();
  const images = useFolderImages(SLUG);
  const found = findFolder(SLUG, folderPath);
  const list = found ? found.folder.children : foldersFor(SLUG);

  const back = (
    found && (
      <button type="button" onClick={() => openFolder(found.parent ? found.parent.key : null)} className="inline-flex items-center gap-2 rounded-full bg-white/90 text-sm font-semibold text-neutral-800 px-3 py-1.5">
        <ArrowLeft className="w-4 h-4" /> {t('cabinet.foldersUi.back')}{!found.folder.children ? ` · ${t(found.folder.labelKey)}` : ''}
      </button>
    )
  );

  if (found && !found.folder.children) {
    return <div className="space-y-3">{back}<TaxiLeaf node={found.folder} path={folderPath || ''} /></div>;
  }
  return (
    <div className="space-y-3">
      {back}
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {(list || []).map((f) => {
          const p = found ? `${found.folder.key}.${f.key}` : f.key;
          const img = images[p];
          const cls = folderTileCls(img);
          const inner = <FolderTileInner image={img} icon={f.icon} label={t(f.labelKey)} arrow={!!f.children} />;
          const target = f.href ? f.href : f.apply ? `/projects/${SLUG}/earn?apply=${encodeURIComponent(applyIdOf(SLUG, p.split('.')))}` : null;
          return (
            <li key={f.key}>
              {target
                ? <Link href={target} className={cls}>{inner}</Link>
                : <button type="button" onClick={() => openFolder(p)} className={cls}>{inner}</button>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
