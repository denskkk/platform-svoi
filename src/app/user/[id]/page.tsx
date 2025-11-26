/**
 * Публічний профіль користувача (для незалогінених глядачів)
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star, Mail, Phone, Facebook, Instagram, Linkedin, Globe, Send, ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/prisma';

async function getUserProfile(id: string) {
  try {
    const userId = parseInt(id);
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        city: true,
        avatarUrl: true,
        bio: true,
        role: true,
        avgRating: true,
        totalReviews: true,
        isVerified: true,
        createdAt: true,
        socialLinks: true,
      }
    });

    if (!user) return null;

    // Отримати бізнес інформацію якщо є
    const businessInfo = user.role === 'business' 
      ? await prisma.businessInfo.findUnique({
          where: { userId: user.id }
        })
      : null;

    // Отримати послуги
    const services = await prisma.service.findMany({
      where: { userId: user.id },
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true
      }
    });

    // Отримати відгуки
    const reviews = await prisma.review.findMany({
      where: { reviewedUserId: user.id },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true
          }
        }
      }
    });

    return { user, businessInfo, services, reviews };
  } catch (error) {
    console.error('Error loading profile:', error);
    return null;
  }
}

export default async function PublicProfilePage({ params }: { params: { id: string } }) {
  const data = await getUserProfile(params.id);

  if (!data) {
    notFound();
  }

  const { user, businessInfo, services, reviews } = data;
  const isBusiness = user.role === 'business';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Свій для Своїх
            </Link>
            <div className="flex gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
              >
                <ArrowLeft className="w-4 h-4" />
                Назад
              </Link>
              <Link
                href="/auth/login"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Увійти
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-gray-200 rounded-full overflow-hidden">
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={`${user.firstName} ${user.lastName}`}
                    width={128}
                    height={128}
                    unoptimized
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {user.firstName} {user.lastName}
                    {user.isVerified && (
                      <span className="ml-2 text-blue-600" title="Верифікований">✓</span>
                    )}
                  </h1>
                  {isBusiness && businessInfo && (
                    <p className="text-xl text-gray-600 mb-2">{businessInfo.businessName}</p>
                  )}
                  {user.city && (
                    <p className="flex items-center text-gray-600 mb-4">
                      <MapPin className="w-4 h-4 mr-1" />
                      {user.city}
                    </p>
                  )}
                </div>

                {/* Rating */}
                {user.totalReviews > 0 && (
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-2xl font-bold text-gray-900">
                      <Star className="w-6 h-6 text-yellow-400 fill-current" />
                      {user.avgRating.toFixed(1)}
                    </div>
                    <p className="text-sm text-gray-500">{user.totalReviews} відгуків</p>
                  </div>
                )}
              </div>

              {/* Bio */}
              {user.bio && (
                <p className="text-gray-700 mt-4 whitespace-pre-wrap">{user.bio}</p>
              )}

              {/* Business Description */}
              {isBusiness && businessInfo?.description && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Про бізнес:</h3>
                  <p className="text-gray-700">{businessInfo.description}</p>
                </div>
              )}

              {/* Contact Info */}
              <div className="flex flex-wrap gap-4 mt-6">
                {user.email && (
                  <a
                    href={`mailto:${user.email}`}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </a>
                )}
                {user.phone && (
                  <a
                    href={`tel:${user.phone}`}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <Phone className="w-4 h-4" />
                    Телефон
                  </a>
                )}
              </div>

              {/* Social Links */}
              {user.socialLinks && Object.keys(user.socialLinks as any).length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Соціальні мережі:</h3>
                  <div className="flex flex-wrap gap-3">
                    {(user.socialLinks as any).facebook && (
                      <a
                        href={(user.socialLinks as any).facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        <Facebook className="w-4 h-4" />
                        Facebook
                      </a>
                    )}
                    {(user.socialLinks as any).instagram && (
                      <a
                        href={(user.socialLinks as any).instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700"
                      >
                        <Instagram className="w-4 h-4" />
                        Instagram
                      </a>
                    )}
                    {(user.socialLinks as any).linkedin && (
                      <a
                        href={(user.socialLinks as any).linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800"
                      >
                        <Linkedin className="w-4 h-4" />
                        LinkedIn
                      </a>
                    )}
                    {(user.socialLinks as any).telegram && (
                      <a
                        href={(user.socialLinks as any).telegram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600"
                      >
                        <Send className="w-4 h-4" />
                        Telegram
                      </a>
                    )}
                    {(user.socialLinks as any).website && (
                      <a
                        href={(user.socialLinks as any).website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
                      >
                        <Globe className="w-4 h-4" />
                        Website
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Services */}
        {services.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Послуги</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service: any) => (
                <div key={service.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-sm text-blue-600 mb-2">{service.category?.name}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{service.title}</h3>
                  {service.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{service.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-semibold text-gray-900">
                      {service.priceFrom && service.priceTo
                        ? `${service.priceFrom}-${service.priceTo}`
                        : service.priceFrom || service.priceTo || 'За домовленістю'}{' '}
                      {service.priceFrom && service.priceUnit}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Відгуки</h2>
            <div className="space-y-4">
              {reviews.map((review: any) => (
                <div key={review.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                        {review.reviewer.avatarUrl ? (
                          <Image
                            src={review.reviewer.avatarUrl}
                            alt={review.reviewer.firstName}
                            width={48}
                            height={48}
                            unoptimized
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            {review.reviewer.firstName[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {review.reviewer.firstName} {review.reviewer.lastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString('uk-UA')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < review.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA для незалогінених */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Хочете залишити відгук?</h2>
          <p className="text-lg mb-6 text-blue-100">
            Увійдіть або зареєструйтесь, щоб оцінити послуги та залишити відгук
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/auth/login"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Увійти
            </Link>
            <Link
              href="/auth/register"
              className="bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition"
            >
              Зареєструватися
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
