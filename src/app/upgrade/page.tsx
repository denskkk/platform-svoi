'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Coins, 
  Zap, 
  Crown, 
  Building2, 
  Search, 
  Briefcase, 
  Users, 
  TrendingUp,
  Check,
  ArrowRight,
  Eye,
  User,
  AlertCircle
} from 'lucide-react';

interface PaidAction {
  type: string;
  cost: number;
  description: string;
  icon: any;
}

const PAID_ACTIONS: PaidAction[] = [
  {
    type: 'partner_search',
    cost: 5,
    description: 'Пошук пари/партнера',
    icon: Search
  },
  {
    type: 'job_request',
    cost: 3,
    description: 'Заявка на роботу',
    icon: Briefcase
  },
  {
    type: 'service_request',
    cost: 3,
    description: 'Запит на послугу',
    icon: Users
  },
  {
    type: 'employee_search',
    cost: 4,
    description: 'Пошук співробітника',
    icon: Users
  },
  {
    type: 'investor_search',
    cost: 5,
    description: 'Пошук інвестора',
    icon: TrendingUp
  },
  {
    type: 'advanced_search',
    cost: 2,
    description: 'Розширений пошук',
    icon: Search
  }
];

const ACCOUNT_TYPES = [
  {
    type: 'viewer',
    name: 'Глядач',
    icon: Eye,
    color: 'gray',
    current: true,
    features: [
      'Перегляд оголошень',
      'Базовий пошук',
      'Перегляд профілів',
      'Читання відгуків'
    ],
    price: 0
  },
  {
    type: 'basic',
    name: 'Звичайний',
    icon: User,
    color: 'blue',
    features: [
      'Всі можливості Глядача',
      'Створення детального профілю',
      'Можливість отримувати повідомлення',
      'Додавання послуг',
      'Залишати відгуки'
    ],
    price: 0
  },
  {
    type: 'business',
    name: 'Бізнес',
    icon: Building2,
    color: 'yellow',
    features: [
      'Всі можливості Звичайного',
      'Бізнес-профіль з логотипом',
      'Розширена статистика',
      'Пріоритет у пошуку',
      'Верифікація бізнесу',
      'Банер компанії'
    ],
    price: 0
  }
];

export default function UpgradePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setBalance(Number(data.user.balanceUcm) || 0);
      } else {
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeAccount = async (targetType: string) => {
    if (targetType === user?.accountType) return;

    const currentIndex = ACCOUNT_TYPES.findIndex(t => t.type === user?.accountType);
    const targetIndex = ACCOUNT_TYPES.findIndex(t => t.type === targetType);

    if (targetIndex <= currentIndex) {
      alert('Ви не можете знизити тип акаунту');
      return;
    }

    if (!confirm(`Змінити тип акаунту на "${ACCOUNT_TYPES[targetIndex].name}"?`)) {
      return;
    }

    setUpgrading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ accountType: targetType })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Акаунт успішно оновлено!');
        await loadUserData();
      } else {
        alert(data.error || 'Помилка оновлення акаунту');
      }
    } catch (error) {
      console.error('Error upgrading account:', error);
      alert('Помилка оновлення акаунту');
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Завантаження...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Покращення акаунту
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Змініть тип акаунту або купіть доступ до платних функцій
          </p>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl shadow-xl p-8 mb-12 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-yellow-100 text-sm mb-2">Ваш баланс</p>
              <div className="flex items-center gap-3">
                <Coins className="w-10 h-10" />
                <span className="text-5xl font-bold">{balance.toFixed(2)}</span>
                <span className="text-2xl">уцмок</span>
              </div>
            </div>
            <Link
              href="/payments/checkout"
              className="bg-white text-orange-600 px-6 py-3 rounded-xl font-semibold hover:bg-yellow-50 transition-colors shadow-lg"
            >
              Поповнити баланс
            </Link>
          </div>
        </div>

        {/* Account Types */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Типи акаунтів
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {ACCOUNT_TYPES.map((accountType) => {
              const isCurrentType = user?.accountType === accountType.type;
              const Icon = accountType.icon;
              const colorClasses = {
                gray: 'from-gray-400 to-gray-500',
                blue: 'from-blue-500 to-indigo-600',
                yellow: 'from-yellow-400 to-orange-500'
              };

              return (
                <div
                  key={accountType.type}
                  className={`bg-white rounded-2xl shadow-lg p-8 border-2 transition-all ${
                    isCurrentType 
                      ? 'border-green-500 ring-2 ring-green-200' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${colorClasses[accountType.color as keyof typeof colorClasses]} rounded-xl mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {accountType.name}
                  </h3>
                  
                  {isCurrentType && (
                    <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold mb-4">
                      <Check className="w-4 h-4" />
                      Поточний тип
                    </div>
                  )}

                  <div className="mb-6">
                    <p className="text-3xl font-bold text-gray-900">
                      {accountType.price === 0 ? 'Безкоштовно' : `${accountType.price} уцмок`}
                    </p>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {accountType.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-700">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {!isCurrentType && (
                    <button
                      onClick={() => handleUpgradeAccount(accountType.type)}
                      disabled={upgrading}
                      className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                        upgrading
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700'
                      }`}
                    >
                      {upgrading ? 'Оновлення...' : 'Змінити тип'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Paid Actions */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            Платні функції
          </h2>
          <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
            Кожна функція платна. Ви платите тільки за те, що використовуєте.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PAID_ACTIONS.map((action) => {
              const Icon = action.icon;
              const canAfford = balance >= action.cost;

              return (
                <div
                  key={action.type}
                  className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {action.description}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-bold text-gray-900">{action.cost}</span>
                    <span className="text-gray-600">уцмок</span>
                  </div>

                  {!canAfford && (
                    <div className="flex items-center gap-2 text-orange-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>Недостатньо коштів</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  Як працюють платні функції?
                </h3>
                <p className="text-blue-800 text-sm">
                  Коли ви використовуєте платну функцію (наприклад, робите заявку на роботу або шукаєте партнера), 
                  система автоматично спише потрібну кількість уцмок з вашого балансу. 
                  Переконайтеся, що у вас достатньо коштів перед використанням функції.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
