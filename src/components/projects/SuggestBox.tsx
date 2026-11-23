'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { jsonHeaders } from '@/lib/feedClient';

type Kind = 'suggestion' | 'complaint';

/**
 * Дві обов'язкові папки в кожному проєкті (за ТЗ замовника):
 *  1) «Інформація за проєкт, заробляти зі своїми» — що це за проєкт, куди масштабується, як доєднатися до команди й заробляти;
 *  2) «Пропозиції та Скарги» — форма; повідомлення потрапляють в адмінку «Пропозиції».
 */
export function SuggestBox({ projectSlug }: { projectSlug: string }) {
  const { t } = useI18n();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>('suggestion');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/project-suggestions', { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ projectSlug, kind, text }) });
      if (!res.ok) throw new Error();
      toast.success(t('cabinet.suggest.sent'));
      setText(''); setOpen(false);
    } catch { toast.error(t('feed.toast.actionFailed')); } finally { setSending(false); }
  };

  const tileCls = 'rounded-2xl bg-white shadow-md hover:shadow-lg active:scale-[0.98] transition p-3 min-h-[7rem] flex flex-col items-center justify-center gap-2 text-center';
  return (
    <section aria-label={t('cabinet.tiles.feedback')} className="space-y-3">
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <li>
          <Link href={`/projects/${projectSlug}/earn`} className={`${tileCls} h-full`}>
            <span className="text-4xl" aria-hidden>💼</span>
            <span className="text-sm font-bold text-neutral-900 leading-snug">{t('cabinet.tiles.info')}</span>
          </Link>
        </li>
        <li>
          <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className={`${tileCls} w-full h-full ${open ? 'ring-2 ring-primary-500' : ''}`}>
            <AlertTriangle className="w-9 h-9 text-amber-500" aria-hidden />
            <span className="text-sm font-bold text-neutral-900 leading-snug">{t('cabinet.tiles.feedback')}</span>
          </button>
        </li>
      </ul>
      {open && (
        <form onSubmit={submit} className="rounded-2xl bg-white p-4 space-y-3 shadow-md">
          <div role="radiogroup" aria-label={t('cabinet.tiles.feedback')} className="grid grid-cols-2 gap-2">
            {(['suggestion', 'complaint'] as Kind[]).map((k) => (
              <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)}
                className={`rounded-full py-2 text-sm font-bold ${kind === k ? 'bg-primary-500 text-white' : 'bg-neutral-100 text-neutral-700'}`}>
                {t(`cabinet.tiles.${k}`)}
              </button>
            ))}
          </div>
          <textarea required minLength={5} maxLength={1000} rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder={t(`cabinet.tiles.hint.${kind}`)}
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
          <div className="flex gap-2">
            <button type="submit" disabled={sending} className="flex-1 rounded-full bg-primary-500 font-bold py-2.5 disabled:opacity-50">{t('cabinet.suggest.send')}</button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-full bg-neutral-100 font-semibold px-5">{t('cabinet.suggest.cancel')}</button>
          </div>
        </form>
      )}
    </section>
  );
}
