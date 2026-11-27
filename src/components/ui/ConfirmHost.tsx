'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n/client';

type Req = { message: string; resolve: (v: boolean) => void };
let push: ((r: Req) => void) | null = null;

/** Єдине вікно підтвердження замість системного window.confirm: `if (!(await askConfirm(text))) return;` */
export function askConfirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (push) push({ message, resolve });
    else resolve(typeof window !== 'undefined' ? window.confirm(message) : false); // запасний варіант, якщо хост ще не змонтовано
  });
}

/** Показує одне підтвердження за раз. Підключається один раз у layout. */
export function ConfirmHost() {
  const { t } = useI18n();
  const [queue, setQueue] = useState<Req[]>([]);
  useEffect(() => { push = (r) => setQueue((q) => [...q, r]); return () => { push = null; }; }, []);
  const cur = queue[0];
  const done = (v: boolean) => { if (!cur) return; cur.resolve(v); setQueue((q) => q.slice(1)); };
  useEffect(() => {
    if (!cur) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') done(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur]);
  if (!cur) return null;
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-label={cur.message}>
      <button type="button" aria-label={t('common.actions.cancel')} onClick={() => done(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
        <p className="whitespace-pre-line text-base font-semibold text-neutral-900">{cur.message}</p>
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={() => done(false)} className="flex-1 rounded-full border border-neutral-300 py-2.5 font-bold text-neutral-700 hover:bg-neutral-50">{t('common.actions.cancel')}</button>
          <button type="button" autoFocus onClick={() => done(true)} className="flex-1 rounded-full bg-primary-500 py-2.5 font-extrabold text-neutral-900 hover:bg-primary-600">{t('common.actions.confirm')}</button>
        </div>
      </div>
    </div>
  );
}
