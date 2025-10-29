'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Star, Plus, Edit, Mail, Phone, MessageCircle, Heart, Facebook, Instagram, Linkedin, Globe, Send } from 'lucide-react';

export default function ProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    // Получить текущего пользователя
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }

    // Загрузить профиль
    loadProfile();
  }, [params.id]);

  // Перезавантажити профіль при поверненні на сторінку
  useEffect(() => {
    const handleFocus = () => {
      loadProfile();
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [params.id]);

  const loadProfile = async () => {
    try {
      console.log('Завантаження профілю:', params.id);
      const response = await fetch(`/api/profile/${params.id}`);
      const data = await response.json();

      console.log('Отримано дані профілю:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Помилка завантаження профілю');
      }

      setProfile(data.user);
    } catch (err: any) {
      setError(err.message || 'Помилка завантаження профілю');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-neutral-600">Завантаження...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Профіль не знайдено'}</p>
          <Link href="/" className="text-primary-600 hover:text-primary-700">
            На головну
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser && currentUser.id === profile.id;

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Основна інформація */}
          <div className="lg:col-span-2 space-y-6">
            {/* Шапка профілю */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Фото */}
                {profile.avatarUrl ? (
                  <img 
                    src={profile.avatarUrl} 
                    alt={`${profile.firstName} ${profile.lastName}`}
                    className="w-32 h-32 rounded-2xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gradient-to-br from-primary-200 to-accent-200 rounded-2xl flex items-center justify-center text-6xl flex-shrink-0">
                    {profile.firstName?.[0]}{profile.lastName?.[0]}
                  </div>
                )}

                {/* Інфо */}
                <div className="flex-grow">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                    <div>
                      <h1 className="text-3xl font-bold text-neutral-900 mb-1">
                        {profile.firstName} {profile.lastName}
                        {profile.isVerified && (
                          <span className="ml-2 text-primary-500">✓</span>
                        )}
                      </h1>
                      <div className="flex items-center space-x-4 text-sm text-neutral-600 mt-2">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{profile.city}{profile.region && `, ${profile.region}`}</span>
                        </div>
                      </div>
                    </div>

                    {/* Дії */}
                    <div className="flex items-center space-x-2">
                      {isOwnProfile ? (
                        <Link
                          href="/profile/edit"
                          className="flex items-center px-4 py-2 border-2 border-primary-500 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Редагувати
                        </Link>
                      ) : (
                        <button
                          onClick={() => setIsFavorite(!isFavorite)}
                          className={`p-2 rounded-lg border-2 transition-colors ${
                            isFavorite
                              ? 'border-red-500 bg-red-50 text-red-500'
                              : 'border-neutral-300 hover:border-primary-500 text-neutral-600'
                          }`}
                          aria-label="Додати в обране"
                        >
                          <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Рейтинг */}
                  {profile.totalReviews > 0 && (
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${
                              i < Math.floor(Number(profile.avgRating))
                                ? 'text-amber-400 fill-current'
                                : 'text-neutral-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-semibold text-neutral-900">{Number(profile.avgRating).toFixed(1)}</span>
                      <span className="text-neutral-500">({profile.totalReviews} відгуків)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Бізнес-інформація (якщо є) */}
            {profile.businessInfo && (
              <div className="bg-gradient-to-br from-accent-50 to-primary-50 rounded-2xl shadow-md p-6 border-2 border-accent-200">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-accent-500 rounded-xl flex items-center justify-center">
                      <span className="text-white text-2xl">🏢</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-neutral-900">
                        {profile.businessInfo.companyName || 'Бізнес-профіль'}
                      </h2>
                      {profile.businessInfo.businessType && (
                        <p className="text-sm text-neutral-600">{profile.businessInfo.businessType}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Лого компанії */}
                  {profile.businessInfo.logoUrl && (
                    <img 
                      src={profile.businessInfo.logoUrl} 
                      alt={`${profile.businessInfo.companyName} logo`}
                      className="w-20 h-20 object-contain rounded-lg bg-white p-2 shadow-sm"
                    />
                  )}
                </div>

                {/* Представник */}
                {(profile.businessInfo.representativeName || profile.businessInfo.position) && (
                  <div className="mb-4 p-3 bg-white/50 rounded-lg">
                    <p className="text-sm text-neutral-600">Представник</p>
                    <p className="font-semibold text-neutral-900">
                      {profile.businessInfo.representativeName}
                      {profile.businessInfo.position && ` • ${profile.businessInfo.position}`}
                    </p>
                  </div>
                )}

                {/* Короткий опис */}
                {profile.businessInfo.description && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-neutral-900 mb-2">Про компанію</h3>
                    <p className="text-neutral-700 leading-relaxed">{profile.businessInfo.description}</p>
                  </div>
                )}

                {/* Місія */}
                {profile.businessInfo.mission && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-neutral-900 mb-2">Наша місія</h3>
                    <p className="text-neutral-700 leading-relaxed">{profile.businessInfo.mission}</p>
                  </div>
                )}

                {/* Унікальна цінність */}
                {profile.businessInfo.uniqueValue && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-neutral-900 mb-2">Чому обирають нас</h3>
                    <p className="text-neutral-700 leading-relaxed">{profile.businessInfo.uniqueValue}</p>
                  </div>
                )}

                {/* Послуги та товари */}
                {profile.businessInfo.servicesList && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-neutral-900 mb-2">Що ми пропонуємо</h3>
                    <p className="text-neutral-700 leading-relaxed whitespace-pre-line">{profile.businessInfo.servicesList}</p>
                  </div>
                )}

                {/* Ціновий діапазон та години роботи */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {profile.businessInfo.priceRange && (
                    <div className="p-3 bg-white/50 rounded-lg">
                      <p className="text-sm text-neutral-600 mb-1">Ціновий діапазон</p>
                      <p className="font-semibold text-accent-700">{profile.businessInfo.priceRange}</p>
                    </div>
                  )}
                  {profile.businessInfo.workHours && (
                    <div className="p-3 bg-white/50 rounded-lg">
                      <p className="text-sm text-neutral-600 mb-1">Години роботи</p>
                      <p className="font-semibold text-neutral-900">{profile.businessInfo.workHours}</p>
                    </div>
                  )}
                </div>

                {/* Команда */}
                {(profile.businessInfo.employeeCount || profile.businessInfo.keySpecialists || profile.businessInfo.teamDescription) && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-neutral-900 mb-2">Наша команда</h3>
                    {profile.businessInfo.employeeCount && (
                      <p className="text-sm text-neutral-600 mb-2">
                        Кількість працівників: <span className="font-medium">{profile.businessInfo.employeeCount}</span>
                      </p>
                    )}
                    {profile.businessInfo.keySpecialists && (
                      <p className="text-neutral-700 mb-2">{profile.businessInfo.keySpecialists}</p>
                    )}
                    {profile.businessInfo.teamDescription && (
                      <p className="text-neutral-700 leading-relaxed whitespace-pre-line">{profile.businessInfo.teamDescription}</p>
                    )}
                  </div>
                )}

                {/* Локація */}
                {(profile.businessInfo.serviceLocation || profile.businessInfo.address) && (
                  <div className="mb-4 p-3 bg-white/50 rounded-lg">
                    {profile.businessInfo.serviceLocation && (
                      <div className="mb-2">
                        <p className="text-sm text-neutral-600">Де надаємо послуги</p>
                        <p className="font-semibold text-neutral-900">{profile.businessInfo.serviceLocation}</p>
                      </div>
                    )}
                    {profile.businessInfo.address && (
                      <div>
                        <p className="text-sm text-neutral-600">Адреса</p>
                        <p className="font-semibold text-neutral-900">{profile.businessInfo.address}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Сертифікати */}
                {profile.businessInfo.certificatesInfo && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-neutral-900 mb-2">Сертифікати та ліцензії</h3>
                    <p className="text-neutral-700 leading-relaxed whitespace-pre-line">{profile.businessInfo.certificatesInfo}</p>
                  </div>
                )}

                {/* Партнери */}
                {profile.businessInfo.partners && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-neutral-900 mb-2">Наші партнери</h3>
                    <p className="text-neutral-700 leading-relaxed whitespace-pre-line">{profile.businessInfo.partners}</p>
                  </div>
                )}

                {/* Відгуки на інших платформах */}
                {(
                  profile.businessInfo.externalReviews?.google || 
                  profile.businessInfo.externalReviews?.facebook ||
                  (typeof profile.businessInfo.externalReviews === 'string' && profile.businessInfo.externalReviews)
                ) && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-neutral-900 mb-2">Відгуки на інших платформах</h3>
                    <div className="space-y-2">
                      {profile.businessInfo.externalReviews?.google && (
                        <a 
                          href={profile.businessInfo.externalReviews.google} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block text-blue-600 hover:text-blue-700 text-sm"
                        >
                          📍 Google Відгуки
                        </a>
                      )}
                      {profile.businessInfo.externalReviews?.facebook && (
                        <a 
                          href={profile.businessInfo.externalReviews.facebook} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block text-blue-600 hover:text-blue-700 text-sm"
                        >
                          👥 Facebook Відгуки
                        </a>
                      )}
                      {typeof profile.businessInfo.externalReviews === 'string' && profile.businessInfo.externalReviews && (
                        <a 
                          href={profile.businessInfo.externalReviews} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block text-blue-600 hover:text-blue-700 text-sm"
                        >
                          🔗 Зовнішні відгуки
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Відео */}
                {profile.businessInfo.videoUrl && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-neutral-900 mb-2">Відео про компанію</h3>
                    <div className="aspect-video rounded-lg overflow-hidden bg-neutral-100">
                      <iframe
                        src={profile.businessInfo.videoUrl}
                        className="w-full h-full"
                        allowFullScreen
                        title="Company video"
                      />
                    </div>
                  </div>
                )}

                {/* Контакти бізнесу */}
                {(profile.businessInfo.phone || profile.businessInfo.viber || profile.businessInfo.telegram || profile.businessInfo.email) && (
                  <div className="mb-4 p-3 bg-white/50 rounded-lg">
                    <h3 className="font-semibold text-neutral-900 mb-2">Контакти</h3>
                    <div className="space-y-2">
                      {profile.businessInfo.phone && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Phone className="w-4 h-4 text-accent-600" />
                          <span>{profile.businessInfo.phone}</span>
                          {profile.businessInfo.viber && <span className="text-accent-600">(Viber)</span>}
                        </div>
                      )}
                      {profile.businessInfo.telegram && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Send className="w-4 h-4 text-accent-600" />
                          <span>{profile.businessInfo.telegram}</span>
                        </div>
                      )}
                      {profile.businessInfo.email && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Mail className="w-4 h-4 text-accent-600" />
                          <span>{profile.businessInfo.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Додаткова інформація */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-4 border-t border-accent-200">
                  {profile.businessInfo.yearFounded && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-accent-600">{profile.businessInfo.yearFounded}</p>
                      <p className="text-xs text-neutral-600">Рік заснування</p>
                    </div>
                  )}
                  {profile.businessInfo.registrationType && (
                    <div className="text-center">
                      <p className="text-sm font-semibold text-neutral-900">{profile.businessInfo.registrationType}</p>
                      <p className="text-xs text-neutral-600">Тип реєстрації</p>
                    </div>
                  )}
                  {profile.businessInfo.hasCertificates && (
                    <div className="text-center">
                      <p className="text-2xl">✓</p>
                      <p className="text-xs text-neutral-600">Є сертифікати</p>
                    </div>
                  )}
                </div>

                {/* Соціальні мережі бізнесу */}
                {profile.businessInfo.socialLinks && Object.keys(profile.businessInfo.socialLinks).length > 0 && (
                  <div className="mt-6 pt-6 border-t border-accent-200">
                    <h3 className="font-semibold text-neutral-900 mb-3">Ми в соціальних мережах</h3>
                    <div className="flex flex-wrap gap-3">
                      {profile.businessInfo.socialLinks.facebook && (
                        <a
                          href={profile.businessInfo.socialLinks.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors text-sm"
                        >
                          <Facebook className="w-4 h-4 mr-2" />
                          Facebook
                        </a>
                      )}
                      {profile.businessInfo.socialLinks.instagram && (
                        <a
                          href={profile.businessInfo.socialLinks.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center px-3 py-2 bg-pink-50 hover:bg-pink-100 text-pink-600 rounded-lg transition-colors text-sm"
                        >
                          <Instagram className="w-4 h-4 mr-2" />
                          Instagram
                        </a>
                      )}
                      {profile.businessInfo.socialLinks.telegram && (
                        <a
                          href={profile.businessInfo.socialLinks.telegram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-600 rounded-lg transition-colors text-sm"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Telegram
                        </a>
                      )}
                      {profile.businessInfo.socialLinks.website && (
                        <a
                          href={profile.businessInfo.socialLinks.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center px-3 py-2 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 rounded-lg transition-colors text-sm"
                        >
                          <Globe className="w-4 h-4 mr-2" />
                          Веб-сайт
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Редагувати кнопка для власника */}
                {isOwnProfile && (
                  <div className="mt-4 pt-4 border-t border-accent-200">
                    <Link
                      href="/profile/edit-business"
                      className="inline-flex items-center px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Редагувати бізнес-профіль
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Про мене */}
            {profile.bio && (
              <div className="bg-white rounded-2xl shadow-md p-6">
                <h2 className="text-2xl font-bold text-neutral-900 mb-4">Про мене</h2>
                <p className="text-neutral-700 leading-relaxed whitespace-pre-line">{profile.bio}</p>
              </div>
            )}

            {/* Соціальні мережі */}
            {profile.socialLinks && Object.keys(profile.socialLinks).length > 0 && (
              <div className="bg-white rounded-2xl shadow-md p-6">
                <h2 className="text-2xl font-bold text-neutral-900 mb-4">Соціальні мережі</h2>
                <div className="flex flex-wrap gap-3">
                  {profile.socialLinks.facebook && (
                    <a
                      href={profile.socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                    >
                      <Facebook className="w-5 h-5 mr-2" />
                      Facebook
                    </a>
                  )}
                  {profile.socialLinks.instagram && (
                    <a
                      href={profile.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-4 py-2 bg-pink-50 hover:bg-pink-100 text-pink-600 rounded-lg transition-colors"
                    >
                      <Instagram className="w-5 h-5 mr-2" />
                      Instagram
                    </a>
                  )}
                  {profile.socialLinks.linkedin && (
                    <a
                      href={profile.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                    >
                      <Linkedin className="w-5 h-5 mr-2" />
                      LinkedIn
                    </a>
                  )}
                  {profile.socialLinks.telegram && (
                    <a
                      href={profile.socialLinks.telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-600 rounded-lg transition-colors"
                    >
                      <Send className="w-5 h-5 mr-2" />
                      Telegram
                    </a>
                  )}
                  {profile.socialLinks.website && (
                    <a
                      href={profile.socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-4 py-2 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 rounded-lg transition-colors"
                    >
                      <Globe className="w-5 h-5 mr-2" />
                      Веб-сайт
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Послуги */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-neutral-900">
                  Послуги {profile._count?.services > 0 && `(${profile._count.services})`}
                </h2>
                {isOwnProfile && (
                  <Link
                    href="/services/create"
                    className="flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Додати
                  </Link>
                )}
              </div>

              {profile.services && profile.services.length > 0 ? (
                <div className="space-y-4">
                  {profile.services.map((service: any) => (
                    <div key={service.id} className="border border-neutral-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row">
                        {/* Фото послуги */}
                        {service.imageUrl && (
                          <div className="w-full sm:w-48 h-48 sm:h-auto flex-shrink-0">
                            <img
                              src={service.imageUrl}
                              alt={service.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        
                        {/* Контент */}
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-lg text-neutral-900">{service.title}</h3>
                            {service.category && (
                              <span className="text-2xl flex-shrink-0 ml-2">{service.category.emoji}</span>
                            )}
                          </div>
                          {service.description && (
                            <p className="text-neutral-600 mb-3 line-clamp-2">{service.description}</p>
                          )}
                          <div className="flex items-center justify-between">
                            {(service.priceFrom || service.priceTo) && (
                              <div className="text-primary-600 font-medium">
                                {service.priceFrom && service.priceTo ? (
                                  `${service.priceFrom} - ${service.priceTo} ${service.priceUnit || 'грн'}`
                                ) : service.priceFrom ? (
                                  `від ${service.priceFrom} ${service.priceUnit || 'грн'}`
                                ) : (
                                  `до ${service.priceTo} ${service.priceUnit || 'грн'}`
                                )}
                              </div>
                            )}
                            <div className="flex items-center text-sm text-neutral-500">
                              <MapPin className="w-4 h-4 mr-1" />
                              {service.city}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-500">
                  {isOwnProfile ? (
                    <div>
                      <p className="mb-4">У вас ще немає послуг</p>
                      <Link
                        href="/services/create"
                        className="inline-flex items-center px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Створити першу послугу
                      </Link>
                    </div>
                  ) : (
                    <p>Цей користувач ще не додав послуг</p>
                  )}
                </div>
              )}
            </div>

            {/* Відгуки */}
            {profile.reviewsReceived && profile.reviewsReceived.length > 0 && (
              <div className="bg-white rounded-2xl shadow-md p-6">
                <h2 className="text-2xl font-bold text-neutral-900 mb-6">
                  Відгуки ({profile.reviewsReceived.length})
                </h2>
                <div className="space-y-4">
                  {profile.reviewsReceived.map((review: any) => (
                    <div key={review.id} className="border-b border-neutral-200 last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-neutral-900">
                            {review.reviewer.firstName} {review.reviewer.lastName?.[0]}.
                          </span>
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating ? 'text-amber-400 fill-current' : 'text-neutral-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-neutral-500">
                          {new Date(review.createdAt).toLocaleDateString('uk-UA')}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-neutral-700">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Бічна панель */}
          <div className="space-y-6">
            {/* Контакти */}
            <div className="bg-white rounded-2xl shadow-md p-6 sticky top-24">
              <h3 className="text-xl font-bold text-neutral-900 mb-4">Контакти</h3>
              
              <div className="space-y-3 mb-6">
                {profile.phone && (
                  <div className="flex items-center space-x-3 text-neutral-700">
                    <Phone className="w-5 h-5 text-primary-500" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                {profile.email && !isOwnProfile && (
                  <div className="flex items-center space-x-3 text-neutral-700">
                    <Mail className="w-5 h-5 text-primary-500" />
                    <span>{profile.email}</span>
                  </div>
                )}
              </div>

              {!isOwnProfile && (
                <>
                  <Link
                    href={`/messages?with=${profile.id}`}
                    className="block w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center mb-3"
                  >
                    💬 Написати
                  </Link>

                  {profile.phone && (
                    <a
                      href={`tel:${profile.phone}`}
                      className="block w-full border-2 border-primary-500 text-primary-600 hover:bg-primary-50 font-semibold py-3 px-4 rounded-lg transition-colors text-center"
                    >
                      📞 Подзвонити
                    </a>
                  )}
                </>
              )}
            </div>

            {/* Інформація */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-xl font-bold text-neutral-900 mb-4">Інформація</h3>
              <div className="space-y-3">
                {/* Вік та стать */}
                {profile.age && (
                  <div>
                    <p className="font-medium text-neutral-900">Вік</p>
                    <p className="text-sm text-neutral-600">{profile.age} років</p>
                  </div>
                )}
                {profile.gender && (
                  <div>
                    <p className="font-medium text-neutral-900">Стать</p>
                    <p className="text-sm text-neutral-600">
                      {profile.gender === 'male' ? 'Чоловік' : profile.gender === 'female' ? 'Жінка' : 'Інше'}
                    </p>
                  </div>
                )}

                {/* Сімейний стан */}
                {profile.maritalStatus && (
                  <div>
                    <p className="font-medium text-neutral-900">Сімейний стан</p>
                    <p className="text-sm text-neutral-600">
                      {profile.maritalStatus === 'single' ? 'Неодружений/Незаміжня' :
                       profile.maritalStatus === 'married' ? 'Одружений/Заміжня' :
                       profile.maritalStatus === 'divorced' ? 'Розлучений/Розлучена' :
                       profile.maritalStatus === 'widowed' ? 'Вдівець/Вдова' : profile.maritalStatus}
                    </p>
                  </div>
                )}

                {/* Склад сім'ї */}
                {profile.familyComposition && (
                  <div>
                    <p className="font-medium text-neutral-900">Склад сім&apos;ї</p>
                    <p className="text-sm text-neutral-600">{profile.familyComposition}</p>
                  </div>
                )}

                {/* Діти */}
                {profile.childrenCount !== null && profile.childrenCount !== undefined && (
                  <div>
                    <p className="font-medium text-neutral-900">Діти</p>
                    <p className="text-sm text-neutral-600">
                      {profile.childrenCount === 0 ? 'Немає дітей' : `${profile.childrenCount} ${profile.childrenCount === 1 ? 'дитина' : 'дітей'}`}
                    </p>
                  </div>
                )}

                {/* Професія */}
                {profile.profession && (
                  <div>
                    <p className="font-medium text-neutral-900">Професія</p>
                    <p className="text-sm text-neutral-600">{profile.profession}</p>
                  </div>
                )}

                {/* Статус зайнятості */}
                {profile.employmentStatus && (
                  <div>
                    <p className="font-medium text-neutral-900">Статус зайнятості</p>
                    <p className="text-sm text-neutral-600">
                      {profile.employmentStatus === 'employed' ? 'Працюю' :
                       profile.employmentStatus === 'self-employed' ? 'Самозайнятий' :
                       profile.employmentStatus === 'unemployed' ? 'Не працюю' :
                       profile.employmentStatus === 'student' ? 'Навчаюсь' :
                       profile.employmentStatus === 'retired' ? 'Пенсіонер' : profile.employmentStatus}
                    </p>
                  </div>
                )}

                {/* Місце роботи */}
                {profile.workplace && (
                  <div>
                    <p className="font-medium text-neutral-900">Місце роботи</p>
                    <p className="text-sm text-neutral-600">{profile.workplace}</p>
                  </div>
                )}

                {/* Освіта */}
                {profile.education && (
                  <div>
                    <p className="font-medium text-neutral-900">Освіта</p>
                    <p className="text-sm text-neutral-600">{profile.education}</p>
                  </div>
                )}

                {/* Тип житла */}
                {profile.housingType && (
                  <div>
                    <p className="font-medium text-neutral-900">Тип житла</p>
                    <p className="text-sm text-neutral-600">
                      {profile.housingType === 'apartment' ? 'Квартира' :
                       profile.housingType === 'house' ? 'Будинок' :
                       profile.housingType === 'dormitory' ? 'Гуртожиток' :
                       profile.housingType === 'rent' ? 'Оренда' : profile.housingType}
                    </p>
                  </div>
                )}

                {/* Ситуація з житлом */}
                {profile.livingSituation && (
                  <div>
                    <p className="font-medium text-neutral-900">Ситуація з житлом</p>
                    <p className="text-sm text-neutral-600">{profile.livingSituation}</p>
                  </div>
                )}

                {/* Транспорт */}
                {profile.hasCar !== null && (
                  <div>
                    <p className="font-medium text-neutral-900">Автомобіль</p>
                    <p className="text-sm text-neutral-600">
                      {profile.hasCar ? 'Є' : 'Немає'}
                    </p>
                  </div>
                )}

                {profile.carInfo && (
                  <div>
                    <p className="font-medium text-neutral-900">Інфо про авто</p>
                    <p className="text-sm text-neutral-600">{profile.carInfo}</p>
                  </div>
                )}

                {profile.otherTransport && (
                  <div>
                    <p className="font-medium text-neutral-900">Інший транспорт</p>
                    <p className="text-sm text-neutral-600">{profile.otherTransport}</p>
                  </div>
                )}

                {/* Домашні тварини */}
                {profile.hasPets !== null && (
                  <div>
                    <p className="font-medium text-neutral-900">Домашні тварини</p>
                    <p className="text-sm text-neutral-600">
                      {profile.hasPets ? 'Є' : 'Немає'}
                    </p>
                  </div>
                )}

                {profile.petsInfo && (
                  <div>
                    <p className="font-medium text-neutral-900">Інфо про тварин</p>
                    <p className="text-sm text-neutral-600">{profile.petsInfo}</p>
                  </div>
                )}

                {/* Хобі та інтереси */}
                {profile.hobbies && (
                  <div>
                    <p className="font-medium text-neutral-900">Хобі та інтереси</p>
                    <p className="text-sm text-neutral-600 whitespace-pre-line">{profile.hobbies}</p>
                  </div>
                )}

                {profile.outdoorActivities && (
                  <div>
                    <p className="font-medium text-neutral-900">Активний відпочинок</p>
                    <p className="text-sm text-neutral-600 whitespace-pre-line">{profile.outdoorActivities}</p>
                  </div>
                )}

                {profile.sports && (
                  <div>
                    <p className="font-medium text-neutral-900">Спорт</p>
                    <p className="text-sm text-neutral-600">{profile.sports}</p>
                  </div>
                )}

                {profile.lifestyle && (
                  <div>
                    <p className="font-medium text-neutral-900">Спосіб життя</p>
                    <p className="text-sm text-neutral-600">{profile.lifestyle}</p>
                  </div>
                )}

                {/* Пошук роботи */}
                {profile.jobSeeking && (
                  <div>
                    <p className="font-medium text-neutral-900">Пошук роботи</p>
                    <p className="text-sm text-neutral-600">{profile.jobSeeking}</p>
                  </div>
                )}

                {/* Приватний бізнес */}
                {profile.privateBusinessInfo && (
                  <div>
                    <p className="font-medium text-neutral-900">Приватний бізнес</p>
                    <p className="text-sm text-neutral-600 whitespace-pre-line">{profile.privateBusinessInfo}</p>
                  </div>
                )}

                {/* Дата реєстрації */}
                <div>
                  <p className="font-medium text-neutral-900">Зареєстрований</p>
                  <p className="text-sm text-neutral-600">
                    {new Date(profile.createdAt).toLocaleDateString('uk-UA')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
