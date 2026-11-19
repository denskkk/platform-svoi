'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { useI18n } from '@/i18n/client';

/**
 * Режим гостя: дивитись можна, але будь-яка дія (лайк, коментар, підписка, перехід углиб)
 * показує вікно «Увійдіть або зареєструйтесь». Елементи з data-guest-ok працюють без входу.
 * Використання: const gate = useGuestGate(isGuest); <div onClickCapture={gate.onClickCapture}>…</div>{gate.modal}
 */
export function useGuestGate(active: boolean) {
  const [open, setOpen] = useState(false);

  const show = useCallback(() => setOpen(true), []);

  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (!active) return;
    const target = e.target as HTMLElement | null;
    const el = target?.closest?.('a[href],button,[role="button"],[role="tab"],input,textarea,select,label');
    if (!el || el.closest('[data-guest-ok]')) return;
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  }, [active]);

  const modal = active && open ? <GuestPrompt onClose={() => setOpen(false)} /> : null;
  return { onClickCapture, show, modal };
}

export function GuestPrompt({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const pathname = usePathname() || '/feed';
  const back = encodeURIComponent(pathname);
  return (
    <div data-guest-ok className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-3" role="dialog" aria-modal="true" aria-label={t('common.guest.title')}>
      <button type="button" className="absolute inset-0 bg-black/50" aria-label={t('common.actions.close')} onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <button type="button" onClick={onClose} aria-label={t('common.actions.close')} className="absolute right-3 top-3 h-8 w-8 rounded-full hover:bg-neutral-100 flex items-center justify-center"><X className="w-5 h-5" /></button>
        <h2 className="text-xl font-bold text-neutral-900 pr-8">{t('common.guest.title')}</h2>
        <p className="mt-1 text-sm text-neutral-600">{t('common.guest.text')}</p>
        <div className="mt-4 grid gap-2">
          <Link href={`/auth/register?returnUrl=${back}`} className="rounded-full bg-primary-500 hover:bg-primary-600 text-neutral-900 font-bold text-center py-3">{t('common.guest.register')}</Link>
          <Link href={`/auth/login?returnUrl=${back}`} className="rounded-full border border-neutral-300 hover:bg-neutral-50 text-neutral-800 font-semibold text-center py-3">{t('common.guest.login')}</Link>
        </div>
      </div>
    </div>
  );
}

/** Смужка-підказка зверху для гостя. */
export function GuestBanner() {
  const { t } = useI18n();
  const pathname = usePathname() || '/feed';
  const back = encodeURIComponent(pathname);
  return (
    <div data-guest-ok className="rounded-lg bg-white shadow-[0_1px_2px_rgba(0,0,0,0.12)] p-4 border border-primary-200">
      <p className="font-bold text-neutral-900">{t('common.guest.bannerTitle')}</p>
      <p className="text-sm text-neutral-600 mt-0.5">{t('common.guest.bannerText')}</p>
      <div className="mt-3 flex gap-2">
        <Link href={`/auth/register?returnUrl=${back}`} className="rounded-full bg-primary-500 hover:bg-primary-600 text-neutral-900 text-sm font-bold px-5 py-2">{t('common.guest.register')}</Link>
        <Link href={`/auth/login?returnUrl=${back}`} className="rounded-full border border-neutral-300 hover:bg-neutral-50 text-neutral-800 text-sm font-semibold px-5 py-2">{t('common.guest.login')}</Link>
      </div>
    </div>
  );
}
