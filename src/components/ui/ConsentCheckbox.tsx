'use client';

import Link from 'next/link';
import { useI18n } from '@/i18n/client';
import { localizedPath } from '@/i18n/routes';

interface ConsentCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
}

export function ConsentCheckbox({ checked, onChange, id = 'consent' }: ConsentCheckboxProps) {
  const { t, locale } = useI18n();
  return (
    <label htmlFor={id} className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 w-4 h-4 rounded border-gray-300"
        required
      />
      <span>
        {t('common.consent.before')}{' '}
        <Link href={localizedPath('/terms-of-use', locale)} target="_blank" className="text-blue-600 hover:underline font-medium">
          {t('common.consent.terms')}
        </Link>{' '}
        {t('common.consent.and')}{' '}
        <Link href={localizedPath('/privacy', locale)} target="_blank" className="text-blue-600 hover:underline font-medium">
          {t('common.consent.privacy')}
        </Link>
        {t('common.consent.after')}
      </span>
    </label>
  );
}
