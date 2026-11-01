/**
 * About page
 */

import Link from 'next/link';
import { getT } from '@/i18n/server';
import { localizedPath } from '@/i18n/routes';
import { AboutCTA } from './AboutCTA';

const TELEGRAM_URL = 'https://t.me/sviydlyasvoih';
const SUPPORT_EMAIL = 'support@sviydlyasvoih.com.ua';

const H2_CLASS = 'text-2xl font-semibold text-gray-800 mb-4';
const LINK_CLASS = 'text-blue-600 hover:underline';

export default function AboutPage() {
  const { t, locale } = getT();

  const legalLinks = [
    { href: '/privacy', label: t('about.legalLinks.privacy') },
    { href: '/terms-of-use', label: t('about.legalLinks.terms') },
    { href: '/support', label: t('about.legalLinks.support') },
    { href: '/account-deletion', label: t('about.legalLinks.accountDeletion') },
  ];

  const features = ['catalog', 'profiles', 'services', 'requests', 'chat', 'favorites', 'reviews', 'reports'];
  const securityItems = ['passwords', 'sessions', 'https', 'limits', 'access', 'deletion'];
  const registrationSteps = ['choose', 'fill', 'done', 'login'];
  const purposeItems = ['find', 'publish', 'contact', 'trust'];

  return (
    <div className="bg-neutral-50">
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            {t('about.title')}
          </h1>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className={H2_CLASS}>{t('about.overview.title')}</h2>
              <p className="text-gray-600 leading-relaxed mb-3">{t('about.overview.intro')}</p>
              <p className="text-gray-600 leading-relaxed">{t('about.overview.details')}</p>
            </section>

            <nav aria-label={t('about.legalLinks.title')} className="mb-8 bg-blue-50 border border-blue-100 rounded-lg p-5">
              <p className="font-semibold text-blue-900 mb-3">{t('about.legalLinks.title')}</p>
              <ul className="flex flex-wrap gap-3">
                {legalLinks.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={localizedPath(item.href, locale)}
                      className="inline-block bg-white text-blue-700 border border-blue-200 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <section className="mb-8">
              <h2 className={H2_CLASS}>{t('about.mission.title')}</h2>
              <p className="text-gray-600 leading-relaxed">{t('about.mission.text')}</p>
            </section>

            <section className="mb-8">
              <h2 className={H2_CLASS}>{t('about.purpose.title')}</h2>
              <p className="text-gray-600 leading-relaxed mb-3">{t('about.purpose.intro')}</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                {purposeItems.map((key) => (
                  <li key={key}>{t(`about.purpose.items.${key}`)}</li>
                ))}
              </ul>
            </section>

            <section className="mb-8">
              <h2 className={H2_CLASS}>{t('about.why.title')}</h2>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                {['trust', 'support', 'quality', 'convenience'].map((key) => (
                  <li key={key}>
                    <strong>{t(`about.why.${key}.label`)}</strong> {t(`about.why.${key}.text`)}
                  </li>
                ))}
              </ul>
            </section>

            <section className="mb-8">
              <h2 className={H2_CLASS}>{t('about.who.title')}</h2>
              <p className="text-gray-600 leading-relaxed mb-4">{t('about.who.intro')}</p>
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="bg-neutral-50 border border-neutral-200 p-5 rounded-lg">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">{t('about.who.viewer.name')}</h3>
                  <p className="text-gray-700 text-sm">{t('about.who.viewer.text')}</p>
                </div>
                <div className="bg-blue-50 p-5 rounded-lg">
                  <h3 className="font-semibold text-lg text-blue-900 mb-2">{t('about.who.individual.name')}</h3>
                  <p className="text-gray-700 text-sm">{t('about.who.individual.text')}</p>
                </div>
                <div className="bg-orange-50 p-5 rounded-lg">
                  <h3 className="font-semibold text-lg text-orange-900 mb-2">{t('about.who.business.name')}</h3>
                  <p className="text-gray-700 text-sm">{t('about.who.business.text')}</p>
                </div>
              </div>
              <p className="text-gray-600 leading-relaxed">{t('about.who.free')}</p>
            </section>

            <section className="mb-8">
              <h2 className={H2_CLASS}>{t('about.features.title')}</h2>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                {features.map((key) => (
                  <li key={key}>
                    <strong>{t(`about.features.${key}.label`)}</strong> {t(`about.features.${key}.text`)}
                  </li>
                ))}
              </ul>
            </section>

            <section className="mb-8">
              <h2 className={H2_CLASS}>{t('about.offer.title')}</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-lg text-blue-900 mb-2">
                    {t('about.offer.business.title')}
                  </h3>
                  <ul className="text-gray-700 space-y-1 text-sm">
                    <li>{t('about.offer.business.items.free')}</li>
                    <li>{t('about.offer.business.items.audience')}</li>
                    <li>{t('about.offer.business.items.reviews')}</li>
                    <li>{t('about.offer.business.items.cabinet')}</li>
                  </ul>
                </div>
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-lg text-green-900 mb-2">
                    {t('about.offer.consumers.title')}
                  </h3>
                  <ul className="text-gray-700 space-y-1 text-sm">
                    <li>{t('about.offer.consumers.items.free')}</li>
                    <li>{t('about.offer.consumers.items.reviews')}</li>
                    <li>{t('about.offer.consumers.items.search')}</li>
                    <li>{t('about.offer.consumers.items.contact')}</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className={H2_CLASS}>{t('about.registration.title')}</h2>
              <ol className="list-decimal list-inside text-gray-600 space-y-2 mb-4">
                {registrationSteps.map((key) => (
                  <li key={key}>{t(`about.registration.steps.${key}`)}</li>
                ))}
              </ol>
              <p className="text-gray-600 leading-relaxed mb-4">{t('about.registration.note')}</p>
              <div className="flex gap-3 flex-wrap">
                <Link
                  href="/auth/register"
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  {t('about.registration.register')}
                </Link>
                <Link
                  href="/auth/login"
                  className="bg-white text-blue-700 border border-blue-200 px-5 py-2.5 rounded-lg font-medium hover:bg-blue-50 transition"
                >
                  {t('about.registration.login')}
                </Link>
              </div>
            </section>

            <section className="mb-8">
              <h2 className={H2_CLASS}>{t('about.security.title')}</h2>
              <p className="text-gray-600 leading-relaxed mb-3">{t('about.security.intro')}</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-3">
                {securityItems.map((key) => (
                  <li key={key}>{t(`about.security.items.${key}`)}</li>
                ))}
              </ul>
              <p className="text-gray-600 leading-relaxed">
                {t('about.security.privacyBefore')}
                <Link href={localizedPath('/privacy', locale)} className={LINK_CLASS}>
                  {t('about.security.privacyLink')}
                </Link>
                {t('about.security.privacyAfter')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className={H2_CLASS}>{t('about.values.title')}</h2>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
                <ul className="space-y-3 text-gray-700">
                  {[
                    { key: 'honesty', icon: '🤝' },
                    { key: 'mutual', icon: '❤️' },
                    { key: 'quality', icon: '⭐' },
                    { key: 'faith', icon: '🙏' },
                  ].map((item) => (
                    <li key={item.key} className="flex items-start">
                      <span className="text-2xl mr-3">{item.icon}</span>
                      <div>
                        <strong>{t(`about.values.${item.key}.label`)}</strong> {t(`about.values.${item.key}.text`)}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className={H2_CLASS}>{t('about.support.title')}</h2>
              <p className="text-gray-600 leading-relaxed mb-3">{t('about.support.text')}</p>
              <ul className="text-gray-600 space-y-2 mb-3">
                <li>
                  <strong>{t('about.support.emailLabel')}</strong>{' '}
                  <a href={`mailto:${SUPPORT_EMAIL}`} className={LINK_CLASS}>
                    {SUPPORT_EMAIL}
                  </a>
                </li>
                <li>
                  <strong>{t('about.support.telegramLabel')}</strong>{' '}
                  <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
                    {TELEGRAM_URL}
                  </a>
                </li>
              </ul>
              <p className="text-gray-600 space-x-4">
                <Link href={localizedPath('/support', locale)} className={LINK_CLASS}>
                  {t('about.support.supportLink')}
                </Link>
                <Link href={localizedPath('/contacts', locale)} className={LINK_CLASS}>
                  {t('about.support.contactsLink')}
                </Link>
              </p>
            </section>

            <section className="mb-8">
              <h2 className={H2_CLASS}>{t('about.deletion.title')}</h2>
              <p className="text-gray-600 leading-relaxed mb-3">{t('about.deletion.text')}</p>
              <Link href={localizedPath('/account-deletion', locale)} className={LINK_CLASS}>
                {t('about.deletion.link')}
              </Link>
            </section>

            <AboutCTA />
          </div>
        </div>
      </section>
    </div>
  );
}
