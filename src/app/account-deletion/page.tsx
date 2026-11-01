import { DeleteAccountForm } from '@/components/ui/DeleteAccountForm'
import { getT } from '@/i18n/server'
import { localizedPath } from '@/i18n/routes'

const TELEGRAM_URL = 'https://t.me/sviydlyasvoih'
const SUPPORT_EMAIL = 'support@sviydlyasvoih.com.ua'
const linkClass = 'text-blue-600 hover:underline'

function range(count: number): number[] {
  return Array.from({ length: count }, (_, i) => i + 1)
}

export default function AccountDeletionPage() {
  const { t, locale } = getT()
  const s = (key: string) => t(`legal.accountDeletion.sections.${key}`)
  const appName = t('legal.accountDeletion.appName')

  const labeledItems = (key: string, count: number) =>
    range(count).map((n) => (
      <li key={n}>
        <span className="font-medium">{s(`${key}.items.${n}.label`)}</span> {s(`${key}.items.${n}.text`)}
      </li>
    ))

  return (
    <div className="bg-neutral-50">
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            {t('legal.accountDeletion.title')}
          </h1>
          <p className="text-gray-600">
            {t('legal.accountDeletion.lastUpdatedLabel', { date: t('legal.accountDeletion.lastUpdated') })}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 space-y-8 text-gray-800 leading-relaxed">
          <div className="space-y-3">
            <p>{t('legal.accountDeletion.intro', { appName })}</p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">{s('now.title')}</h2>
            <p>{s('now.p1')}</p>
            <p className="font-medium">{s('now.stepsIntro')}</p>
            <ol className="list-decimal pl-6 space-y-2">
              {range(5).map((n) => (
                <li key={n}>{s(`now.steps.${n}`)}</li>
              ))}
            </ol>
            <p className="text-sm text-gray-600">{s('now.stepsNote')}</p>
            <DeleteAccountForm />
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">{s('request.title')}</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>{s('request.steps.1')}</li>
              <li>
                {s('request.steps.2')}
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>
                    {s('request.telegram')} <a className={linkClass} href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">{TELEGRAM_URL}</a>
                  </li>
                  <li>
                    {s('request.email')} <a className={linkClass} href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(t('legal.accountDeletion.emailSubject'))}`}>{SUPPORT_EMAIL}</a>
                  </li>
                </ul>
              </li>
              <li>{s('request.steps.3')}</li>
              <li>{s('request.steps.4')}</li>
            </ol>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">{s('deleted.title')}</h2>
            <p>{s('deleted.intro')}</p>
            <ul className="list-disc pl-6 space-y-2">
              {range(4).map((n) => (
                <li key={n}>{s(`deleted.items.${n}`)}</li>
              ))}
            </ul>
            <p>{s('deleted.outro')}</p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">{s('retained.title')}</h2>
            <ul className="list-disc pl-6 space-y-2">{labeledItems('retained', 3)}</ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">{s('timeline.title')}</h2>
            <p>{s('timeline.p1')}</p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">{s('more.title')}</h2>
            <p>
              {s('more.before')}{' '}
              <a className={linkClass} href={localizedPath('/privacy', locale)}>{s('more.link')}</a>
              {s('more.after')}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
