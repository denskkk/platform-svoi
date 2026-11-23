'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { FieldsForm } from './FieldsForm';

interface Item { id: number; text: string; createdAt: string }
const inputCls = 'w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary-400';

/** Публічна дошка заявок, опублікованих адміністрацією: пошук за продукцією / країною, кнопка «Запропонувати покупця». Контакти автора не показуються. */
export function RequestBoard({ project, kind, offerForm, label }: { project: string; kind: string; offerForm: string; label: string }) {
  const { t, formatDate } = useI18n();
  const [q, setQ] = useState('');
  const [country, setCountry] = useState('');
  const [items, setItems] = useState<Item[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [offerFor, setOfferFor] = useState<number | null>(null);

  const load = useCallback(async (query: string, c: string) => {
    setFailed(false);
    try {
      const r = await fetch(`/api/project-suggestions/board?projectSlug=${encodeURIComponent(project)}&kind=${encodeURIComponent(kind)}&q=${encodeURIComponent(query)}&country=${encodeURIComponent(c)}`, { cache: 'no-store' });
      if (!r.ok) throw new Error();
      setItems((await r.json()).items as Item[]);
    } catch { setFailed(true); setItems([]); }
  }, [project, kind]);

  useEffect(() => { load('', ''); }, [load]);
  const search = (e: FormEvent) => { e.preventDefault(); setItems(null); load(q.trim(), country.trim()); };

  return (
    <div className="space-y-3">
      <form onSubmit={search} className="rounded-2xl bg-white p-4 space-y-2 shadow-md">
        <input value={q} onChange={(e) => setQ(e.target.value)} maxLength={80} placeholder={t('projects.board.q')} aria-label={t('projects.board.q')} className={inputCls} />
        <input value={country} onChange={(e) => setCountry(e.target.value)} maxLength={60} placeholder={t('projects.board.country')} aria-label={t('projects.board.country')} className={inputCls} />
        <button type="submit" className="w-full rounded-full bg-primary-500 hover:bg-primary-600 font-bold py-2.5">{t('projects.board.search')}</button>
      </form>
      {!items && <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-white" /></div>}
      {failed && <p className="rounded-2xl bg-white p-4 text-sm text-red-600">{t('listings.common.loadFailed')}</p>}
      {items && !failed && items.length === 0 && <p className="rounded-2xl bg-white p-4 text-sm text-neutral-600">{t('projects.board.empty')}</p>}
      {items?.map((i) => (
        <article key={i.id} className="rounded-2xl bg-white p-3 shadow-md space-y-2">
          <p className="text-xs text-neutral-500">№{i.id} · {formatDate(i.createdAt)}</p>
          <p className="text-sm text-neutral-800 whitespace-pre-wrap break-words">{i.text}</p>
          <button type="button" onClick={() => setOfferFor(offerFor === i.id ? null : i.id)} className="rounded-full bg-neutral-900 text-white text-sm font-bold px-4 py-1.5">{t('projects.board.offer')}</button>
          {offerFor === i.id && <FieldsForm key={i.id} projectSlug={project} formId={offerForm} label={`${label} №${i.id}`} onSent={() => setOfferFor(null)} />}
        </article>
      ))}
      <p className="text-xs text-white/80 px-1">{t('projects.board.privacy')}</p>
    </div>
  );
}
