'use client';

import Link from 'next/link';
import { Briefcase } from 'lucide-react';
import { useI18n } from '@/i18n/client';

/**
 * Показується замість форми, коли розділ проєкту — для бізнесу (лікарі, адвокати, магазини тощо),
 * а в людини звичайний акаунт: пропонуємо створити бізнес-акаунт.
 */
export function BusinessRequired({ returnUrl }: { returnUrl: string }) {
  const { t } = useI18n();
  return (
    <div role="status" className="bg-white rounded-2xl border border-primary-200 shadow-sm p-5 text-center space-y-3">
      <span className="mx-auto h-12 w-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center"><Briefcase className="w-6 h-6" /></span>
      <h2 className="text-lg font-bold text-neutral-900">{t('listings.business.title')}</h2>
      <p className="text-sm text-neutral-700">{t('listings.business.text')}</p>
      <Link href={`/auth/register/business?returnUrl=${encodeURIComponent(returnUrl)}`} className="inline-block rounded-full bg-primary-500 hover:bg-primary-600 text-white font-semibold px-6 py-2.5">
        {t('listings.business.cta')}
      </Link>
    </div>
  );
}
