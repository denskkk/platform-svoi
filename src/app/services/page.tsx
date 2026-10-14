/**
 * Сторінка каталогу послуг
 * ДОСТУП ТІЛЬКИ ДЛЯ ЗАРЕЄСТРОВАНИХ КОРИСТУВАЧІВ
 */

import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Search, MapPin, Star, ArrowRight } from 'lucide-react';
import { formatRating } from '@/lib/format';
import { prisma } from '@/lib/prisma';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { ServiceImage } from '@/components/ui/ServiceImage';
import { expandSearchQuery, detectCategoryFromQuery, calculateRelevance } from '@/lib/searchKeywords';
import { verifyToken } from '@/lib/auth';

// Позначаємо сторінку як динамічну
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const REQUEST_TYPE_LABELS: Record<string, string> = {
  partner: 'пару',
  job: 'роботу',
  service: 'послугу',
  employee: 'співробітника',
  investor: 'інвестора',
  other: 'те, що ви шукаєте',
};

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
      console.log('[Services Page] Filtering by category slug:', category);
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

    console.log('[Services Page] Found services:', services.length);
    if (category && services.length > 0) {
      console.log('[Services Page] Sample service category:', services[0]?.category);
    }

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

      // Map requests to a unified shape so they can be rendered similarly to services

      const mappedRequests = requests.map((r: any) => ({
        id: r.id,
        kind: 'request',
        requestType: r.type,
        title: r.title,
        description: r.description,
        imageUrl: r.metadata && r.metadata.imageUrl ? r.metadata.imageUrl : null,
        category: null,
        // Показуємо бюджет, який вказав автор
        priceFrom: r.budgetFrom ?? null,
        priceTo: null,
        priceUnit: r.budgetFrom ? 'грн' : undefined,
        city: r.city,
        createdAt: r.createdAt,
        user: r.user,
      }));

      // Return services and requests separately so we can render distinct sections
      const servicesOnly = services.map((s: any) => ({ ...s, kind: 'service' }));
      return { services: servicesOnly, requests: mappedRequests };
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

      return { services: sorted, requests: [] };
    }

    return { services, requests: [] };
  } catch (error) {
    console.error('Error loading services:', error);
    return { services: [], requests: [] };
  }
}

export default async function ServicesPage({ 
  searchParams 
}: { 
  searchParams?: { q?: string; city?: string; category?: string } 
}) {
  // Перевірка авторизації - тільки зареєстровані користувачі можуть переглядати послуги
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;
  
  if (!token) {
    redirect('/auth/login?redirect=/services');
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    redirect('/auth/login?redirect=/services');
  }

  const q = searchParams?.q;
  const city = searchParams?.city;
  const category = searchParams?.category;
  const { services, requests } = await getServices(q, city, category) as any;
  const totalCount = (services?.length || 0) + (requests?.length || 0);

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
        {category && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              Фільтр по категорії: <strong>{category}</strong> 
              {services.length === 0 && ' (послуг не знайдено)'}
            </p>
          </div>
        )}
        
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {q ? `Результати пошуку "${q}"` : 'Доступні послуги та заявки'} ({totalCount})
          </h2>
        </div>

        {services.length === 0 && (!requests || requests.length === 0) ? (
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
            {/* Requests section (distinct from services) */}
            {requests && requests.length > 0 && (
              <div className="mb-8 w-full">
                <h3 className="text-xl font-bold mb-4">Запити від користувачів</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {requests.map((r: any) => (
                    <div key={`request-${r.id}`} className="col-span-1">
                      <div className="bg-yellow-50 border border-yellow-100 p-0 rounded-lg shadow-sm overflow-hidden">
                        <Link href={`/requests/${r.id}`} className="block">
                          <div className="h-44 w-full bg-gray-100 flex items-center justify-center text-gray-400 text-3xl font-bold">{r.title?.slice(0,1) || 'R'}</div>
                        </Link>
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-yellow-800 font-semibold">{REQUEST_TYPE_LABELS[r.requestType] ? `Шукає ${REQUEST_TYPE_LABELS[r.requestType]}` : 'Запит'}</div>
                          </div>
                          <Link href={`/requests/${r.id}`} className="block">
                            <h4 className="font-bold text-neutral-900 mb-2 hover:text-primary-600">{r.title}</h4>
                          </Link>
                          <div className="text-sm text-neutral-600 mb-3 line-clamp-2">{r.description}</div>
                          {/* For request cards we do not show how much the creator "spent" — price is visible in details */}
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

                        {/* Badge for requests to make them visually distinct */}
                        {service.kind === 'request' && (
                          <div className="absolute top-3 left-3 px-2 py-1 bg-yellow-50 text-yellow-800 text-xs font-semibold rounded-md">
                            Запит
                          </div>
                        )}

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
                      service.priceFrom ? `${service.priceFrom} ${service.priceUnit || 'грн'}` : 'За домовленістю'
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
                              {formatRating(service.user.avgRating, 1)}
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

        {/* Empty state */}
        {services.length === 0 && (
          <div className="mt-12">
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
              <div className="mb-6 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full animate-pulse opacity-50" />
                </div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <Search className="w-10 h-10 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Послуги не знайдені</h3>
              <p className="text-gray-600 max-w-md mb-8 leading-relaxed">
                Спробуйте змінити параметри пошуку або перегляньте всі категорії послуг
              </p>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 btn-glow"
              >
                Переглянути всі послуги
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
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
