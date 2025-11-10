'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Phone, Mail, MessageCircle, User, Edit, Trash2, Star } from 'lucide-react';

interface Service {
  id: number;
  title: string;
  description: string;
  imageUrl: string | null;
  priceFrom: number | null;
  priceTo: number | null;
  priceUnit: string;
  city: string;
  region: string | null;
  address: string | null;
  createdAt: string;
  category: {
    id: number;
    name: string;
  } | null;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    avatarUrl: string | null;
    city: string | null;
    region: string | null;
    bio: string | null;
    avgRating: number | null;
    totalReviews: number;
    isVerified: boolean;
  };
}

export default function ServiceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    // Получить текущего пользователя
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }

    loadService();
  }, [params.id]);

  const loadService = async () => {
    try {
      const response = await fetch(`/api/services/${params.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Помилка завантаження послуги');
      }

      setService(data.service);
    } catch (err: any) {
      setError(err.message || 'Помилка завантаження послуги');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUser) return;

    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/services/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Помилка видалення');
      }

      // Перенаправить на профиль
      router.push(`/profile/${currentUser.id}`);
    } catch (err: any) {
      alert(err.message || 'Помилка видалення послуги');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-neutral-600">Завантаження...</div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Послугу не знайдено'}</p>
          <Link href="/services" className="text-primary-600 hover:text-primary-700">
            До каталогу послуг
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = currentUser && currentUser.id === service.user.id;

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Кнопка назад */}
        <Link
          href="/services"
          className="inline-flex items-center text-neutral-600 hover:text-neutral-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          До каталогу послуг
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Основна інформація */}
          <div className="lg:col-span-2 space-y-6">
            {/* Зображення послуги */}
            {service.imageUrl && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <img
                  src={`${service.imageUrl}${service.imageUrl.includes('?') ? '&' : '?'}t=${Date.now()}`}
                  alt={service.title}
                  className="w-full h-96 object-cover"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    if (!img.dataset.retried) {
                      img.dataset.retried = 'true';
                      img.src = service.imageUrl!;
                    } else {
                      img.style.display = 'none';
                    }
                  }}
                />
              </div>
            )}

            {/* Деталі послуги */}
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
              {/* Заголовок і категорія */}
              <div className="mb-6">
                {service.category && (
                  <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-3">
                    {service.category.name}
                  </span>
                )}
                <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
                  {service.title}
                </h1>
                {/* Ціна */}
                {(service.priceFrom || service.priceTo) && (
                  <div className="text-2xl font-bold text-primary-600">
                    {service.priceFrom && service.priceTo ? (
                      `${service.priceFrom} - ${service.priceTo} ${service.priceUnit}`
                    ) : service.priceFrom ? (
                      `від ${service.priceFrom} ${service.priceUnit}`
                    ) : (
                      `до ${service.priceTo} ${service.priceUnit}`
                    )}
                  </div>
                )}
              </div>

              {/* Опис */}
              {service.description && (
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-neutral-900 mb-3">Опис послуги</h2>
                  <p className="text-neutral-700 leading-relaxed whitespace-pre-line">
                    {service.description}
                  </p>
                </div>
              )}

              {/* Локація */}
              <div className="border-t border-neutral-200 pt-6">
                <h2 className="text-xl font-bold text-neutral-900 mb-3">Локація</h2>
                <div className="space-y-2">
                  <div className="flex items-center text-neutral-700">
                    <MapPin className="w-5 h-5 mr-2 text-primary-500" />
                    <span>{service.city}{service.region && `, ${service.region}`}</span>
                  </div>
                  {service.address && (
                    <div className="ml-7 text-neutral-600">{service.address}</div>
                  )}
                </div>
              </div>

              {/* Дата публікації */}
              <div className="mt-6 text-sm text-neutral-500">
                Опубліковано: {new Date(service.createdAt).toLocaleDateString('uk-UA', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>

              {/* Кнопки дій для власника */}
              {isOwner && (
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={`/services/${service.id}/edit`}
                    className="flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Редагувати
                  </Link>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Видалити
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Бічна панель - інфо про виконавця */}
          <div className="space-y-6 static">
            {/* Картка виконавця */}
            <div className="bg-white rounded-2xl shadow-lg p-6 static">
              <h3 className="text-xl font-bold text-neutral-900 mb-4">Виконавець</h3>
              
              {/* Аватар і ім'я */}
              <Link href={`/profile/${service.user.id}`} className="block mb-4">
                <div className="flex items-center space-x-3">
                  {service.user.avatarUrl ? (
                    <img
                      src={`${service.user.avatarUrl}${service.user.avatarUrl.includes('?') ? '&' : '?'}t=${Date.now()}`}
                      alt={`${service.user.firstName} ${service.user.lastName}`}
                      className="w-16 h-16 rounded-full object-cover"
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        if (!img.dataset.retried) {
                          img.dataset.retried = 'true';
                          img.src = service.user.avatarUrl!;
                        } else {
                          img.style.display = 'none';
                          const parent = img.parentElement;
                          if (parent) {
                            const fallback = document.createElement('div');
                            fallback.className = 'w-16 h-16 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full flex items-center justify-center text-xl font-bold text-white';
                            fallback.textContent = `${service.user.firstName[0]}${service.user.lastName[0]}`;
                            parent.appendChild(fallback);
                          }
                        }
                      }}
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full flex items-center justify-center text-xl font-bold text-white">
                      {service.user.firstName[0]}{service.user.lastName[0]}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center">
                      <p className="font-bold text-neutral-900">
                        {service.user.firstName} {service.user.lastName}
                      </p>
                      {service.user.isVerified && (
                        <span className="ml-2 text-primary-500" title="Верифікований">✓</span>
                      )}
                    </div>
                    {service.user.city && (
                      <p className="text-sm text-neutral-600 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {service.user.city}
                      </p>
                    )}
                  </div>
                </div>
              </Link>

              {/* Рейтинг */}
              {service.user.totalReviews > 0 && (
                <div className="mb-4 p-3 bg-neutral-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Star className="w-5 h-5 text-amber-400 fill-current mr-1" />
                      <span className="font-bold text-neutral-900">
                        {service.user.avgRating?.toFixed(1) || '0.0'}
                      </span>
                    </div>
                    <span className="text-sm text-neutral-600">
                      {service.user.totalReviews} відгук{service.user.totalReviews === 1 ? '' : service.user.totalReviews < 5 ? 'и' : 'ів'}
                    </span>
                  </div>
                </div>
              )}

              {/* Про виконавця */}
              {service.user.bio && (
                <div className="mb-4">
                  <p className="text-sm text-neutral-700 line-clamp-3">{service.user.bio}</p>
                </div>
              )}

              {/* Контакти */}
              {!isOwner && (
                <div className="space-y-3">
                  {service.user.phone && (
                    <a
                      href={`tel:${service.user.phone}`}
                      className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <Phone className="w-5 h-5" />
                      <span>Подзвонити</span>
                    </a>
                  )}
                  
                  <Link
                    href={`/messages?with=${service.user.id}`}
                    className="flex items-center justify-center gap-2 w-full border-2 border-primary-500 text-primary-600 hover:bg-primary-50 font-semibold py-3 px-4 rounded-lg transition-all duration-200"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Написати</span>
                  </Link>

                  <Link
                    href={`/profile/${service.user.id}`}
                    className="flex items-center justify-center gap-2 w-full border-2 border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-semibold py-3 px-4 rounded-lg transition-all duration-200"
                  >
                    <User className="w-5 h-5" />
                    <span>Профіль</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно подтверждения удаления */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-neutral-900 mb-4">
              Видалити послугу?
            </h3>
            <p className="text-neutral-600 mb-6">
              Ви впевнені, що хочете видалити цю послугу? Цю дію не можна скасувати.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 border-2 border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
              >
                Скасувати
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting ? 'Видалення...' : 'Видалити'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
