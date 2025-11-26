'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Star, AlertCircle } from 'lucide-react';

export default function CreateReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get('requestId');
  const userId = searchParams.get('userId');

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [reviewedUser, setReviewedUser] = useState<any>(null);
  const [serviceRequest, setServiceRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    
    const user = JSON.parse(storedUser);
    setCurrentUser(user);

    loadData();
  }, [requestId, userId]);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Завантажити користувача для відгуку
      if (userId) {
        const userRes = await fetch(`/api/users/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include'
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          setReviewedUser(userData.user);
        }
      }

      // Завантажити заявку якщо є
      if (requestId) {
        const requestRes = await fetch(`/api/service-requests/${requestId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include'
        });
        if (requestRes.ok) {
          const requestData = await requestRes.json();
          setServiceRequest(requestData.request);
          
          // Визначити кому залишаємо відгук
          const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
          if (requestData.request.clientId === storedUser.id) {
            // Клієнт залишає відгук виконавцю
            setReviewedUser(requestData.request.executor);
          } else {
            // Виконавець залишає відгук клієнту
            setReviewedUser(requestData.request.client);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Помилка завантаження даних');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      router.push('/login');
      return;
    }

    if (rating === 0) {
      setError('Оберіть рейтинг');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const payload: any = {
        reviewedId: reviewedUser?.id || parseInt(userId || '0'),
        rating: rating,
        comment: comment
      };

      if (requestId) {
        payload.serviceRequestId = parseInt(requestId);
      }

      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Помилка створення відгуку');
      }

      // Перенаправити на профіль користувача
      router.push(`/profile/${reviewedUser?.id || userId}`);
    } catch (err: any) {
      setError(err.message || 'Помилка створення відгуку');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-neutral-600">Завантаження...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Кнопка назад */}
        <Link
          href={requestId ? `/service-requests/${requestId}` : `/profile/${userId}`}
          className="inline-flex items-center text-neutral-600 hover:text-neutral-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Назад
        </Link>

        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-6">
            Залишити відгук
          </h1>

          {serviceRequest && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Відгук про заявку: <strong>{serviceRequest.title}</strong>
              </p>
            </div>
          )}

          {reviewedUser && (
            <div className="mb-6 p-4 bg-neutral-50 rounded-lg">
              <p className="text-sm text-neutral-600 mb-2">Відгук для:</p>
              <div className="flex items-center gap-3">
                {reviewedUser.avatarUrl && (
                  <img
                    src={reviewedUser.avatarUrl}
                    alt={reviewedUser.firstName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="font-medium text-neutral-900">
                    {reviewedUser.firstName} {reviewedUser.lastName}
                  </p>
                  {reviewedUser.avgRating && (
                    <div className="flex items-center gap-1 text-sm text-neutral-600">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span>{reviewedUser.avgRating.toFixed(1)}</span>
                      <span className="text-neutral-400">({reviewedUser.totalReviews} відгуків)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Рейтинг */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                Рейтинг <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= (hoverRating || rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-neutral-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="mt-2 text-sm text-neutral-600">
                  {rating === 1 && 'Погано'}
                  {rating === 2 && 'Нижче середнього'}
                  {rating === 3 && 'Середньо'}
                  {rating === 4 && 'Добре'}
                  {rating === 5 && 'Відмінно'}
                </p>
              )}
            </div>

            {/* Коментар */}
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-neutral-700 mb-2">
                Коментар (необов'язково)
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={5}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                placeholder="Розкажіть про свій досвід співпраці..."
              />
              <p className="mt-1 text-sm text-neutral-500">
                {comment.length} / 1000 символів
              </p>
            </div>

            {/* Кнопки */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting || rating === 0}
                className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Надсилання...' : 'Надіслати відгук'}
              </button>
              <Link
                href={requestId ? `/service-requests/${requestId}` : `/profile/${userId}`}
                className="px-6 py-3 border-2 border-neutral-300 text-neutral-700 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
              >
                Скасувати
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
