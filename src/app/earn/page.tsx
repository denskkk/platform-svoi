'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Coins, 
  Gift, 
  Users, 
  CheckCircle, 
  Star,
  TrendingUp,
  Award,
  Calendar,
  Zap,
  Target,
  Lock,
  Crown
} from 'lucide-react';

interface EarningProgress {
  action: string;
  description: string;
  amount: number;
  completed: boolean;
  canEarn: boolean;
  progress: number;
  progressMax: number;
  isRepeatable: boolean;
}

interface EarningStats {
  referralsCount: number;
  servicesCount: number;
  reviewsGivenCount: number;
  reviewsReceivedCount: number;
  avgRating: number;
  totalReviews: number;
  daysSinceRegistration: number;
  balanceUcm: number;
}

const ACTION_ICONS: Record<string, any> = {
  REFERRAL_INVITER: Users,
  REFERRAL_INVITEE: Gift,
  PROFILE_COMPLETE: CheckCircle,
  FIRST_SERVICE: Zap,
  VERIFIED_PHONE: CheckCircle,
  VERIFIED_EMAIL: CheckCircle,
  ADD_AVATAR: CheckCircle,
  FIRST_REVIEW_RECEIVED: Star,
  GIVE_REVIEW: Star,
  SERVICE_COMPLETED: Award,
  HIGH_RATING: TrendingUp,
  TEN_REVIEWS: Target,
  DAILY_LOGIN: Calendar,
  WEEKLY_ACTIVE: Calendar,
  BUSINESS_UPGRADE: Crown,
  FIRST_MONTH: Award
};

