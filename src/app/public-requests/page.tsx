'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, MapPin, Calendar, DollarSign, TrendingUp, Clock } from 'lucide-react';

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
  const [requests, setRequests] = useState<PublicRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<PublicRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchQuery, selectedCategory, selectedCity]);

  const loadRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }

      const response = await fetch('/api/public-requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Публічні заявки</h1>
          <p className="text-gray-600">Знайдіть замовлення та запропонуйте свої послуги</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Пошук заявок..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Всі категорії</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* City Filter */}
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Всі міста</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Create Request Button */}
        <div className="mb-6">
          <Link
            href="/public-requests/create"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
          >
            <span>+</span>
            <span>Створити публічну заявку (5 UCM)</span>
          </Link>
        </div>

        {/* Promoted Requests */}
        {promotedRequests.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
              <h2 className="text-2xl font-bold text-gray-900">ТОП заявки</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {promotedRequests.map(request => (
                <RequestCard key={request.id} request={request} isPromoted={true} />
              ))}
            </div>
          </div>
        )}

        {/* Regular Requests */}
        {regularRequests.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Всі заявки</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularRequests.map(request => (
                <RequestCard key={request.id} request={request} isPromoted={false} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredRequests.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Заявки не знайдено</p>
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
      <div className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-6 cursor-pointer h-full ${isPromoted ? 'border-2 border-yellow-400 ring-2 ring-yellow-200' : ''}`}>
        {isPromoted && (
          <div className="flex items-center gap-2 mb-3 text-yellow-600">
            <TrendingUp className="w-5 h-5" />
            <span className="font-semibold text-sm">ТОП</span>
          </div>
        )}

        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{request.title}</h3>
        <p className="text-gray-600 mb-4 line-clamp-3">{request.description}</p>

        <div className="space-y-2 mb-4">
          {request.category && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">{request.category}</span>
            </div>
          )}

          {request.city && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{request.city}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <DollarSign className="w-4 h-4" />
            <span>{formatBudget()}</span>
          </div>

          {request.desiredDate && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{new Date(request.desiredDate).toLocaleDateString('uk-UA')}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
          {request.client.avatarUrl ? (
            <img
              src={request.client.avatarUrl}
              alt={`${request.client.firstName} ${request.client.lastName}`}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
              {request.client.firstName[0]}{request.client.lastName[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {request.client.firstName} {request.client.lastName}
            </p>
            {request.client.city && (
              <p className="text-xs text-gray-500 truncate">{request.client.city}</p>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{new Date(request.createdAt).toLocaleDateString('uk-UA')}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
