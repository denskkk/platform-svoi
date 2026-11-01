import { getT } from '@/i18n/server'
import { localizedPath } from '@/i18n/routes'

const linkClass = 'text-blue-600 hover:underline'
const TELEGRAM_URL = 'https://t.me/sviydlyasvoih'
const SUPPORT_EMAIL = 'support@sviydlyasvoih.com.ua'

function range(count: number): number[] {
  return Array.from({ length: count }, (_, i) => i + 1)
}

export default function PrivacyPolicyPage() {
  const { t, locale } = getT()
  const s = (key: string) => t(`legal.privacy.sections.${key}`)

  const plainList = (key: string, count: number) => (
    <ul className="list-disc pl-6 space-y-2">
      {range(count).map((n) => (
        <li key={n}>{s(`${key}.items.${n}`)}</li>
      ))}
    </ul>
  )

  const labeledList = (key: string, count: number) => (
    <ul className="list-disc pl-6 space-y-2">
      {range(count).map((n) => (
        <li key={n}>
          <span className="font-medium">{s(`${key}.items.${n}.label`)}</span> {s(`${key}.items.${n}.text`)}
        </li>
      ))}
    </ul>
  )

  return (
    <div className="bg-neutral-50">
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{t('legal.privacy.title')}</h1>
          <p className="text-gray-600">
            {t('legal.privacy.lastUpdatedLabel', { date: t('legal.privacy.lastUpdated') })}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 space-y-8 text-gray-800 leading-relaxed">
          <div className="space-y-3">
            <p>{t('legal.privacy.intro.p1')}</p>
            <p>{t('legal.privacy.intro.p2')}</p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">{s('controller.title')}</h2>
            <p>{s('controller.p1')}</p>
            <p>
              {s('controller.contactsBefore')}{' '}
              <a className={linkClass} href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">{TELEGRAM_URL}</a>{' '}
              {s('controller.contactsOr')}{' '}
              <a className={linkClass} href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">{s('dataCollected.title')}</h2>
            <p>{s('dataCollected.intro')}</p>
            {labeledList('dataCollected', 6)}
            <p>{s('dataCollected.outro')}</p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">{s('dataSources.title')}</h2>
            {plainList('dataSources', 2)}
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">{s('purposes.title')}</h2>
            {plainList('purposes', 5)}
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">{s('visibility.title')}</h2>
            <p>{s('visibility.p1')}</p>
            <p>{s('visibility.p2')}</p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">{s('cookies.title')}</h2>
            <p>{s('cookies.p1')}</p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">{s('thirdParties.title')}</h2>
            <p>{s('thirdParties.intro')}</p>
            {labeledList('thirdParties', 2)}
            <p>{s('thirdParties.outro')}</p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">{s('security.title')}</h2>
            <p>{s('security.p1')}</p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">{s('retention.title')}</h2>
            <p>{s('retention.p1')}</p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">{s('rights.title')}</h2>
            <p>{s('rights.intro')}</p>
            {plainList('rights', 4)}
            <p>
              {s('rights.p2Before')}{' '}
              <a className={linkClass} href={localizedPath('/account-deletion', locale)}>/account-deletion</a>
              {' '}{s('rights.p2After')}
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">{s('children.title')}</h2>
            <p>{s('children.p1')}</p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">{s('changes.title')}</h2>
            <p>{s('changes.p1')}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
