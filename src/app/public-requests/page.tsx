'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, MapPin, Calendar, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonGrid, RequestCardSkeleton } from '@/components/ui/SkeletonCard';

interface PublicRequest {
  id: number;
  title: string;
  description: string;
  category: string | null;
  city: string | null;
  budgetFrom: number | null;
  budgetTo: number | null;
  desiredDate: string | null;
  createdAt: string;
  isPromoted: boolean;
  promotedUntil: string | null;
  client: {
    id: number;
    firstName: string;
    lastName: string;
    city: string | null;
    avatarUrl: string | null;
  };
}

export default function PublicRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<PublicRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<PublicRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');

  useEffect(() => {
    // Перевірка авторизації
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login?returnUrl=/public-requests');
      return;
    }
    
    loadRequests();
    
    // Оновлювати список кожні 10 секунд для нових заявок
    const interval = setInterval(() => {
      loadRequests();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchQuery, selectedCategory, selectedCity]);

  const loadRequests = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch('/api/public-requests', {
        cache: 'no-store',
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      });

      if (!response.ok) {
        throw new Error('Помилка завантаження заявок');
      }

      const data = await response.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Помилка:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = [...requests];

    // Фільтр за пошуком
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(req =>
        req.title.toLowerCase().includes(query) ||
        req.description.toLowerCase().includes(query) ||
        req.category?.toLowerCase().includes(query)
      );
    }

    // Фільтр за категорією
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(req => req.category === selectedCategory);
    }

    // Фільтр за містом
    if (selectedCity !== 'all') {
      filtered = filtered.filter(req => req.city === selectedCity);
    }

    setFilteredRequests(filtered);
  };

  const categories = Array.from(new Set(requests.map(r => r.category).filter(Boolean))) as string[];
  const cities = Array.from(new Set(requests.map(r => r.city).filter(Boolean))) as string[];

  const promotedRequests = filteredRequests.filter(r => r.isPromoted && r.promotedUntil && new Date(r.promotedUntil) > new Date());
  const regularRequests = filteredRequests.filter(r => !r.isPromoted || !r.promotedUntil || new Date(r.promotedUntil) <= new Date());

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header skeleton */}
          <div className="mb-8 space-y-3 animate-fade-in">
            <div className="h-12 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-xl w-2/5 shimmer-effect"></div>
            <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg w-3/5"></div>
          </div>
          
          {/* Filters skeleton */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100 mb-8 animate-slide-up">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-14 bg-gradient-to-r from-gray-200 to-gray-100 rounded-xl shimmer-effect"></div>
              <div className="h-14 bg-gradient-to-r from-gray-200 to-gray-100 rounded-xl shimmer-effect"></div>
              <div className="h-14 bg-gradient-to-r from-gray-200 to-gray-100 rounded-xl shimmer-effect"></div>
            </div>
          </div>

          {/* Button skeleton */}
          <div className="mb-8 animate-slide-up">
            <div className="h-14 w-80 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-xl shimmer-effect"></div>
          </div>

          {/* Cards skeleton */}
          <SkeletonGrid count={6} type="request" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <div className="inline-block mb-4 px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full border border-blue-200">
            <p className="text-sm font-semibold text-blue-700">📋 Публічні замовлення</p>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
            Публічні заявки
          </h1>
          <p className="text-lg text-gray-600">Знайдіть замовлення та запропонуйте свої послуги</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border-2 border-blue-100 hover:border-blue-200 transition-all animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Пошук заявок..."
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-blue-300"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-blue-300 bg-white font-medium"
            >
              <option value="all">📂 Всі категорії</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* City Filter */}
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-blue-300 bg-white font-medium"
            >
              <option value="all">📍 Всі міста</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Create Request Button */}
        <div className="mb-8 animate-slide-up">
          <Link
            href="/public-requests/create"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 btn-glow"
          >
            <span className="text-2xl group-hover:rotate-90 transition-transform duration-300">+</span>
            <span>Створити публічну заявку (5 UCM)</span>
          </Link>
        </div>

        {/* Promoted Requests */}
        {promotedRequests.length > 0 && (
          <div className="mb-10 animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">🔥 ТОП заявки</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {promotedRequests.map((request, index) => (
                <div key={request.id} style={{ animationDelay: `${index * 100}ms` }} className="animate-scale-in">
                  <RequestCard request={request} isPromoted={true} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Regular Requests */}
        {regularRequests.length > 0 && (
          <div className="animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <span className="text-2xl">📋</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Всі заявки</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularRequests.map((request, index) => (
                <div key={request.id} style={{ animationDelay: `${index * 50}ms` }} className="animate-scale-in">
                  <RequestCard request={request} isPromoted={false} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredRequests.length === 0 && !loading && (
          <div className="text-center py-12">
            <EmptyState
              icon={Search}
              title="Заявки не знайдено"
              description="Спробуйте змінити параметри пошуку або створіть першу публічну заявку"
              actionLabel="Створити заявку"
              actionHref="/public-requests/create"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function RequestCard({ request, isPromoted }: { request: PublicRequest; isPromoted: boolean }) {
  const formatBudget = () => {
    if (request.budgetFrom && request.budgetTo) {
      return `${request.budgetFrom} - ${request.budgetTo} UCM`;
    }
    if (request.budgetFrom) {
      return `від ${request.budgetFrom} UCM`;
    }
    if (request.budgetTo) {
      return `до ${request.budgetTo} UCM`;
    }
    return 'Договірна';
  };

  return (
    <Link href={`/service-requests/${request.id}`}>
      <div className={`group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 cursor-pointer h-full transform hover:scale-105 ${
        isPromoted 
          ? 'border-4 border-yellow-400 ring-4 ring-yellow-100 bg-gradient-to-br from-yellow-50 to-orange-50' 
          : 'border-2 border-gray-100 hover:border-blue-300'
      }`}>
        {isPromoted && (
          <div className="flex items-center gap-2 mb-4 animate-pulse">
            <div className="px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-md">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-white" />
                <span className="font-bold text-sm text-white">ТОП</span>
              </div>
            </div>
          </div>
        )}

        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {request.title}
        </h3>
        <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">{request.description}</p>

        <div className="space-y-2 mb-6">
          {request.category && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg font-medium text-sm border border-blue-200">
              <span>📂</span>
              <span>{request.category}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2 text-sm text-gray-600">
            {request.city && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                <MapPin className="w-4 h-4 text-blue-500" />
                <span className="font-medium">{request.city}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="font-medium text-green-700">{formatBudget()}</span>
            </div>

            {request.desiredDate && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 rounded-lg border border-purple-200">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span className="font-medium text-purple-700">{new Date(request.desiredDate).toLocaleDateString('uk-UA')}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t-2 border-gray-100">
          {request.client.avatarUrl ? (
            <img
              src={request.client.avatarUrl}
              alt={`${request.client.firstName} ${request.client.lastName}`}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-100 shadow-md"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-blue-100 text-lg">
              {request.client.firstName[0]}{request.client.lastName[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">
              {request.client.firstName} {request.client.lastName}
            </p>
            {request.client.city && (
              <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {request.client.city}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
            <Clock className="w-3 h-3" />
            <span>{new Date(request.createdAt).toLocaleDateString('uk-UA')}</span>
          </div>
        </div>

        {/* Hover indicator */}
        <div className="mt-4 flex items-center justify-end gap-2 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-sm font-semibold">Переглянути деталі</span>
          <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
