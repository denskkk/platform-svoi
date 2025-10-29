/**
 * Сторінка вибору типу реєстрації
 */

'use client';

import Link from 'next/link';
import { Users, Briefcase, Eye } from 'lucide-react';

type AccountType = 'individual' | 'business' | 'viewer';

export default function RegisterPage() {
  const accountTypes = [
    {
      id: 'individual' as AccountType,
      title: 'Фізична особа',
      description: 'Я надаю послуги як приватна особа',
      icon: Users,
      color: 'blue',
      href: '/auth/register/individual',
    },
    {
      id: 'business' as AccountType,
      title: 'Бізнес-акаунт',
      description: 'Я представляю компанію або бізнес',
      icon: Briefcase,
      color: 'purple',
      href: '/auth/register/business',
    },
    {
      id: 'viewer' as AccountType,
      title: 'Глядач',
      description: 'Я просто хочу переглянути послуги без реєстрації',
      icon: Eye,
      color: 'green',
      href: '/catalog',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="text-3xl font-bold text-blue-600 mb-4 inline-block">
            Свій для Своїх
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Приєднатися до Платформи
          </h1>
          <p className="text-lg text-gray-600">
            Оберіть тип акаунту, який відповідає вашим потребам
          </p>
        </div>

        {/* Account Types */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {accountTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Link
                key={type.id}
                href={type.href}
                className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition transform hover:scale-105"
              >
                <div className={`bg-${type.color}-100 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto`}>
                  <Icon className={`w-8 h-8 text-${type.color}-600`} />
                </div>
                <h2 className="text-xl font-bold text-gray-900 text-center mb-3">
                  {type.title}
                </h2>
                <p className="text-gray-600 text-center">
                  {type.description}
                </p>
              </Link>
            );
          })}
        </div>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-gray-600">
            Вже є акаунт?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
              Увійти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

