'use client';

import Link from 'next/link';
import { useAuthStatus } from '@/components/ui/AuthGate';

export function AboutCTA() {
  const { status } = useAuthStatus();
  const authed = status === 'authed';

  return (
    <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-lg text-center">
      <h2 className="text-3xl font-bold mb-4">
        {authed ? 'Дякуємо, що ви з нами!' : 'Приєднуйтесь до нашої спільноти!'}
      </h2>
      <p className="text-lg mb-6 text-blue-100">Разом ми сильніші. Разом ми будуємо майбутнє.</p>
      <div className="flex gap-4 justify-center flex-wrap">
        {status === 'guest' && (
          <Link
            href="/auth/register"
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Зареєструватися
          </Link>
        )}
        {authed && (
          <Link
            href="/services"
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Переглянути послуги
          </Link>
        )}
        <Link
          href="/contacts"
          className="bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition"
        >
          Зв&apos;язатися з нами
        </Link>
      </div>
    </section>
  );
}
