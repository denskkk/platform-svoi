/**
 * Contacts page. Title/description metadata comes from the central i18n metadata (meta.pages.contacts).
 */

import Link from 'next/link';
import { Mail, Send } from 'lucide-react';
import { getT } from '@/i18n/server';
import { localizedPath } from '@/i18n/routes';

const TELEGRAM_URL = 'https://t.me/sviydlyasvoih';
const SUPPORT_EMAIL = 'support@sviydlyasvoih.com.ua';

const FAQ_ITEM_CLASS = 'border-b border-gray-200 pb-4';
const FAQ_SUMMARY_CLASS = 'font-semibold text-gray-900 cursor-pointer hover:text-blue-600';

export default function ContactsPage() {
  const { t, locale } = getT();

  return (
    <div className="bg-neutral-50">
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('contacts.title')}
          </h1>
          <p className="text-xl text-gray-600">
            {t('contacts.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-start">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Send className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h2 className="font-semibold text-gray-900 text-lg">{t('contacts.telegram.title')}</h2>
                <p className="text-sm text-gray-500 mt-1 mb-4">
                  {t('contacts.telegram.description')}
                </p>
                <a
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-sky-500 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-sky-600 transition"
                >
                  <Send className="w-5 h-5" />
                  {t('contacts.telegram.button')}
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-start">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Mail className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h2 className="font-semibold text-gray-900 text-lg">{t('contacts.email.title')}</h2>
                <p className="text-sm text-gray-500 mt-1 mb-4">
                  {t('contacts.email.description')}
                </p>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="inline-flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-purple-700 transition break-all"
                >
                  <Mail className="w-5 h-5 shrink-0" />
                  {SUPPORT_EMAIL}
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            {t('contacts.faq.title')}
          </h2>

          <div className="space-y-4">
            <details className={FAQ_ITEM_CLASS}>
              <summary className={FAQ_SUMMARY_CLASS}>
                {t('contacts.faq.register.question')}
              </summary>
              <p className="mt-2 text-gray-600">
                {t('contacts.faq.register.answer')}
              </p>
            </details>

            <details className={FAQ_ITEM_CLASS}>
              <summary className={FAQ_SUMMARY_CLASS}>
                {t('contacts.faq.free.question')}
              </summary>
              <p className="mt-2 text-gray-600">
                {t('contacts.faq.free.answer')}
              </p>
            </details>

            <details className={FAQ_ITEM_CLASS}>
              <summary className={FAQ_SUMMARY_CLASS}>
                {t('contacts.faq.review.question')}
              </summary>
              <p className="mt-2 text-gray-600">
                {t('contacts.faq.review.answer')}
              </p>
            </details>

            <details className={FAQ_ITEM_CLASS}>
              <summary className={FAQ_SUMMARY_CLASS}>
                {t('contacts.faq.password.question')}
              </summary>
              <p className="mt-2 text-gray-600">
                {t('contacts.faq.password.answer')}
              </p>
            </details>

            <details className={FAQ_ITEM_CLASS}>
              <summary className={FAQ_SUMMARY_CLASS}>
                {t('contacts.faq.delete.question')}
              </summary>
              <p className="mt-2 text-gray-600">
                {t('contacts.faq.delete.before')}
                <Link href={localizedPath('/account-deletion', locale)} className="text-blue-600 hover:underline">
                  {t('contacts.faq.delete.link')}
                </Link>
                {t('contacts.faq.delete.after')}
              </p>
            </details>

            <details className="pb-4">
              <summary className={FAQ_SUMMARY_CLASS}>
                {t('contacts.faq.report.question')}
              </summary>
              <p className="mt-2 text-gray-600">
                {t('contacts.faq.report.before')}
                <Link href={localizedPath('/terms-of-use', locale)} className="text-blue-600 hover:underline">
                  {t('contacts.faq.report.link')}
                </Link>
                {t('contacts.faq.report.after')}
              </p>
            </details>
          </div>
        </div>
      </section>
    </div>
  );
}
