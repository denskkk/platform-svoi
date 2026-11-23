'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { authHeaders } from '@/lib/feedClient';

interface Item { id: number; kind: string; text: string; status: string; createdAt: string }

/** «Мої заявки»: власні звернення користувача до проєкту з їхнім статусом (нова, на розгляді, є пропозиції, потрібне уточнення, закрита). */
export function MyRequests({ projectSlug, kinds }: { projectSlug: string; kinds?: string[] }) {
  const { t, formatDate } = useI18n();
  const [items, setItems] = useState<Item[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [hist, setHist] = useState<Record<number, Array<{ at: string; status: string }> | 'loading' | 'error'>>({});

  const toggle = async (id: number) => {
    if (hist[id]) { setHist((p) => { const n = { ...p }; delete n[id]; return n; }); return; }
    setHist((p) => ({ ...p, [id]: 'loading' }));
    try {
      const r = await fetch(`/api/project-suggestions/${id}/history`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
      if (!r.ok) throw new Error();
      const d = await r.json();
      setHist((p) => ({ ...p, [id]: d.events }));
    } catch { setHist((p) => ({ ...p, [id]: 'error' })); }
  };

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/project-suggestions?projectSlug=${encodeURIComponent(projectSlug)}`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => { if (!cancelled) setItems(d.items as Item[]); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [projectSlug]);

  if (failed) return <p className="rounded-2xl bg-white p-4 text-sm text-red-600">{t('listings.common.loadFailed')}</p>;
  if (!items) return <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-white" /></div>;
  const shown = kinds?.length ? items.filter((i) => kinds.indexOf(i.kind) !== -1) : items;
  if (shown.length === 0) return <p className="rounded-2xl bg-white p-4 text-sm text-neutral-600">{t('projects.f.mineEmpty')}</p>;
  return (
    <ul className="space-y-2">
      {shown.map((i) => (
        <li key={i.id} className="rounded-2xl bg-white p-3 shadow-md space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-neutral-500">№{i.id} · {formatDate(i.createdAt)}</span>
            <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-800">{t(`admin.suggestions.status.${i.status}`)}</span>
          </div>
          <p className="text-sm text-neutral-800 whitespace-pre-wrap break-words">{i.text.replace(/\s*\|?\s*\S*\/uploads\/\S+/g, '').slice(0, 600)}</p>
          <button type="button" onClick={() => toggle(i.id)} className="text-xs font-semibold text-primary-700 underline">{hist[i.id] ? t('projects.f.historyHide') : t('projects.f.history')}</button>
          {hist[i.id] === 'loading' && <Loader2 className="w-4 h-4 animate-spin text-neutral-500" />}
          {hist[i.id] === 'error' && <p className="text-xs text-red-600">{t('listings.common.loadFailed')}</p>}
          {Array.isArray(hist[i.id]) && (
            <ol className="border-l-2 border-neutral-200 pl-3 space-y-1">
              {(hist[i.id] as Array<{ at: string; status: string }>).map((e, k) => <li key={k} className="text-xs text-neutral-700"><span className="font-semibold">{t(`admin.suggestions.status.${e.status}`)}</span> · {formatDate(e.at)}</li>)}
            </ol>
          )}
        </li>
      ))}
    </ul>
  );
}
