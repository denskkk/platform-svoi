import Link from 'next/link'
import { getT } from '@/i18n/server'
import { localizedPath } from '@/i18n/routes'

const sections = [
  { id: 'general', key: 'general' },
  { id: 'platform', key: 'platform' },
  { id: 'account', key: 'account' },
  { id: 'content', key: 'content' },
  { id: 'services', key: 'services' },
  { id: 'transactions', key: 'transactions' },
  { id: 'communication', key: 'communication' },
  { id: 'prohibited', key: 'prohibited' },
  { id: 'moderation', key: 'moderation' },
  { id: 'payments', key: 'payments' },
  { id: 'privacy', key: 'privacy' },
  { id: 'intellectual-property', key: 'intellectualProperty' },
  { id: 'availability', key: 'availability' },
  { id: 'liability', key: 'liability' },
  { id: 'termination', key: 'termination' },
  { id: 'changes', key: 'changes' },
  { id: 'contact', key: 'contact' },
]

const linkClass =
  'font-medium text-primary-700 underline decoration-primary-200 underline-offset-4 hover:decoration-primary-700'
const TELEGRAM_URL = 'https://t.me/sviydlyasvoih'

export default function TermsOfUsePage() {
  const { t, locale } = getT()
  const s = (key: string) => t(`legal.terms.sections.${key}`)

  const heading = (key: string) => (
    <h2 className="text-2xl font-semibold tracking-tight text-gray-950">{s(`${key}.title`)}</h2>
  )

  const privacyLink = (label: string) => (
    <Link className={linkClass} href={localizedPath('/privacy', locale)}>
      {label}
    </Link>
  )

  const deletionLink = (label: string) => (
    <Link className={linkClass} href={localizedPath('/account-deletion', locale)}>
      {label}
    </Link>
  )

  const telegramLink = (label: string) => (
    <a className={linkClass} href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">
      {label}
    </a>
  )

  const list = (key: string, count: number) => (
    <ul className="list-disc space-y-2 pl-6">
      {Array.from({ length: count }, (_, i) => i + 1).map((n) => (
        <li key={n}>{s(`${key}.items.${n}`)}</li>
      ))}
    </ul>
  )

  return (
    <div className="min-h-screen bg-neutral-50">
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mb-8">
          <Link
            href={localizedPath('/', locale)}
            className="mb-7 inline-flex items-center text-sm font-medium text-primary-700 hover:text-primary-800"
          >
            <span aria-hidden="true" className="mr-2">←</span>
            {t('legal.terms.backHome')}
          </Link>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-primary-700">
            {t('legal.terms.brand')}
          </p>
          <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-gray-950 sm:text-5xl">
            {t('legal.terms.title')}
          </h1>
          <p className="mt-4 text-sm text-gray-600">{t('legal.terms.edition')}</p>
        </div>

        <div className="mb-8 rounded-xl border border-primary-200 bg-primary-50 p-5 text-sm leading-6 text-gray-800 sm:p-6">
          <p>{t('legal.terms.intro.p1')}</p>
          <p className="mt-3">{t('legal.terms.intro.p2')}</p>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[250px_minmax(0,1fr)]">
          <nav
            aria-label={t('legal.terms.tocLabel')}
            className="rounded-xl border border-neutral-200 bg-white p-5 lg:sticky lg:top-6"
          >
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
              {t('legal.terms.tocTitle')}
            </h2>
            <ol className="max-h-[min(70vh,760px)] space-y-2.5 overflow-y-auto pr-2">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    className="text-sm leading-5 text-neutral-700 hover:text-primary-700"
                    href={`#${section.id}`}
                  >
                    {s(`${section.key}.title`)}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <article className="min-w-0 rounded-xl border border-neutral-200 bg-white p-6 text-gray-800 shadow-sm sm:p-9">
            <div className="space-y-10 leading-7">
              <section id="general" className="scroll-mt-8 space-y-4">
                {heading('general')}
                <p>{s('general.p1')}</p>
                <p>{s('general.p2')}</p>
                <p>
                  {s('general.p3Before')}{' '}
                  {privacyLink(s('general.p3PrivacyLink'))}
                  {s('general.p3Middle')}{' '}
                  {deletionLink(s('general.p3DeletionLink'))}
                  {s('general.p3After')}
                </p>
              </section>

              <section id="platform" className="scroll-mt-8 space-y-4">
                {heading('platform')}
                <p>{s('platform.p1')}</p>
                <p>{s('platform.p2')}</p>
              </section>

              <section id="account" className="scroll-mt-8 space-y-4">
                {heading('account')}
                {list('account', 4)}
                <p>{s('account.p1')}</p>
              </section>

              <section id="content" className="scroll-mt-8 space-y-4">
                {heading('content')}
                <p>{s('content.p1')}</p>
                <p>{s('content.p2')}</p>
                <p>{s('content.p3')}</p>
              </section>

              <section id="services" className="scroll-mt-8 space-y-4">
                {heading('services')}
                <p>{s('services.p1')}</p>
                <p>{s('services.p2')}</p>
              </section>

              <section id="transactions" className="scroll-mt-8 space-y-4">
                {heading('transactions')}
                <p>{s('transactions.p1')}</p>
                <p>{s('transactions.p2')}</p>
              </section>

              <section id="communication" className="scroll-mt-8 space-y-4">
                {heading('communication')}
                <p>{s('communication.p1')}</p>
                <p>
                  {s('communication.p2Before')}{' '}
                  {privacyLink(s('communication.p2Link'))}
                  {s('communication.p2After')}
                </p>
              </section>

              <section id="prohibited" className="scroll-mt-8 space-y-4">
                {heading('prohibited')}
                <p>{s('prohibited.intro')}</p>
                {list('prohibited', 7)}
              </section>

              <section id="moderation" className="scroll-mt-8 space-y-4">
                {heading('moderation')}
                <p>
                  {s('moderation.p1Before')}{' '}
                  {telegramLink(s('moderation.p1Link'))}
                  {s('moderation.p1After')}
                </p>
                <p>{s('moderation.p2')}</p>
              </section>

              <section id="payments" className="scroll-mt-8 space-y-4">
                {heading('payments')}
                <p>{s('payments.p1')}</p>
                <p>{s('payments.p2')}</p>
              </section>

              <section id="privacy" className="scroll-mt-8 space-y-4">
                {heading('privacy')}
                <p>
                  {s('privacy.p1Before')}{' '}
                  {privacyLink(s('privacy.p1Link'))}
                  {s('privacy.p1After')}
                </p>
              </section>

              <section id="intellectual-property" className="scroll-mt-8 space-y-4">
                {heading('intellectualProperty')}
                <p>{s('intellectualProperty.p1')}</p>
                <p>{s('intellectualProperty.p2')}</p>
              </section>

              <section id="availability" className="scroll-mt-8 space-y-4">
                {heading('availability')}
                <p>{s('availability.p1')}</p>
              </section>

              <section id="liability" className="scroll-mt-8 space-y-4">
                {heading('liability')}
                <p>{s('liability.p1')}</p>
                <p>{s('liability.p2')}</p>
              </section>

              <section id="termination" className="scroll-mt-8 space-y-4">
                {heading('termination')}
                <p>
                  {s('termination.before')}{' '}
                  {deletionLink(s('termination.link'))}
                  {s('termination.after')}
                </p>
              </section>

              <section id="changes" className="scroll-mt-8 space-y-4">
                {heading('changes')}
                <p>{s('changes.p1')}</p>
              </section>

              <section id="contact" className="scroll-mt-8 space-y-4">
                {heading('contact')}
                <p>
                  {s('contact.p1Before')}{' '}
                  {telegramLink(s('contact.p1Link'))}
                  {s('contact.p1After')}
                </p>
                <p>{s('contact.p2')}</p>
              </section>

              <p className="border-t border-neutral-200 pt-5 text-sm text-neutral-500">
                {t('legal.terms.footnote')}
              </p>
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}
