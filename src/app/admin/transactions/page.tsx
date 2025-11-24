'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

export default function AdminTransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState('all');

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

    loadTransactions();
  }, [page, typeFilter, router]);

  const loadTransactions = async () => {
    setLoading(true);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        type: typeFilter
      });

      const response = await fetch(`/api/admin/transactions?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Помилка завантаження транзакцій');
      }

      const data = await response.json();
      setTransactions(data.transactions);
      setStats(data.stats);
      setTotalPages(data.pagination.totalPages);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionColor = (reason: string) => {
    const colors: any = {
      'transfer_sent': 'bg-red-50 text-red-700 border-red-200',
      'transfer_received': 'bg-green-50 text-green-700 border-green-200',
      'admin_grant': 'bg-blue-50 text-blue-700 border-blue-200',
      'registration_bonus': 'bg-purple-50 text-purple-700 border-purple-200',
      'service_payment': 'bg-amber-50 text-amber-700 border-amber-200'
    };
    return colors[reason] || 'bg-neutral-50 text-neutral-700 border-neutral-200';
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
            Транзакції УЦМ
          </h1>
          <p className="text-neutral-600">
            Повна історія всіх транзакцій на платформі
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm text-neutral-600">Сьогодні</span>
              </div>
              <div className="text-2xl font-bold text-neutral-900">
                {stats.byPeriod?.today || 0} транзакцій
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm text-neutral-600">Тиждень</span>
              </div>
              <div className="text-2xl font-bold text-neutral-900">
                {stats.byPeriod?.week || 0} транзакцій
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-sm text-neutral-600">Місяць</span>
              </div>
              <div className="text-2xl font-bold text-neutral-900">
                {stats.byPeriod?.month || 0} транзакцій
              </div>
            </div>
          </div>
        )}

        {/* Stats by Type */}
        {stats?.byType && stats.byType.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">
              Статистика по типах
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.byType.map((type: any) => (
                <div key={type.reason} className="p-4 bg-neutral-50 rounded-lg">
                  <div className="font-medium text-neutral-900 mb-2">{type.reason}</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Кількість:</span>
                      <span className="font-bold">{type._count.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Загальна сума:</span>
                      <span className="font-bold">{type._sum.amount?.toLocaleString() || 0} уцм</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Середня:</span>
                      <span className="font-bold">{type._avg.amount?.toFixed(2) || 0} уцм</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Biggest Transfers */}
        {stats?.biggestTransfers && stats.biggestTransfers.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">
              Найбільші перекази
            </h2>
            <div className="space-y-3">
              {stats.biggestTransfers.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <div className="font-medium text-neutral-900">
                      {tx.user.firstName} {tx.user.lastName}
                    </div>
                    <div className="text-sm text-neutral-600">
                      {tx.user.city} • {new Date(tx.createdAt).toLocaleDateString('uk-UA')}
                    </div>
                    {tx.description && (
                      <div className="text-xs text-neutral-500 mt-1">{tx.description}</div>
                    )}
                  </div>
                  <div className={`text-xl font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.amount > 0 ? '+' : ''}{Math.abs(tx.amount).toLocaleString()} уцм
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-neutral-600" />
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="flex-1 px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-primary-500 focus:outline-none"
            >
              <option value="all">Всі транзакції</option>
              <option value="transfer_sent">Відправлені перекази</option>
              <option value="transfer_received">Отримані перекази</option>
              <option value="admin_grant">Нарахування адміном</option>
              <option value="registration_bonus">Бонус за реєстрацію</option>
              <option value="service_payment">Оплата послуг</option>
            </select>
          </div>
        </div>

        {/* Transactions List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-neutral-600">Завантаження...</div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b-2 border-neutral-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">Дата</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">Користувач</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">Тип</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">Опис</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-neutral-700">Сума</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-neutral-700">Баланс</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-neutral-600">
                          {new Date(tx.createdAt).toLocaleString('uk-UA')}
                        </td>
                        <td className="px-6 py-4">
                          <Link href={`/profile/${tx.user.id}`} className="hover:text-primary-600">
                            <div className="font-medium text-neutral-900">
                              {tx.user.firstName} {tx.user.lastName}
                            </div>
                            <div className="text-sm text-neutral-600">{tx.user.city}</div>
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getTransactionColor(tx.reason)}`}>
                            {tx.reason}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-600 max-w-xs truncate">
                          {tx.description || '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-neutral-900">
                          {tx.user.balanceUcm?.toLocaleString() || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
