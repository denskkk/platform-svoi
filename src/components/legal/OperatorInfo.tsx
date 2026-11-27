'use client';

import { useI18n } from '@/i18n/client';
import { OPERATOR } from '@/lib/operator';

/** Блок «Власник сервісу»: ФОП, адреса реєстрації, e-mail. Однаковий на всіх юридичних сторінках. */
export function OperatorInfo({ className = '', compact = false }: { className?: string; compact?: boolean }) {
  const { t, locale } = useI18n();
  const uk = locale === 'uk';
  return (
    <div className={`rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm leading-6 text-gray-800 ${className}`}>
      {!compact && <p className="mb-1 font-semibold text-gray-900">{t('legal.operator.title')}</p>}
      <dl className="space-y-1">
        <div><dt className="inline font-medium">{t('legal.operator.nameLabel')}: </dt><dd className="inline">{t('legal.operator.status')} {uk ? OPERATOR.fullName : OPERATOR.fullNameEn}</dd></div>
        <div><dt className="inline font-medium">{t('legal.operator.addressLabel')}: </dt><dd className="inline">{uk ? OPERATOR.address : OPERATOR.addressEn}</dd></div>
        <div><dt className="inline font-medium">E-mail: </dt><dd className="inline"><a className="text-primary-700 underline" href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a></dd></div>
      </dl>
    </div>
  );
}
