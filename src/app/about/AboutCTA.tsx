'use client';

import Link from 'next/link';
import { useAuthStatus } from '@/components/ui/AuthGate';
import { useI18n } from '@/i18n/client';
import { localizedPath } from '@/i18n/routes';

export function AboutCTA() {
  const { status } = useAuthStatus();
  const { t, locale } = useI18n();
  const authed = status === 'authed';

  return (
    <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-lg text-center">
      <h2 className="text-3xl font-bold mb-4">
        {authed ? t('about.cta.titleAuthed') : t('about.cta.titleGuest')}
      </h2>
      <p className="text-lg mb-6 text-blue-100">{t('about.cta.subtitle')}</p>
      <div className="flex gap-4 justify-center flex-wrap">
        {status === 'guest' && (
          <Link
            href="/auth/register"
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            {t('about.cta.register')}
          </Link>
        )}
        {authed && (
          <Link
            href="/services"
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            {t('about.cta.services')}
          </Link>
        )}
        <Link
          href={localizedPath('/contacts', locale)}
          className="bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition"
        >
          {t('about.cta.contact')}
        </Link>
      </div>
    </section>
  );
}
