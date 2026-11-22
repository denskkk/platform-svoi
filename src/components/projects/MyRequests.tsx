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
            <span className="text-xs text-neutral-500">{formatDate(i.createdAt)}</span>
            <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-800">{t(`admin.suggestions.status.${i.status}`)}</span>
          </div>
          <p className="text-sm text-neutral-800 whitespace-pre-wrap break-words">{i.text.replace(/\s*\|?\s*\S*\/uploads\/\S+/g, '').slice(0, 600)}</p>
        </li>
      ))}
    </ul>
  );
}
