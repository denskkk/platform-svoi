'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { readStoredUser } from '@/lib/feedClient';

/** Каркас сторінок меню кабінету: кнопка «назад», заголовок, перевірка входу. */
export function MenuShell({ title, backHref = '/menu', children }: { title: string; backHref?: string; children: ReactNode }) {
  const { t } = useI18n();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!readStoredUser()) { router.replace(`/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}`); return; }
    setReady(true);
  }, [router]);
  if (!ready) return null;
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto w-full max-w-xl px-3 sm:px-4 pb-28 md:pb-12">
        <header className="sticky top-0 z-10 -mx-3 sm:-mx-4 flex items-center gap-2 bg-white/95 backdrop-blur px-3 sm:px-4 py-3 border-b border-neutral-200 pt-[calc(0.75rem+var(--safe-area-inset-top,0px))] md:pt-3 md:top-16">
          <Link href={backHref} aria-label={t('cabinet.shell.back')} className="p-2 -ml-2 rounded-full hover:bg-neutral-100"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-lg font-bold text-neutral-900 truncate">{title}</h1>
        </header>
        <div className="pt-4 space-y-4">{children}</div>
      </div>
    </div>
  );
}

/** Рядок-посилання зі стрілкою (як у меню TikTok). */
export function MenuRow({ href, icon, label, hint, badge, onClick }: { href?: string; icon?: ReactNode; label: string; hint?: string; badge?: string; onClick?: () => void }) {
  const inner = (
    <>
      {icon && <span className="shrink-0 text-neutral-700">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-neutral-900 leading-snug">{label}</span>
        {hint && <span className="block text-xs text-neutral-500 mt-0.5">{hint}</span>}
      </span>
      {badge && <span className="shrink-0 rounded-full bg-primary-100 text-primary-800 text-[10px] font-bold uppercase px-2 py-0.5">{badge}</span>}
      <span aria-hidden className="shrink-0 text-neutral-400">›</span>
    </>
  );
  const cls = 'flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-neutral-50 active:bg-neutral-100 transition';
  return href ? <Link href={href} className={cls}>{inner}</Link> : <button type="button" onClick={onClick} className={cls}>{inner}</button>;
}

export function MenuGroup({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section>
      {title && <h2 className="px-1 pb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">{title}</h2>}
      <div className="rounded-2xl bg-white border border-neutral-200/70 shadow-sm divide-y divide-neutral-100 overflow-hidden">{children}</div>
    </section>
  );
}
