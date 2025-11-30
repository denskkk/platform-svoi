/**
 * Сторінка "Контакти"
 */

import Link from 'next/link';
import { MapPin, Send } from 'lucide-react';

export default function ContactsPage() {
  return (
    <div className="bg-neutral-50">
      {/* Основний контент. Хедер і футер рендеряться глобальним layout.tsx */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Зв&apos;яжіться з нами
          </h1>
          <p className="text-xl text-gray-600">
            Ми завжди раді допомогти вам. Оберіть зручний спосіб зв&apos;язку.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Контактна інформація */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Контактна інформація
            </h2>

            <div className="space-y-6">
              {/* Telegram */}
              <div className="flex items-start">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Send className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">Telegram</h3>
                  <a
                    href="https://t.me/sviydlyasvoih"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Свій для Своїх Адміністрація
                  </a>
                  <p className="text-sm text-gray-500 mt-1">
                    Зв'язок з адміністрацією платформи
                  </p>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <MapPin className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">Адреса</h3>
                  <p className="text-gray-600">
                    Український Центр Месіанського
                  </p>
                  <p className="text-gray-600">
                    м. Київ, Україна
                  </p>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">
                Зв'язок з нами
              </h3>
              <div className="flex gap-4">
                <a
                  href="https://t.me/sviydlyasvoih"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-sky-500 text-white p-3 rounded-lg hover:bg-sky-600 transition flex items-center gap-2"
                  aria-label="Telegram"
                >
                  <Send className="w-6 h-6" />
                  <span>Telegram</span>
                </a>
              </div>
            </div>
          </div>

          {/* Форма зворотнього зв'язку */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Надішліть повідомлення
            </h2>

            <form className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Ваше ім&apos;я *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Іван Іваненко"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ivan@example.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Телефон
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+38 (050) 123-45-67"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Тема *
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Оберіть тему</option>
                  <option value="general">Загальне питання</option>
                  <option value="technical">Технічна підтримка</option>
                  <option value="business">Співпраця для бізнесу</option>
                  <option value="complaint">Скарга</option>
                  <option value="suggestion">Пропозиція</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Повідомлення *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Опишіть ваше питання або пропозицію..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Надіслати повідомлення
              </button>

              <p className="text-sm text-gray-500 text-center">
                Поля позначені * є обов&apos;язковими
              </p>
            </form>
          </div>
        </div>

        {/* FAQ Section */}
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
                Натисніть кнопку &quot;Реєстрація&quot; у верхньому меню, заповніть форму та підтвердіть email. 
                Це займе лише кілька хвилин!
              </p>
            </details>

            <details className="border-b border-gray-200 pb-4">
              <summary className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600">
                Чи безкоштовне розміщення послуг?
              </summary>
              <p className="mt-2 text-gray-600">
                Так! Розміщення послуг на нашій платформі повністю безкоштовне для всіх членів громади.
              </p>
            </details>

            <details className="border-b border-gray-200 pb-4">
              <summary className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600">
                Як залишити відгук про послугу?
              </summary>
              <p className="mt-2 text-gray-600">
                Перейдіть на сторінку послуги, прокрутіть до розділу відгуків та натисніть &quot;Додати відгук&quot;. 
                Ви можете поставити оцінку та написати коментар.
              </p>
            </details>

            <details className="border-b border-gray-200 pb-4">
              <summary className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600">
                Що робити, якщо забув пароль?
              </summary>
              <p className="mt-2 text-gray-600">
                На сторінці входу натисніть &quot;Забули пароль?&quot;, введіть свій email та отримаєте 
                посилання для відновлення паролю.
              </p>
            </details>

            <details className="pb-4">
              <summary className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600">
                Як стати бізнес-акаунтом?
              </summary>
              <p className="mt-2 text-gray-600">
                При реєстрації оберіть тип акаунту &quot;Підприємець&quot; або змініть тип у налаштуваннях профілю. 
                Після цього ви зможете додавати послуги та отримувати відгуки.
              </p>
            </details>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Не знайшли відповідь?
          </h2>
          <p className="text-lg mb-6 text-blue-100">
            Напишіть нам у Telegram! Ми відповімо якнайшвидше.
          </p>
          <a
            href="https://t.me/sviydlyasvoih"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            <Send className="w-5 h-5" />
            Написати в Telegram
          </a>
        </div>
      </section>
    </div>
  );
}
