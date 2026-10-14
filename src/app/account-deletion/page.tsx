import { DeleteAccountForm } from '@/components/ui/DeleteAccountForm'

export const metadata = {
  title: 'Видалення акаунта та даних — СВІЙ ДЛЯ СВОЇХ',
  description:
    'Як видалити акаунт та пов’язані дані у застосунку/на сайті «СВІЙ ДЛЯ СВОЇХ» (Svoi Platform).',
}

export default function AccountDeletionPage() {
  const appName = 'СВІЙ ДЛЯ СВОЇХ (Svoi Platform)'
  const telegramUrl = 'https://t.me/sviydlyasvoih'
  const supportEmail = 'support@sviydlyasvoih.com.ua'
  const lastUpdated = '14 жовтня 2026'

  return (
    <div className="bg-neutral-50">
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Видалення акаунта та даних
          </h1>
          <p className="text-gray-600">Дата останнього оновлення: {lastUpdated}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 space-y-8 text-gray-800 leading-relaxed">
          <div className="space-y-3">
            <p>
              Ця сторінка описує, як користувачі {appName} можуть видалити
              акаунт та пов’язані з ним дані.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">Видалити акаунт зараз</h2>
            <p>
              Якщо ви увійшли у свій профіль, видалити акаунт можна одразу на цій сторінці —
              в застосунку або на сайті.
            </p>
            <DeleteAccountForm />
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">1) Якщо не можете увійти — подайте запит</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                Підготуйте інформацію для ідентифікації акаунта: e-mail, номер телефону
                (якщо вказували), а також (за можливості) посилання на профіль або ID
                користувача.
              </li>
              <li>
                Надішліть запит одним із способів:
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>
                    Telegram: <a className="text-blue-600 hover:underline" href={telegramUrl} target="_blank" rel="noopener noreferrer">{telegramUrl}</a>
                  </li>
                  <li>
                    E-mail: <a className="text-blue-600 hover:underline" href={`mailto:${supportEmail}?subject=${encodeURIComponent('Запит на видалення акаунта — СВІЙ ДЛЯ СВОЇХ')}`}>{supportEmail}</a>
                  </li>
                </ul>
              </li>
              <li>
                У повідомленні напишіть фразу “Прошу видалити мій акаунт та пов’язані дані”
                і вкажіть ваші дані для пошуку акаунта (e-mail/телефон).
              </li>
              <li>
                За потреби ми можемо попросити додаткове підтвердження, що акаунт належить вам
                (щоб запобігти видаленню за чужим запитом).
              </li>
            </ol>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">2) Які дані будуть видалені</h2>
            <p>Після підтвердження запиту ми видаляємо або знеособлюємо дані, пов’язані з вашим акаунтом, зокрема:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>дані облікового запису (e-mail, хеш пароля, роль/статус акаунта);</li>
              <li>дані профілю (ім’я/прізвище, фото, опис, контакти, соціальні посилання, інші поля профілю);</li>
              <li>опублікований вами контент у межах Платформи (послуги/заявки/відгуки) — видалення або знеособлення залежно від типу контенту;</li>
              <li>завантажені зображення (аватар, фото послуг/заявок), якщо вони не потрібні для цілісності інших записів.</li>
            </ul>
            <p>
              Повідомлення в чатах можуть бути видалені або знеособлені, щоб не порушувати цілісність діалогів інших
              користувачів.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">3) Які дані можуть бути збережені та на який строк</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <span className="font-medium">Технічні журнали (логи)</span> можуть зберігатися обмежений час для безпеки та діагностики
                (зазвичай до 90 днів).
              </li>
              <li>
                <span className="font-medium">Резервні копії</span> можуть містити частину даних до моменту перезапису
                (зазвичай до 30 днів).
              </li>
              <li>
                <span className="font-medium">Дані, які ми зобов’язані зберігати за законом</span> (якщо застосовно), можуть бути збережені
                на строк, передбачений вимогами законодавства.
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">4) Строк виконання</h2>
            <p>
              Ми прагнемо виконати запит на видалення протягом 30 днів з моменту підтвердження особи власника акаунта.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">5) Додаткова інформація</h2>
            <p>
              Детальніше про обробку персональних даних дивіться у{' '}
              <a className="text-blue-600 hover:underline" href="/privacy">Політиці конфіденційності</a>.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
