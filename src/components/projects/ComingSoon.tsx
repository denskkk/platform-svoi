'use client';

import Link from 'next/link';
import { useI18n } from '@/i18n/client';

interface Props {
  icon?: string | null;
  title: string;
  description?: string | null;
  backHref: string;
  backLabel: string;
}

/** Заглушка для напрямків і функцій, які ще не запущені. */
export function ComingSoon({ icon, title, description, backHref, backLabel }: Props) {
  const { t } = useI18n();
  return (
    <div className="bg-white rounded-3xl border border-neutral-200/70 shadow-sm p-8 text-center space-y-4">
      <div className="text-6xl" aria-hidden>{icon || '✨'}</div>
      <span className="inline-block rounded-full bg-primary-100 text-primary-800 text-xs font-bold uppercase tracking-wide px-3 py-1">{t('projects.soon')}</span>
      <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
      {description && <p className="text-neutral-600 max-w-md mx-auto">{description}</p>}
      <p className="text-sm text-neutral-500">{t('projects.soonDescription')}</p>
      <Link href={backHref} className="inline-block rounded-full bg-primary-500 hover:bg-primary-600 text-white font-semibold px-6 py-2.5">{backLabel}</Link>
    </div>
  );
}
