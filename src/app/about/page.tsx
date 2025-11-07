/**
 * Сторінка "Про нас"
 */

import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Свій для Своїх
            </Link>
            <nav className="flex gap-6">
              <Link href="/" className="text-gray-600 hover:text-blue-600">
                Головна
              </Link>
              <Link href="/about" className="text-blue-600 font-semibold">
                Про нас
              </Link>
              <Link href="/contacts" className="text-gray-600 hover:text-blue-600">
                Контакти
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Про платформу &quot;Свій для Своїх&quot;
          </h1>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                🎯 Наша Місія
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Ми створили платформу, яка об'єднує українську діаспору та широку спільноту 
                для взаємодопомоги у веденні бізнесу та отриманні послуг. Наша мета — підтримати своїх, 
                створити довірливу спільноту, де кожен може знайти перевірені 
                послуги від людей, які поділяють спільні цінності.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                💡 Чому &quot;Свій для Своїх&quot;?
              </h2>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>
                  <strong>Довіра:</strong> Всі учасники дотримуються високих етичних стандартів
                </li>
                <li>
                  <strong>Підтримка:</strong> Кожна угода — це підтримка свого бізнесу, 
                  своєї родини, своєї громади
                </li>
                <li>
                  <strong>Якість:</strong> Система рейтингів та відгуків допомагає 
                  підтримувати високий рівень сервісу
                </li>
                <li>
                  <strong>Зручність:</strong> Знайти потрібну послугу або клієнта 
                  тепер легко і швидко
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                🚀 Що ми пропонуємо?
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-lg text-blue-900 mb-2">
                    Для Підприємців
                  </h3>
                  <ul className="text-gray-700 space-y-1 text-sm">
                    <li>✓ Безкоштовне розміщення послуг</li>
                    <li>✓ Доступ до цільової аудиторії</li>
                    <li>✓ Система рейтингів та відгуків</li>
                    <li>✓ Особистий кабінет підприємця</li>
                  </ul>
                </div>
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-lg text-green-900 mb-2">
                    Для Споживачів
                  </h3>
                  <ul className="text-gray-700 space-y-1 text-sm">
                    <li>✓ Перевірені постачальники послуг</li>
                    <li>✓ Прозорі відгуки та рейтинги</li>
                    <li>✓ Пошук за категоріями та містами</li>
                    <li>✓ Пряме спілкування з виконавцями</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                🌟 Наші Цінності
              </h2>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-2xl mr-3">🤝</span>
                    <div>
                      <strong>Чесність:</strong> Прозорі відносини між усіма учасниками
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-2xl mr-3">❤️</span>
                    <div>
                      <strong>Взаємодопомога:</strong> Підтримуємо один одного у розвитку
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-2xl mr-3">⭐</span>
                    <div>
                      <strong>Якість:</strong> Прагнемо до високих стандартів у всьому
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-2xl mr-3">🙏</span>
                    <div>
                      <strong>Віра:</strong> Дотримуємось біблійних принципів у бізнесі
                    </div>
                  </li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                📊 Статистика Платформи
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center bg-blue-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">100+</div>
                  <div className="text-sm text-gray-600">Користувачів</div>
                </div>
                <div className="text-center bg-green-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">50+</div>
                  <div className="text-sm text-gray-600">Послуг</div>
                </div>
                <div className="text-center bg-purple-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">20+</div>
                  <div className="text-sm text-gray-600">Міст</div>
                </div>
                <div className="text-center bg-orange-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-orange-600">4.8★</div>
                  <div className="text-sm text-gray-600">Рейтинг</div>
                </div>
              </div>
            </section>

            <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-lg text-center">
              <h2 className="text-3xl font-bold mb-4">
                Приєднуйтесь до нашої спільноти!
              </h2>
              <p className="text-lg mb-6 text-blue-100">
                Разом ми сильніші. Разом ми будуємо майбутнє.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link
                  href="/register"
                  className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
                >
                  Зареєструватися
                </Link>
                <Link
                  href="/contacts"
                  className="bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition"
                >
                  Зв'язатися з нами
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-400">
              © 2025 Свій для Своїх. Український Центр Месіанського. Всі права захищені.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
