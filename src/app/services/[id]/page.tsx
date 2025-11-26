'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Phone, Mail, MessageCircle, User, Edit, Trash2, Star, Gift } from 'lucide-react';
import { ServiceImage } from '@/components/ui/ServiceImage';
import { UserOrCompanyAvatar } from '@/components/ui/UserOrCompanyAvatar';
import { TransferUcmModal } from '@/components/ui/TransferUcmModal';
import { useToast } from '@/components/ui/Toast';

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
    businessInfo?: {
      companyName?: string | null;
      logoUrl?: string | null;
    } | null;
  };
}

export default function ServiceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();
  const [service, setService] = useState<Service | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hasActiveRequest, setHasActiveRequest] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  useEffect(() => {
    // Получить текущего пользователя
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }

    const loadService = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/services/${params.id}`, {
          headers,
          credentials: 'include',
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Помилка завантаження послуги');
        }

        setService(data.service);
        
        // Перевірити чи є активна заявка на цю послугу
        if (token) {
          checkActiveRequest(token);
        }
      } catch (err: any) {
        setError(err.message || 'Помилка завантаження послуги');
      } finally {
        setLoading(false);
      }
    };

    loadService();
  }, [params.id]);

  const checkActiveRequest = async (token: string) => {
    try {
      const response = await fetch(`/api/service-requests?type=my&serviceId=${params.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        // Тільки заявки, які ще в процесі (не завершені та не оплачені)
        const activeStatuses = ['new', 'viewed', 'accepted', 'in_progress'];
        const hasActive = data.requests?.some((req: any) => 
          activeStatuses.includes(req.status) && 
          req.serviceId && 
          req.serviceId === parseInt(params.id)
        );
        setHasActiveRequest(hasActive);
      }
    } catch (err) {
      console.error('Помилка перевірки заявок:', err);
    }
  };

  const loadService = async () => {
    try {
      const response = await fetch(`/api/services/${params.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Помилка завантаження послуги');
      }

      setService(data.service);
      // Після завантаження послуги - завантажити відгуки про виконавця
      if (data.service?.user?.id) {
        loadReviews(data.service.user.id);
      }
    } catch (err: any) {
      setError(err.message || 'Помилка завантаження послуги');
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async (userId: number) => {
    try {
      setLoadingReviews(true);
      const res = await fetch(`/api/reviews?userId=${userId}&limit=10`);
      if (!res.ok) return;
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (e) {
      console.error('Помилка завантаження відгуків', e);
    } finally {
      setLoadingReviews(false);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service?.user?.id || !currentUser) return;
    if (currentUser.id === service.user.id) {
      setReviewError('Не можна залишити відгук про себе');
      return;
    }
    if (reviewRating === 0) {
      setReviewError('Оберіть рейтинг');
      return;
    }
    setSubmittingReview(true);
    setReviewError('');
    setReviewSuccess('');
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const payload = {
        reviewedId: service.user.id,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined
      };
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Помилка надсилання відгуку');
      setReviewSuccess('Відгук додано!');
      setReviewComment('');
      setReviewRating(0);
      // Оновити відгуки та дані послуги (для рейтингу)
      loadReviews(service.user.id);
      loadService();
    } catch (err: any) {
      setReviewError(err.message || 'Помилка створення відгуку');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUser) return;

    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`/api/services/${params.id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Помилка видалення');
      }

      // Перенаправить на профиль
      router.push(`/profile/${currentUser.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Помилка видалення послуги');
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
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <ServiceImage
                src={service.imageUrl}
                alt={service.title}
                fallbackLetter={service.title?.slice(0,1) || 'S'}
                className="w-full h-96 object-cover"
              />
            </div>

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

            {/* Відгуки про виконавця */}
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4 flex items-center">
                <Star className="w-6 h-6 text-amber-400 fill-current mr-2" /> Відгуки про виконавця
              </h2>
              {/* Форма додавання відгуку */}
              {currentUser && service.user.id !== currentUser.id && (
                <form onSubmit={submitReview} className="mb-8 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Ваш рейтинг</label>
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star className={`w-8 h-8 ${star <= (hoverRating || reviewRating) ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="reviewComment" className="block text-sm font-medium text-neutral-700 mb-2">Коментар (необов'язково)</label>
                    <textarea
                      id="reviewComment"
                      value={reviewComment}
                      onChange={e => setReviewComment(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      placeholder="Опишіть ваш досвід співпраці..."
                    />
                  </div>
                  {reviewError && <p className="text-sm text-red-600">{reviewError}</p>}
                  {reviewSuccess && <p className="text-sm text-green-600">{reviewSuccess}</p>}
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={submittingReview || reviewRating===0}
                      className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {submittingReview ? 'Надсилання...' : 'Залишити відгук'}
                    </button>
                  </div>
                </form>
              )}

              {/* Список відгуків */}
              {loadingReviews ? (
                <div className="text-neutral-600">Завантаження відгуків...</div>
              ) : reviews.length === 0 ? (
                <p className="text-neutral-500">Відгуків ще немає.</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map(r => (
                    <div key={r.id} className="border border-neutral-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-amber-400 fill-current" />
                          <span className="font-medium">{r.rating}</span>
                        </div>
                        <span className="text-xs text-neutral-500">{new Date(r.createdAt).toLocaleDateString('uk-UA')}</span>
                      </div>
                      {r.comment && (
                        <p className="text-sm text-neutral-700 mb-2 whitespace-pre-line">{r.comment}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {r.reviewer?.avatarUrl ? (
                          <img src={r.reviewer.avatarUrl} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-semibold">
                            {r.reviewer?.firstName?.[0]}{r.reviewer?.lastName?.[0]}
                          </div>
                        )}
                        <Link href={`/profile/${r.reviewer?.id}`} className="text-sm text-neutral-800 hover:text-primary-600 font-medium">
                          {r.reviewer?.firstName} {r.reviewer?.lastName}
                        </Link>
                      </div>
                    </div>
                  ))}
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
                  <UserOrCompanyAvatar user={service.user as any} className="w-16 h-16 rounded-full object-cover" />
                  <div>
                    <div className="flex items-center">
                      <p className="font-bold text-neutral-900">
                        {service.user?.businessInfo?.companyName || `${service.user.firstName} ${service.user.lastName}`}
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
                    href={`/chat?with=${service.user.id}`}
                    className="flex items-center justify-center gap-2 w-full border-2 border-primary-500 text-primary-600 hover:bg-primary-50 font-semibold py-3 px-4 rounded-lg transition-all duration-200"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Написати</span>
                  </Link>

                  {hasActiveRequest ? (
                    <Link
                      href="/service-requests?type=my"
                      className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-gray-400 to-gray-500 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-md"
                    >
                      <Gift className="w-5 h-5" />
                      <span>Заявка подана</span>
                    </Link>
                  ) : (
                    <Link
                      href={`/requests/create?serviceId=${service.id}&executorId=${service.user.id}`}
                      className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <Gift className="w-5 h-5" />
                      <span>Подати заявку</span>
                    </Link>
                  )}

                  {currentUser && (
                    <TransferUcmModal
                      recipientId={service.user.id}
                      recipientName={service.user?.businessInfo?.companyName || `${service.user.firstName} ${service.user.lastName}`}
                      currentUserBalance={currentUser.balanceUcm || 0}
                      onSuccess={() => {
                        // Оновити баланс користувача
                        const storedUser = localStorage.getItem('user');
                        if (storedUser) {
                          const user = JSON.parse(storedUser);
                          setCurrentUser(user);
                        }
                      }}
                    />
                  )}

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
