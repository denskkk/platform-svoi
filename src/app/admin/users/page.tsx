'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, Filter, ChevronLeft, ChevronRight, Mail, Phone, MapPin, DollarSign, MessageSquare, Briefcase } from 'lucide-react';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(storedUser);
    if (!user.isAdmin) {
      router.push('/');
      return;
    }

    loadUsers();
  }, [page, sortBy, order, router]);

  const loadUsers = async () => {
    setLoading(true);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search,
        sortBy,
        order
      });

      const response = await fetch(`/api/admin/users?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Помилка завантаження користувачів');
      }

      const data = await response.json();
      setUsers(data.users);
      setTotalPages(data.pagination.totalPages);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadUsers();
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <Link
          href="/admin"
          className="inline-flex items-center text-neutral-600 hover:text-neutral-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Назад до адмін-панелі
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Користувачі платформи
          </h1>
          <p className="text-neutral-600">
            Детальна інформація про кожного користувача
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Пошук по імені, email, місту..."
                className="w-full pl-10 pr-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-primary-500 focus:outline-none"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
            >
              Шукати
            </button>
          </div>

          <div className="mt-4 flex gap-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border-2 border-neutral-200 rounded-lg focus:border-primary-500 focus:outline-none"
            >
              <option value="createdAt">Дата реєстрації</option>
              <option value="balanceUcm">Баланс УЦМ</option>
              <option value="firstName">Ім'я</option>
              <option value="city">Місто</option>
            </select>

            <select
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              className="px-4 py-2 border-2 border-neutral-200 rounded-lg focus:border-primary-500 focus:outline-none"
            >
              <option value="desc">За спаданням</option>
              <option value="asc">За зростанням</option>
            </select>
          </div>
        </div>

        {/* Users List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-neutral-600">Завантаження...</div>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {users.map((user) => (
                <div key={user.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* User Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-neutral-900">
                            {user.firstName} {user.lastName}
                            {user.isAdmin && (
                              <span className="ml-2 text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                                ADMIN
                              </span>
                            )}
                            {user.isVerified && (
                              <span className="ml-2 text-primary-500">✓</span>
                            )}
                          </h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-neutral-600">
                            <div className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              {user.email}
                            </div>
                            {user.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                {user.phone}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {user.city}
                            </div>
                          </div>
                        </div>
                        
                        <Link
                          href={`/profile/${user.id}`}
                          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
                        >
                          Профіль
                        </Link>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="p-3 bg-amber-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="w-4 h-4 text-amber-600" />
                            <span className="text-xs text-neutral-600">Баланс УЦМ</span>
                          </div>
                          <div className="font-bold text-amber-600">
                            {user.balanceUcm?.toLocaleString() || 0}
                          </div>
                        </div>

                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Briefcase className="w-4 h-4 text-green-600" />
                            <span className="text-xs text-neutral-600">Послуги</span>
                          </div>
                          <div className="font-bold text-green-600">
                            {user.stats?.servicesCount || 0}
                          </div>
                        </div>

                        <div className="p-3 bg-purple-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <MessageSquare className="w-4 h-4 text-purple-600" />
                            <span className="text-xs text-neutral-600">Повідомлень</span>
                          </div>
                          <div className="font-bold text-purple-600">
                            {user.stats?.messagesSent || 0}
                          </div>
                        </div>

                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="w-4 h-4 text-blue-600" />
                            <span className="text-xs text-neutral-600">Транзакцій</span>
                          </div>
                          <div className="font-bold text-blue-600">
                            {user.stats?.transactionsCount || 0}
                          </div>
                        </div>
                      </div>

                      {/* UCM Stats */}
                      <div className="flex gap-4 text-sm">
                        <div>
                          <span className="text-neutral-600">Відправлено УЦМ: </span>
                          <span className="font-bold text-red-600">
                            {user.stats?.ucmSent?.toLocaleString() || 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-600">Отримано УЦМ: </span>
                          <span className="font-bold text-green-600">
                            {user.stats?.ucmReceived?.toLocaleString() || 0}
                          </span>
                        </div>
                      </div>

                      {/* Recent Transactions */}
                      {user.stats?.recentTransactions?.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-neutral-200">
                          <div className="text-sm font-medium text-neutral-700 mb-2">
                            Останні транзакції:
                          </div>
                          <div className="space-y-1 text-xs">
                            {user.stats.recentTransactions.slice(0, 3).map((tx: any) => (
                              <div key={tx.id} className="flex justify-between text-neutral-600">
                                <span>{tx.reason}</span>
                                <span className={tx.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                                  {tx.amount > 0 ? '+' : ''}{tx.amount}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Dates */}
                      <div className="mt-4 text-xs text-neutral-500">
                        <div>Реєстрація: {new Date(user.createdAt).toLocaleDateString('uk-UA')}</div>
                        {user.lastLogin && (
                          <div>Останній вхід: {new Date(user.lastLogin).toLocaleDateString('uk-UA')}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border-2 border-neutral-200 hover:border-primary-500 disabled:opacity-50 disabled:hover:border-neutral-200"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <span className="px-4 py-2 text-neutral-700">
                  Сторінка {page} з {totalPages}
                </span>
                
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border-2 border-neutral-200 hover:border-primary-500 disabled:opacity-50 disabled:hover:border-neutral-200"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
