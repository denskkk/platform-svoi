/**
 * Публічна сторінка каталогу послуг (БЕЗ потреби реєстрації)
 */

import Link from 'next/link';
import { Search, MapPin, Star, ArrowRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { ServiceImage } from '@/components/ui/ServiceImage';
import { expandSearchQuery, detectCategoryFromQuery, calculateRelevance } from '@/lib/searchKeywords';

// Позначаємо сторінку як динамічну
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getServices(q?: string, city?: string, category?: string) {
  try {
    const where: any = {
      isActive: true,
    };

    // Розумний пошук з синонімами та пов'язаними термінами
    if (q) {
      const expandedTerms = expandSearchQuery(q);
      
      // Автоматично визначаємо категорію за запитом, якщо не вказана
      if (!category) {
        const detectedCategory = detectCategoryFromQuery(q);
        if (detectedCategory) {
          category = detectedCategory;
        }
      }
      
      // Створюємо умови пошуку для всіх розширених термінів
      const orConditions: any[] = [];
      expandedTerms.forEach(term => {
        orConditions.push(
          { title: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
          { user: { profession: { contains: term, mode: 'insensitive' } } },
          { user: { businessInfo: { businessType: { contains: term, mode: 'insensitive' } } } },
          { user: { businessInfo: { businessCategory: { contains: term, mode: 'insensitive' } } } },
        );
      });
      
      where.OR = orConditions;
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (category) {
      where.category = { slug: category };
    }

    const services = await prisma.service.findMany({
      where,
      take: 100,
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
            profession: true,
            avgRating: true,
            totalReviews: true,
            isVerified: true,
            businessInfo: {
              select: {
                businessType: true,
                businessCategory: true,
              }
            }
          }
        },
        category: true,
      }
    });

    // Also fetch active requests (promoted or public) and map to service-like shape
    try {
      const requestWhere: any = { status: 'active' };
      if (q) {
        requestWhere.OR = [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ];
      }
      if (city) requestWhere.city = { contains: city, mode: 'insensitive' };
      if (category) requestWhere.categoryId = undefined; // keep category filtering for services only

      const requests = await prisma.request.findMany({
        where: requestWhere,
        take: 100,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              city: true,
              profession: true,
              avgRating: true,
              totalReviews: true,
              isVerified: true,
            }
          }
        }
      });

      // Map requests to a unified shape and merge with services so requests
      // appear as service-like cards in the main grid.
      const mappedRequests = requests.map((r: any) => ({
        id: r.id,
        kind: 'request',
        requestType: r.type,
        title: r.title,
        description: r.description,
        imageUrl: null,
        category: null,
        priceFrom: r.priceUcm ? Number(r.priceUcm) : null,
        priceTo: null,
        priceUnit: r.priceUcm ? 'уцмок' : undefined,
        city: r.city,
        createdAt: r.createdAt,
        user: r.user,
      }));

      // Keep requestsByType in case UI needs grouped sidebars, but to avoid
      // duplication we'll return requests merged into the main `services`
      // array and provide an empty requestsByType so subsections don't
      // duplicate the cards. If you prefer both, change this behavior.
      const requestsByType: any = {}

      // Combine services and requests into a single list and sort by date
      const servicesOnly = services.map((s: any) => ({ ...s, kind: 'service' }));
      const merged = [...mappedRequests, ...servicesOnly]
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return { services: merged, requestsByType };
    } catch (err) {
      console.warn('Failed to load requests to merge into services listing:', err);
    }

    // Якщо є пошуковий запит, сортуємо за релевантністю
    if (q) {
      const sorted = services
        .map((service: any) => ({
          ...service,
          relevance: calculateRelevance(q, 
            `${service.title} ${service.description} ${service.user.profession || ''} ${service.user.businessInfo?.businessType || ''} ${service.user.businessInfo?.businessCategory || ''}`
          )
        }))
        .sort((a: any, b: any) => {
          // Спочатку за релевантністю, потім за рейтингом
          if (b.relevance !== a.relevance) return b.relevance - a.relevance;
          return Number(b.user.avgRating) - Number(a.user.avgRating);
        });

      return { services: sorted, requestsByType: {} };
    }

    return { services, requestsByType: {} };
  } catch (error) {
    console.error('Error loading services:', error);
    return { services: [], requestsByType: {} };
  }
}