export default function EarnPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [progress, setProgress] = useState<EarningProgress[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [totalEarned, setTotalEarned] = useState<number>(0);
  const [stats, setStats] = useState<EarningStats | null>(null);
  const [taskFilter, setTaskFilter] = useState<'all'|'incomplete'|'completed'|'repeatable'|'one-time'>('all');
  const [taskSort, setTaskSort] = useState<'default'|'amount-desc'|'amount-asc'|'progress-desc'|'progress-asc'|'name-asc'>('default');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      // Загрузить пользователя
      const userResponse = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData.user);
        setBalance(Number(userData.user.balanceUcm) || 0);
      }

      // Загрузить прогресс заработка
      const progressResponse = await fetch('/api/earning/progress', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        setProgress(progressData.progress || []);
        setTotalEarned(progressData.totalEarned || 0);
      }

      // Загрузить агреговану статистику
      const statsResponse = await fetch('/api/earning/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (!user?.referralCode) return;
    
    const link = `${window.location.origin}/auth/register?ref=${user.referralCode}`;
    navigator.clipboard.writeText(link);
    alert('Реферальне посилання скопійовано!');
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

  const completedTasks = progress.filter(p => p.completed).length;
  const totalTasks = progress.filter(p => !p.isRepeatable).length;
  let visibleTasks = progress.slice();
  if (taskFilter === 'incomplete') visibleTasks = visibleTasks.filter(t => !t.completed);
  else if (taskFilter === 'completed') visibleTasks = visibleTasks.filter(t => t.completed);
  else if (taskFilter === 'repeatable') visibleTasks = visibleTasks.filter(t => t.isRepeatable);
  else if (taskFilter === 'one-time') visibleTasks = visibleTasks.filter(t => !t.isRepeatable);

  if (taskSort === 'amount-desc') visibleTasks.sort((a,b)=>b.amount - a.amount);
  else if (taskSort === 'amount-asc') visibleTasks.sort((a,b)=>a.amount - b.amount);
  else if (taskSort === 'progress-desc') visibleTasks.sort((a,b)=> (b.progress/b.progressMax) - (a.progress/a.progressMax));
  else if (taskSort === 'progress-asc') visibleTasks.sort((a,b)=> (a.progress/a.progressMax) - (b.progress/b.progressMax));
  else if (taskSort === 'name-asc') visibleTasks.sort((a,b)=> a.description.localeCompare(b.description));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl mb-4 shadow-lg">
            <Coins className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Як заробити уцмки
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Виконуйте завдання та збільшуйте свій баланс
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Current Balance */}
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center gap-3 mb-3">
              <Coins className="w-8 h-8" />
              <h3 className="text-xl font-bold">Ваш баланс</h3>
            </div>
            <div className="text-4xl font-bold mb-2">{balance.toFixed(2)}</div>
            <div className="text-yellow-100">уцмок</div>
          </div>

          {/* Total Earned */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-200">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <h3 className="text-xl font-bold text-gray-900">Зароблено</h3>
            </div>
            <div className="text-4xl font-bold text-green-600 mb-2">{totalEarned.toFixed(2)}</div>
            <div className="text-gray-600">уцмок всього</div>
          </div>

          {/* Progress */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <Target className="w-8 h-8 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">Прогрес</h3>
            </div>
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {completedTasks}/{totalTasks}
            </div>
            <div className="text-gray-600">завдань виконано</div>
          </div>
        </div>

        {/* Detailed Stats */}
        {stats && (
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-neutral-200">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-6 h-6 text-indigo-600" />
                <h4 className="font-semibold text-neutral-800">Реферали</h4>
              </div>
              <div className="text-3xl font-bold text-indigo-600">{stats.referralsCount}</div>
              <p className="text-xs text-neutral-500 mt-1">Зареєстрованих по вашому коду</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-neutral-200">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-6 h-6 text-yellow-600" />
                <h4 className="font-semibold text-neutral-800">Сервіси</h4>
              </div>
              <div className="text-3xl font-bold text-yellow-600">{stats.servicesCount}</div>
              <p className="text-xs text-neutral-500 mt-1">Опублікованих вами</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-neutral-200">
              <div className="flex items-center gap-3 mb-2">
                <Star className="w-6 h-6 text-amber-500" />
                <h4 className="font-semibold text-neutral-800">Рейтинг</h4>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-amber-600">{stats.avgRating.toFixed(1)}</span>
                <span className="text-sm text-neutral-500">({stats.totalReviews})</span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">Середній бал та кількість відгуків</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-neutral-200">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-6 h-6 text-green-600" />
                <h4 className="font-semibold text-neutral-800">Днів на платформі</h4>
              </div>
              <div className="text-3xl font-bold text-green-600">{stats.daysSinceRegistration}</div>
              <p className="text-xs text-neutral-500 mt-1">Активність та досвід</p>
            </div>
          </div>
        )}

        {/* Referral Section */}
        {user?.referralCode && (
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl shadow-2xl p-8 mb-12 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-10 h-10" />
                  <h2 className="text-3xl font-bold">Реферальна програма</h2>
                </div>
                <p className="text-purple-100 text-lg mb-4">
                  Запросіть друзів і отримайте <span className="font-bold text-2xl">10 уцмок</span> за кожного!<br />
                  Ваш друг також отримає <span className="font-bold text-2xl">5 уцмок</span> в подарунок.
                </p>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-4">
                  <p className="text-sm text-purple-100 mb-2">Ваш реферальний код:</p>
                  <p className="text-2xl font-bold font-mono">{user.referralCode}</p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={copyReferralLink}
                  className="bg-white text-purple-600 font-bold px-8 py-4 rounded-xl hover:bg-purple-50 transition-all shadow-lg hover:shadow-xl"
                >
                  📋 Копіювати посилання
                </button>
                <Link
                  href="/referrals"
                  className="bg-purple-700 text-white font-bold px-8 py-4 rounded-xl hover:bg-purple-800 transition-all shadow-lg text-center"
                >
                  Переглянути статистику
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Tasks Grid */}
        {/* Task Controls */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              ['all','Всі'],
              ['incomplete','Невиконані'],
              ['completed','Виконані'],
              ['repeatable','Багаторазові'],
              ['one-time','Одноразові']
            ].map(([val,label]) => (
              <button
                key={val}
                onClick={()=>setTaskFilter(val as any)}
                className={`px-3 py-1.5 text-sm rounded-full border transition ${taskFilter===val ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-neutral-700 border-neutral-300 hover:border-indigo-400'}`}
              >{label}</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-neutral-600">Сортування:</label>
            <select
              value={taskSort}
              onChange={e=>setTaskSort(e.target.value as any)}
              className="text-sm px-3 py-1.5 border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="default">Стандартно</option>
              <option value="amount-desc">Нагорода ↓</option>
              <option value="amount-asc">Нагорода ↑</option>
              <option value="progress-desc">Прогрес ↓</option>
              <option value="progress-asc">Прогрес ↑</option>
              <option value="name-asc">Назва А→Я</option>
            </select>
          </div>
        </div>

        {/* Tasks Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {visibleTasks.map((task) => {
            const Icon = ACTION_ICONS[task.action] || Gift;
            const progressPercent = (task.progress / task.progressMax) * 100;

            return (
              <div
                key={task.action}
                className={`bg-white rounded-xl shadow-lg p-6 border-2 transition-all ${
                  task.completed
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 hover:border-indigo-300 hover:shadow-xl'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      task.completed 
                        ? 'bg-green-100' 
                        : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                    }`}>
                      {task.completed ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <Icon className="w-6 h-6 text-white" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                        {task.description}
                        {task.isRepeatable && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            Багаторазове
                          </span>
                        )}
                      </h3>
                      
                      {!task.completed && task.progressMax > 1 && (
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                            <span>Прогрес</span>
                            <span>{task.progress}/{task.progressMax}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className={`font-bold text-2xl ${
                      task.completed ? 'text-green-600' : 'text-orange-500'
                    }`}>
                      +{task.amount}
                    </div>
                    <div className="text-sm text-gray-500">уцмок</div>
                  </div>
                </div>

                {task.completed && (
                  <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Виконано
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Help Section */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-2xl p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Gift className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Як це працює?
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Виконуйте завдання і отримуйте уцмки на свій баланс</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Деякі завдання можна виконати тільки один раз, інші - багаторазово</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Використовуйте уцмки для платних функцій на платформі</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Запрошуйте друзів і заробляйте разом!</span>
                </li>
              </ul>
              
              <div className="mt-6 flex gap-4">
                <Link
                  href="/upgrade"
                  className="bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  Що можна купити?
                </Link>
                <Link
                  href="/payments/checkout"
                  className="bg-white text-indigo-600 border-2 border-indigo-600 font-bold px-6 py-3 rounded-xl hover:bg-indigo-50 transition-colors"
                >
                  Поповнити баланс
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
