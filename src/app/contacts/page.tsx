/**
 * Сторінка "Контакти"
 */

import Link from 'next/link';
import { Mail, Send } from 'lucide-react';

export const metadata = {
  title: 'Контакти — СВІЙ ДЛЯ СВОЇХ',
  description: 'Зв’яжіться з адміністрацією платформи «СВІЙ ДЛЯ СВОЇХ»: Telegram та e-mail підтримки.',
};

const TELEGRAM_URL = 'https://t.me/sviydlyasvoih';
const SUPPORT_EMAIL = 'support@sviydlyasvoih.com.ua';

export default function ContactsPage() {
  return (
    <div className="bg-neutral-50">
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Зв&apos;яжіться з нами
          </h1>
          <p className="text-xl text-gray-600">
            Ми завжди раді допомогти вам. Оберіть зручний спосіб зв&apos;язку.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-start">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Send className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h2 className="font-semibold text-gray-900 text-lg">Telegram</h2>
                <p className="text-sm text-gray-500 mt-1 mb-4">
                  Найшвидший спосіб зв&apos;язатися з адміністрацією платформи
                </p>
                <a
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-sky-500 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-sky-600 transition"
                >
                  <Send className="w-5 h-5" />
                  Написати в Telegram
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
                <h2 className="font-semibold text-gray-900 text-lg">E-mail</h2>
                <p className="text-sm text-gray-500 mt-1 mb-4">
                  Питання щодо акаунта, скарги та запити щодо персональних даних
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
            Часті питання (FAQ)
          </h2>

          <div className="space-y-4">
            <details className="border-b border-gray-200 pb-4">
              <summary className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600">
                Як зареєструватися на платформі?
              </summary>
              <p className="mt-2 text-gray-600">
                Натисніть кнопку &quot;Реєстрація&quot;, оберіть тип профілю та заповніть форму.
                Це займе лише кілька хвилин!
              </p>
            </details>

            <details className="border-b border-gray-200 pb-4">
              <summary className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600">
                Чи безкоштовне розміщення послуг?
              </summary>
              <p className="mt-2 text-gray-600">
                Так! Користування платформою та розміщення послуг безкоштовні.
              </p>
            </details>

            <details className="border-b border-gray-200 pb-4">
              <summary className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600">
                Як залишити відгук?
              </summary>
              <p className="mt-2 text-gray-600">
                Відгук можна залишити після виконання заявки: відкрийте профіль виконавця або заявку,
                поставте оцінку та за бажанням напишіть коментар.
              </p>
            </details>

            <details className="border-b border-gray-200 pb-4">
              <summary className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600">
                Що робити, якщо забув пароль?
              </summary>
              <p className="mt-2 text-gray-600">
                Напишіть адміністрації в Telegram або на e-mail підтримки — ми допоможемо відновити доступ
                до акаунта після підтвердження вашої особи.
              </p>
            </details>

            <details className="border-b border-gray-200 pb-4">
              <summary className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600">
                Як видалити акаунт?
              </summary>
              <p className="mt-2 text-gray-600">
                Інструкція доступна на сторінці{' '}
                <Link href="/account-deletion" className="text-blue-600 hover:underline">
                  видалення акаунта та даних
                </Link>
                .
              </p>
            </details>

            <details className="pb-4">
              <summary className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600">
                Як поскаржитися на користувача або контент?
              </summary>
              <p className="mt-2 text-gray-600">
                Надішліть посилання на профіль або матеріал та короткий опис проблеми в Telegram чи на
                e-mail підтримки. Докладніше — в{' '}
                <Link href="/terms-of-use" className="text-blue-600 hover:underline">
                  Умовах використання
                </Link>
                .
              </p>
            </details>
          </div>
        </div>
      </section>
    </div>
  );
}
