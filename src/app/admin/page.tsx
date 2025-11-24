'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  MessageSquare, 
  DollarSign, 
  TrendingUp, 
  Activity,
  Shield,
  LogOut,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';

interface AdminStats {
  users: {
    total: number;
    active: number;
    recent: any[];
  };
  services: {
    total: number;
  };
  messages: {
    total: number;
  };
  ucm: {
    totalTransactions: number;
    totalInCirculation: number;
    topUsers: any[];
    byType: any[];
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'messages' | 'transactions'>('overview');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/auth/login');
      return;
    }

    const user = JSON.parse(storedUser);
    
    // Перевірити чи користувач адміністратор
    if (!user.isAdmin) {
      alert('Доступ заборонено. Тільки для адміністраторів.');
      router.push('/');
      return;
    }

    setCurrentUser(user);
    loadStats();
  }, [router]);

  const loadStats = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/admin/stats', {
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Помилка завантаження статистики');
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (err: any) {
      setError(err.message);
      if (err.message.includes('Доступ заборонено')) {
        setTimeout(() => router.push('/auth/login'), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      localStorage.removeItem('user');
      router.push('/auth/login');
    } catch (error) {
      console.error('Помилка виходу:', error);
      // Все одно перенаправити на сторінку входу
      localStorage.removeItem('user');
      router.push('/auth/login');
    }
  };

  if (!currentUser?.isAdmin) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Доступ заборонено</h1>
          <p className="text-neutral-600">Тільки для адміністраторів</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">Завантаження статистики...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadStats}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            Спробувати знову
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/20 to-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-neutral-900 mb-2 flex items-center gap-3">
                <Shield className="w-10 h-10 text-primary-500" />
                Адмін-панель УЦМ
              </h1>
              <p className="text-neutral-600">
                Детальна бізнес-статистика платформи СВІЙ ДЛЯ СВОЇХ
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={loadStats}
                className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-neutral-200 rounded-lg hover:border-primary-500 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Оновити
              </button>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Вихід
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Користувачі */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-transparent hover:border-blue-500 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm text-neutral-500">Користувачі</span>
            </div>
            <div className="mb-2">
              <div className="text-3xl font-bold text-neutral-900">
                {stats?.users.total.toLocaleString()}
              </div>
              <div className="text-sm text-neutral-600 mt-1">
                Активних: {stats?.users.active.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Послуги */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-transparent hover:border-green-500 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm text-neutral-500">Послуги</span>
            </div>
            <div className="text-3xl font-bold text-neutral-900">
              {stats?.services.total.toLocaleString()}
            </div>
          </div>

          {/* Повідомлення */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-transparent hover:border-purple-500 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm text-neutral-500">Повідомлення</span>
            </div>
            <div className="text-3xl font-bold text-neutral-900">
              {stats?.messages.total.toLocaleString()}
            </div>
          </div>

          {/* УЦМ */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-transparent hover:border-amber-500 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-100 rounded-xl">
                <DollarSign className="w-6 h-6 text-amber-600" />
              </div>
              <span className="text-sm text-neutral-500">УЦМ в обігу</span>
            </div>
            <div className="mb-2">
              <div className="text-3xl font-bold text-neutral-900">
                {stats?.ucm.totalInCirculation.toLocaleString()}
              </div>
              <div className="text-sm text-neutral-600 mt-1">
                Транзакцій: {stats?.ucm.totalTransactions.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg p-2 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'overview'
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              Огляд
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'users'
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              Користувачі
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'messages'
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              Переписки
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'transactions'
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              Транзакції
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <>
              {/* Нові користувачі */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-neutral-900 mb-4">
                  Нові користувачі (останні 7 днів)
                </h2>
                <div className="space-y-3">
                  {stats?.users.recent.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors">
                      <div>
                        <div className="font-medium text-neutral-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-neutral-600">{user.email}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-neutral-600">{user.city}</div>
                        <div className="text-xs text-neutral-500">
                          {new Date(user.createdAt).toLocaleDateString('uk-UA')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Топ користувачів по УЦМ */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-neutral-900 mb-4">
                  Топ-10 користувачів по балансу УЦМ
                </h2>
                <div className="space-y-3">
                  {stats?.ucm.topUsers.map((user: any, index: number) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-neutral-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-neutral-600">{user.city}</div>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-amber-600">
                        {user.balanceUcm.toLocaleString()} уцм
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Статистика транзакцій по типах */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-neutral-900 mb-4">
                  Транзакції по типах
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stats?.ucm.byType.map((type: any) => (
                    <div key={type.reason} className="p-4 bg-neutral-50 rounded-lg">
                      <div className="font-medium text-neutral-900 mb-2">{type.reason}</div>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-600">Кількість:</span>
                        <span className="font-bold">{type._count.id}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-600">Сума:</span>
                        <span className="font-bold">{type._sum.amount?.toLocaleString()} уцм</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'users' && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">
                Детальний список користувачів
              </h2>
              <div className="text-center py-8 text-neutral-600">
                <button 
                  onClick={() => router.push('/admin/users-manage')} 
                  className="text-primary-500 hover:text-primary-600 font-medium"
                >
                  Перейти до управління користувачами →
                </button>
              </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">
                Статистика переписок
              </h2>
              <div className="text-center py-8 text-neutral-600">
                <button 
                  onClick={() => router.push('/admin/messages')} 
                  className="text-primary-500 hover:text-primary-600 font-medium"
                >
                  Перейти до переписок →
                </button>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">
                Історія транзакцій
              </h2>
              <div className="text-center py-8 text-neutral-600">
                <button 
                  onClick={() => router.push('/admin/transactions')} 
                  className="text-primary-500 hover:text-primary-600 font-medium"
                >
                  Перейти до транзакцій →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
