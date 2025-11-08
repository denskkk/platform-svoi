/**
 * Публічна сторінка каталогу послуг (БЕЗ потреби реєстрації)
 */

import Link from 'next/link';
import { Search, MapPin, Star, ArrowRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';

// Позначаємо сторінку як динамічну
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getServices() {
  try {
    const services = await prisma.service.findMany({
      take: 20,
      orderBy: [
        { user: { avgRating: 'desc' } },
        { createdAt: 'desc' }
      ],
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            city: true,
            avgRating: true,
            totalReviews: true,
            isVerified: true,
          }
        },
        category: true,
      }
    });

    return services;
  } catch (error) {
    console.error('Error loading services:', error);
    return [];
  }
}

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <div className="bg-gray-50">
      {/* Hero (глобальний Navbar вже є у layout) */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12 mt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Каталог послуг</h1>
          <p className="text-xl text-blue-100 mb-6">
            Знайдіть перевірені послуги від членів нашої громади
          </p>

          {/* Search */}
          <div className="bg-white rounded-lg p-4 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Що ви шукаєте? (наприклад: сантехнік)"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-semibold">
              Знайти
            </button>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Доступні послуги ({services.length})
          </h2>
        </div>

        {services.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <p className="text-gray-600 text-lg mb-4">Поки що немає доступних послуг</p>
            <Link
              href="/auth/register"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-semibold"
            >
              Стати першим!
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service: any) => (
              <Link
                key={service.id}
                href={`/profile/${service.user.id}`}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6 group"
              >
                {/* Category */}
                <div className="text-sm text-blue-600 mb-2 font-semibold">
                  {service.category?.name || 'Інше'}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition">
                  {service.title}
                </h3>

                {/* Description */}
                {service.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {service.description}
                  </p>
                )}

                {/* Price */}
                <div className="text-lg font-semibold text-gray-900 mb-4">
                  {service.priceFrom && service.priceTo
                    ? `${service.priceFrom}-${service.priceTo} ${service.priceUnit || 'грн'}`
                    : service.priceFrom
                    ? `від ${service.priceFrom} ${service.priceUnit || 'грн'}`
                    : service.priceTo
                    ? `до ${service.priceTo} ${service.priceUnit || 'грн'}`
                    : 'За домовленістю'}
                </div>

                {/* Provider */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                        {service.user.avatarUrl ? (
                          <img
                            src={service.user.avatarUrl}
                            alt={service.user.firstName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                            {service.user.firstName[0]}{service.user.lastName[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {service.user.firstName} {service.user.lastName}
                          {service.user.isVerified && (
                            <span className="ml-1 text-blue-600" title="Верифікований">✓</span>
                          )}
                        </p>
                        {service.user.city && (
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {service.user.city}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Rating */}
                    {service.user.totalReviews > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="font-semibold text-gray-900 text-sm">
                          {service.user.avgRating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* View Button */}
                <div className="mt-4">
                  <div className="flex items-center text-blue-600 group-hover:text-blue-700 text-sm font-semibold">
                    Переглянути профіль
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Приєднуйтесь до спільноти!</h2>
          <p className="text-lg mb-6 text-blue-100">
            Знаходьте перевірених спеціалістів та надійних людей поруч
          </p>
          <Link
            href="/auth/register"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Зареєструватися
          </Link>
        </div>
      </main>

    </div>
  );
}
