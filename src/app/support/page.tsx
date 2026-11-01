/**
 * Public support page (no authentication required).
 * Title/description metadata comes from the central i18n metadata (meta.pages.support).
 */

import Link from 'next/link';
import { Mail, Send } from 'lucide-react';
import { getT } from '@/i18n/server';
import { localizedPath } from '@/i18n/routes';

const TELEGRAM_URL = 'https://t.me/sviydlyasvoih';
const SUPPORT_EMAIL = 'support@sviydlyasvoih.com.ua';

const LINK_CLASS = 'text-blue-600 hover:underline';
const FAQ_ITEM_CLASS = 'border-b border-gray-200 pb-4';
const FAQ_SUMMARY_CLASS = 'font-semibold text-gray-900 cursor-pointer hover:text-blue-600';

export default function SupportPage() {
  const { t, locale } = getT();

  const plainFaq = ['login', 'password', 'editProfile', 'free'];
  const links = [
    { href: '/account-deletion', label: t('support.links.accountDeletion') },
    { href: '/privacy', label: t('support.links.privacy') },
    { href: '/terms-of-use', label: t('support.links.terms') },
    { href: '/about', label: t('support.links.about') },
  ];

  return (
    <div className="bg-neutral-50">
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('support.title')}</h1>
          <p className="text-xl text-gray-600">{t('support.subtitle')}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">{t('support.contact.title')}</h2>
          <p className="text-gray-600 mb-6">{t('support.contact.intro')}</p>

          <div className="grid md:grid-cols-2 gap-8 mb-6">
            <div className="flex items-start">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Mail className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900 text-lg">{t('support.contact.emailTitle')}</h3>
                <p className="text-sm text-gray-500 mt-1 mb-4">{t('support.contact.emailDescription')}</p>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="inline-flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-purple-700 transition break-all"
                >
                  <Mail className="w-5 h-5 shrink-0" />
                  {SUPPORT_EMAIL}
                </a>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Send className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900 text-lg">{t('support.contact.telegramTitle')}</h3>
                <p className="text-sm text-gray-500 mt-1 mb-4">{t('support.contact.telegramDescription')}</p>
                <a
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-sky-500 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-sky-600 transition"
                >
                  <Send className="w-5 h-5" />
                  {t('support.contact.telegramButton')}
                </a>
              </div>
            </div>
          </div>

          <p className="text-gray-600">
            {t('support.contact.contactsBefore')}
            <Link href={localizedPath('/contacts', locale)} className={LINK_CLASS}>
              {t('support.contact.contactsLink')}
            </Link>
            {t('support.contact.contactsAfter')}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">{t('support.faq.title')}</h2>

          <div className="space-y-4">
            <details className={FAQ_ITEM_CLASS}>
              <summary className={FAQ_SUMMARY_CLASS}>{t('support.faq.register.question')}</summary>
              <p className="mt-2 text-gray-600">
                {t('support.faq.register.before')}
                <Link href="/auth/register" className={LINK_CLASS}>
                  {t('support.faq.register.link')}
                </Link>
                {t('support.faq.register.after')}
              </p>
            </details>

            {plainFaq.map((key) => (
              <details key={key} className={FAQ_ITEM_CLASS}>
                <summary className={FAQ_SUMMARY_CLASS}>{t(`support.faq.${key}.question`)}</summary>
                <p className="mt-2 text-gray-600">{t(`support.faq.${key}.answer`)}</p>
              </details>
            ))}

            <details className={FAQ_ITEM_CLASS}>
              <summary className={FAQ_SUMMARY_CLASS}>{t('support.faq.report.question')}</summary>
              <div className="mt-2 text-gray-600 space-y-2">
                <p>{t('support.faq.report.answer')}</p>
                <p>
                  {t('support.faq.report.before')}
                  <Link href={localizedPath('/terms-of-use', locale)} className={LINK_CLASS}>
                    {t('support.faq.report.link')}
                  </Link>
                  {t('support.faq.report.after')}
                </p>
              </div>
            </details>

            <details className="pb-4">
              <summary className={FAQ_SUMMARY_CLASS}>{t('support.faq.delete.question')}</summary>
              <div className="mt-2 text-gray-600 space-y-2">
                <p>
                  {t('support.faq.delete.before')}
                  <Link href={localizedPath('/account-deletion', locale)} className={LINK_CLASS}>
                    {t('support.faq.delete.link')}
                  </Link>
                  {t('support.faq.delete.after')}
                </p>
                <p>{t('support.deletionNote')}</p>
              </div>
            </details>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('support.links.title')}</h2>
          <ul className="flex flex-wrap gap-3">
            {links.map((item) => (
              <li key={item.href}>
                <Link
                  href={localizedPath(item.href, locale)}
                  className="inline-block bg-blue-50 text-blue-700 border border-blue-100 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
