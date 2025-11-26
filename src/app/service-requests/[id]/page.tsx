'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RespondToRequestModal } from '@/components/requests/RespondToRequestModal';

const statusColors: Record<string, string> = {
  new: 'bg-yellow-100 text-yellow-800',
  viewed: 'bg-blue-100 text-blue-800',
  accepted: 'bg-purple-100 text-purple-800',
  in_progress: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  paid: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-gray-100 text-gray-800',
  rejected: 'bg-red-100 text-red-800'
};

const statusLabels: Record<string, string> = {
  new: 'Нова заявка',
  viewed: 'Переглянута',
  accepted: 'Прийнята в роботу',
  in_progress: 'Виконується',
  completed: 'Виконана',
  paid: 'Оплачена',
  cancelled: 'Скасована',
  rejected: 'Відхилена'
};

export default function ServiceRequestDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showRespondModal, setShowRespondModal] = useState(false);

  useEffect(() => {
    // Отримати ID поточного користувача
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUserId(user.id);
    }
    
    loadRequest();
  }, []);

  const loadRequest = async () => {
    try {
      const res = await fetch(`/api/service-requests/${params.id}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Помилка завантаження');
      const data = await res.json();
      setRequest(data.request);
    } catch (error: any) {
      alert(error.message);
      router.push('/service-requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, agreedPrice?: number) => {
    setActionLoading(true);
    try {
      const body: any = { action };
      if (agreedPrice) body.agreedPrice = agreedPrice;

      const res = await fetch(`/api/service-requests/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      await loadRequest();
      alert('Успішно оновлено!');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePay = async () => {
    if (!confirm(`Оплатити ${request.agreedPrice} УЦМ?`)) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(`/api/service-requests/${params.id}/pay`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      await loadRequest();
      alert('Оплачено успішно!');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!request) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Назад */}
        <Link href="/service-requests" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6">
          ← Назад до списку
        </Link>

        {/* Основна картка */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          {/* Заголовок */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium mb-4 ${statusColors[request.status]}`}>
                {statusLabels[request.status]}
              </span>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{request.title}</h1>
              {request.category && (
                <p className="text-gray-500">Категорія: {request.category}</p>
              )}
            </div>
          </div>

          {/* Опис */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Опис роботи</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{request.description}</p>
          </div>

          {/* Деталі */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {request.city && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Місто</p>
                <p className="font-medium">📍 {request.city}</p>
              </div>
            )}
            {request.address && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Адреса</p>
                <p className="font-medium">{request.address}</p>
              </div>
            )}
            {(request.budgetFrom || request.budgetTo) && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Бюджет</p>
                <p className="font-medium">
                  💰 {request.budgetFrom && request.budgetTo
                    ? `${request.budgetFrom}-${request.budgetTo} УЦМ`
                    : request.budgetFrom
                    ? `від ${request.budgetFrom} УЦМ`
                    : `до ${request.budgetTo} УЦМ`}
                </p>
              </div>
            )}
            {request.agreedPrice && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Узгоджена ціна</p>
                <p className="font-medium text-green-600">✓ {request.agreedPrice} УЦМ</p>
              </div>
            )}
          </div>

          {/* Клієнт */}
          <div className="border-t pt-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Клієнт</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                {request.client.firstName[0]}
              </div>
              <div>
                <p className="font-medium">{request.client.firstName} {request.client.lastName}</p>
                <p className="text-sm text-gray-500">{request.client.email}</p>
              </div>
            </div>
          </div>

          {/* Виконавець */}
          {request.executor && (
            <div className="border-t pt-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Виконавець</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
                  {request.executor.firstName[0]}
                </div>
                <div>
                  <p className="font-medium">{request.executor.firstName} {request.executor.lastName}</p>
                  {request.executor.profession && (
                    <p className="text-sm text-gray-500">{request.executor.profession}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Дії */}
          <div className="border-t pt-6">
            <div className="flex gap-3 flex-wrap">
              {/* Дії для ПУБЛІЧНОЇ ЗАЯВКИ - будь-який виконавець може відгукнутись */}
              {request.isPublic && !request.executor && currentUserId && currentUserId !== request.client?.id && (
                <button
                  onClick={() => setShowRespondModal(true)}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition"
                >
                  💰 Запропонувати свою ціну
                </button>
              )}

              {/* Дії для ВИКОНАВЦЯ */}
              {currentUserId === request.executor?.id && (
                <>
                  {(request.status === 'new' || request.status === 'viewed') && (
                    <button
                      onClick={() => {
                        const price = prompt('Введіть ціну в УЦМ:');
                        if (price) handleAction('accept', Number(price));
                      }}
                      disabled={actionLoading}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
                    >
                      ✓ Прийняти заявку
                    </button>
                  )}

                  {request.status === 'accepted' && (
                    <button
                      onClick={() => handleAction('start')}
                      disabled={actionLoading}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      🔨 Почати роботу
                    </button>
                  )}

                  {request.status === 'in_progress' && (
                    <button
                      onClick={() => handleAction('complete')}
                      disabled={actionLoading}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50"
                    >
                      ✓ Завершити роботу
                    </button>
                  )}
                </>
              )}

              {/* Дії для КЛІЄНТА */}
              {currentUserId === request.client?.id && (
                <>
                  {request.status === 'completed' && !request.isPaid && (
                    <button
                      onClick={handlePay}
                      disabled={actionLoading}
                      className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                      💳 Оплатити {request.agreedPrice} УЦМ
                    </button>
                  )}

                  {(request.status === 'new' || request.status === 'viewed') && (
                    <button
                      onClick={() => handleAction('cancel')}
                      disabled={actionLoading}
                      className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50"
                    >
                      ✕ Скасувати заявку
                    </button>
                  )}
                </>
              )}

              {/* Написати повідомлення */}
              {request.executor && currentUserId && (
                <Link
                  href={`/chat?with=${currentUserId === request.client?.id ? request.executor.id : request.client?.id}`}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition"
                >
                  💬 Написати {currentUserId === request.client?.id ? 'виконавцю' : 'клієнту'}
                </Link>
              )}

              {/* Відгук після оплати */}
              {request.status === 'paid' && (
                <Link
                  href={`/reviews/create?requestId=${request.id}&userId=${currentUserId === request.client?.id ? request.executor?.id : request.client?.id}`}
                  className="px-6 py-3 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition"
                >
                  ⭐ Залишити відгук
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Модальне вікно відгуку */}
      {showRespondModal && request && (
        <RespondToRequestModal
          requestId={request.id}
          requestTitle={request.title}
          onClose={() => setShowRespondModal(false)}
          onSuccess={() => loadRequest()}
        />
      )}
    </div>
  );
}
