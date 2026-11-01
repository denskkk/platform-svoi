'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { checkAuth as checkSession } from '@/lib/silentFetch';
import { useI18n } from '@/i18n/client';
import { translateServiceRequestStatus, translateCategory } from '@/lib/translations';
import { getCityName } from '@/lib/constants';

interface ServiceRequest {
  id: number;
  title: string;
  description: string;
  category: string | null;
  city: string | null;
  budgetFrom: number | null;
  budgetTo: number | null;
  status: string;
  createdAt: string;
  client: {
    id: number;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  executor: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
}

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

export default function ServiceRequestsPage() {
  const router = useRouter();
  const { t, locale, formatDate, formatNumber } = useI18n();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'tome' | 'my' | 'assigned' | 'all'>('tome');
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Перевірка авторизації
  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const checkAuth = async () => {
      const session = await checkSession();
      if (cancelled) return;
      if (session.status === 'guest') {
        router.push('/auth/login?redirect=/service-requests');
        return;
      }
      if (session.status === 'unavailable') {
        // Немає зв'язку з сервером — це не вихід із акаунта, пробуємо ще раз
        retryTimer = setTimeout(checkAuth, 3000);
        return;
      }
      setIsAuthorized(true);
    };

    checkAuth();
    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [router]);

  useEffect(() => {
    if (isAuthorized) {
      loadRequests();
    }
  }, [filter, isAuthorized]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('type', filter);
      
      const res = await fetch(`/api/service-requests?${params}`, {
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Failed to load service requests');

      const data = await res.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Показуємо лоадер під час перевірки авторизації
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('serviceRequests.common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Шапка */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('serviceRequests.list.title')}</h1>
            <p className="text-gray-600">{t('serviceRequests.list.subtitle')}</p>
          </div>
          <Link
            href="/service-requests/create"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
          >
            {t('serviceRequests.list.createButton')}
          </Link>
        </div>

        {/* Фільтри */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('tome')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'tome'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('serviceRequests.list.filters.tome')}
            </button>
            <button
              onClick={() => setFilter('assigned')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'assigned'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('serviceRequests.list.filters.assigned')}
            </button>
            <button
              onClick={() => setFilter('my')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'my'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('serviceRequests.list.filters.my')}
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('serviceRequests.list.filters.all')}
            </button>
          </div>
        </div>

        {/* Список заявок */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">{t('serviceRequests.common.loading')}</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-900             mb-2">{t('serviceRequests.list.emptyTitle')}</h3>
                        <p className="text-gray-600 mb-6">{t('serviceRequests.list.emptyDescription')}</p>
            <Link
              href="/service-requests/create"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
            >
              {t('serviceRequests.common.createRequest')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((request) => {
              return (
                <Link
                  key={request.id}
                  href={`/service-requests/${request.id}`}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition p-6 border border-gray-100 hover:border-blue-200"
                >
                  {/* Статус */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[request.status]}`}>
                      {translateServiceRequestStatus(request.status, locale)}
                    </span>
                    {request.category && (
                      <span className="text-sm text-gray-500">{translateCategory(request.category, locale)}</span>
                    )}
                  </div>

                  {/* Назва */}
                  <h3 className="font-bold text-lg mb-2 line-clamp-2 text-gray-900">
                    {request.title}
                  </h3>

                  {/* Опис */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {request.description}
                  </p>

                  {/* Інфо */}
                  <div className="space-y-2 text-sm text-gray-500">
                    {request.city && (
                      <div className="flex items-center gap-2">
                        <span>📍</span>
                        <span>{getCityName(request.city, locale)}</span>
                      </div>
                    )}
                    {(request.budgetFrom || request.budgetTo) && (
                      <div className="flex items-center gap-2">
                        <span>💰</span>
                        <span>
                          {request.budgetFrom && request.budgetTo
                            ? t('serviceRequests.budget.range', { from: formatNumber(request.budgetFrom), to: formatNumber(request.budgetTo) })
                            : request.budgetFrom
                            ? t('serviceRequests.budget.from', { amount: formatNumber(request.budgetFrom) })
                            : t('serviceRequests.budget.to', { amount: formatNumber(request.budgetTo ?? 0) })}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span>👤</span>
                      <span>{request.client.firstName} {request.client.lastName}</span>
                    </div>
                    {request.executor && (
                      <div className="flex items-center gap-2">
                        <span>🔨</span>
                        <span>{t('serviceRequests.list.executor', { name: request.executor.firstName })}</span>
                      </div>
                    )}
                  </div>

                  {/* Дата */}
                  <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
                    {formatDate(request.createdAt, {
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