export default async function ServicesPage({ 
  searchParams 
}: { 
  searchParams?: { q?: string; city?: string; category?: string } 
}) {
  const q = searchParams?.q;
  const city = searchParams?.city;
  const category = searchParams?.category;
  const { services, requestsByType } = await getServices(q, city, category) as any;

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
          <form action="/services" method="GET" className="bg-white rounded-lg p-4 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Що ви шукаєте? (сантехнік, прораб, ремонт...)"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
            <input
              type="text"
              name="city"
              defaultValue={city}
              placeholder="Місто"
              className="md:w-48 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
            <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-semibold">
              Знайти
            </button>
          </form>
          {q && (
            <div className="mt-3 text-sm text-blue-100">
              💡 Розумний пошук: знаходимо схожі послуги та споріднені категорії
            </div>
          )}
        </div>
      </div>

      {/* Services Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {q ? `Результати пошуку "${q}"` : 'Доступні послуги та заявки'} ({services.length})
          </h2>
        </div>

        {services.length === 0 && Object.keys(requestsByType).length === 0 ? (
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
          <>
            {/* Requests subsections */}
            {Object.keys(requestsByType).length > 0 && (
              <div className="mb-8 w-full">
                <h3 className="text-xl font-bold mb-4">Запити від користувачів</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(requestsByType).map(([type, items]: any) => (
                    <div key={type} className="col-span-1">
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h4 className="font-semibold text-gray-800 mb-2">{type === 'job' ? 'Робота' : type}</h4>
                        <ul className="space-y-2">
                          {items.slice(0,5).map((r: any) => (
                            <li key={r.id} className="text-sm">
                              <Link href={`/requests/${r.id}`} className="text-blue-600 hover:underline">{r.title}</Link>
                              <div className="text-xs text-gray-500">{r.user.firstName} {r.user.lastName} — {r.city || 'не вказано'}</div>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-3">
                          <Link href={`/services?q=${type}`} className="text-sm text-blue-600">Показати всі</Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service: any) => (
                <div key={`${service.kind || 'service'}-${service.id}`} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden group">
                  {/* Изображение услуги / заявки */}
                  <Link href={service.kind === 'request' ? `/requests/${service.id}` : `/services/${service.id}`} className="block">
                    <ServiceImage
                      src={service.imageUrl}
                      alt={service.title}
                      fallbackLetter={service.title?.slice(0,1) || (service.kind === 'request' ? 'R' : 'S')}
                      className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-200 rounded-none"
                    />
                  </Link>

                <div className="p-6">
                  {/* Category */}
                    <div className="text-sm text-blue-600 mb-2 font-semibold">
                      {service.kind === 'request' ? (service.requestType ? service.requestType : 'Запит') : (service.category?.name || 'Інше')}
                    </div>

                  {/* Title */}
                    <Link href={service.kind === 'request' ? `/requests/${service.id}` : `/services/${service.id}`}>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition cursor-pointer">
                      {service.title}
                    </h3>
                  </Link>

                  {/* Description */}
                  {service.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {service.description}
                    </p>
                  )}

                  {/* Price */}
                  <div className="text-lg font-semibold text-gray-900 mb-4">
                    {service.kind === 'request' ? (
                      service.priceFrom ? `${service.priceFrom} ${service.priceUnit || 'уцмок'}` : 'За домовленістю'
                    ) : (
                      service.priceFrom && service.priceTo
                        ? `${service.priceFrom}-${service.priceTo} ${service.priceUnit || 'грн'}`
                        : service.priceFrom
                        ? `від ${service.priceFrom} ${service.priceUnit || 'грн'}`
                        : service.priceTo
                        ? `до ${service.priceTo} ${service.priceUnit || 'грн'}`
                        : 'За домовленістю'
                    )}
                  </div>

                  {/* Provider */}
                  <div className="border-t pt-4">
                    <Link href={`/profile/${service.user.id}`} className="block">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <UserAvatar 
                            src={service.user.avatarUrl}
                            alt={service.user.firstName}
                            className="w-10 h-10 rounded-full object-cover"
                            fallbackName={`${service.user.firstName} ${service.user.lastName}`}
                          />
                          <div>
                            <p className="font-semibold text-gray-900 text-sm hover:text-blue-600 transition">
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
                    </Link>
                  </div>

                  {/* View Button */}
                  <div className="mt-4">
                    <Link href={service.kind === 'request' ? `/requests/${service.id}` : `/services/${service.id}`} className="block">
                      <div className="flex items-center justify-center text-blue-600 hover:text-blue-700 text-sm font-semibold py-2 px-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                        Детальніше
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
              ))}
            </div>
          </>
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
