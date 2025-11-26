'use client';

import { Check, Crown, Sparkles, Star, Zap } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCurrentUser } from '@/hooks/usePermission';
import { getAccountTypeName } from '@/lib/permissions';

export default function PricingPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [trialInfo, setTrialInfo] = useState<{ trialDaysLeft: number; trialStatus: string; expiresAt?: string } | null>(null);

  // Завантажити оновлені дані профілю для актуального trial стану
  useEffect(() => {
    const loadTrial = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`/api/profile/${user.id}`);
        const data = await res.json();
        if (data?.user) {
          setTrialInfo({
            trialDaysLeft: data.user.trialDaysLeft,
            trialStatus: data.user.trialStatus,
            expiresAt: data.user.subscriptionExpiresAt || undefined,
          });
          // Оновити localStorage користувача (наприклад, якщо trial закінчився і subscriptionActive змінився)
          const storedRaw = localStorage.getItem('user');
          if (storedRaw) {
            try {
              const stored = JSON.parse(storedRaw);
              localStorage.setItem('user', JSON.stringify({
                ...stored,
                subscriptionActive: data.user.subscriptionActive,
                subscriptionExpiresAt: data.user.subscriptionExpiresAt,
                subscriptionStartedAt: data.user.subscriptionStartedAt,
              }));
              window.dispatchEvent(new Event('auth:changed'));
            } catch {}
          }
        }
      } catch (e) {
        // Ignore trial info errors silently
      }
    };
    loadTrial();
  }, [user?.id]);

  const plans = [
    {
      name: 'Базовий',
      type: 'basic',
      price: 'Безкоштовно',
      icon: Star,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      features: [
        'Перегляд каталогу послуг',
        'Перегляд профілів',
        'Редагування свого профілю',
        'Додавання в обране',
        'Залишення відгуків',
      ],
      limitations: [
        'Без створення послуг',
        'Без створення заявок',
        'Без обміну повідомленнями',
      ]
    },
    {
      name: 'Розширений',
      type: 'extended',
      price: '0 УЦМ на 3 міс, далі 199 УЦМ/міс',
      icon: Zap,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      popular: true,
      features: [
        'Перші 3 місяці — безкоштовно',
        'Всі функції Базового',
        'Створення заявок',
        'Обмін повідомленнями',
        'Перегляд історії заявок',
        'Пріоритетна підтримка',
      ],
    },
    {
      name: 'Бізнес',
      type: 'business',
      price: '0 УЦМ на 3 міс, далі 499 УЦМ/міс',
      icon: Sparkles,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      features: [
        'Перші 3 місяці — безкоштовно',
        'Всі функції Розширеного',
        'Створення послуг/товарів',
        'Бізнес-профіль',
        'Пошук партнерів',
        'Пошук інвесторів',
        'Пошук клієнтів',
        'Аналітика послуг',
      ],
    },
    {
      name: 'Бізнес Преміум',
      type: 'business_premium',
      price: '0 УЦМ на 3 міс, далі 999 УЦМ/міс',
      icon: Crown,
      color: 'text-yellow-600',
      bgColor: 'bg-gradient-to-br from-yellow-50 to-orange-50',
      borderColor: 'border-yellow-300',
      premium: true,
      features: [
        'Перші 3 місяці — безкоштовно',
        'Всі функції Бізнес',
        'Автоматичні пропозиції',
  'Аналіз спільноти (контент-моніторинг)',
        'Пріоритетний пошук',
        'Розширена аналітика',
        'Персональний менеджер',
        'API доступ',
      ],
    },
  ];

  const handleSelectPlan = (planType: string) => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    // If user already at or above selected plan do nothing
    const order = ['basic','extended','business','business_premium'];
    const currentIdx = order.indexOf(user.accountType);
    const targetIdx = order.indexOf(planType);
    if (targetIdx <= currentIdx) return;
    // Redirect to upgrade flow, preselect plan
    router.push(`/auth/upgrade?target=${planType}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Оберіть свій план
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Розблокуйте нові можливості для вашого бізнесу. Почніть безкоштовно або оберіть преміум план.
          </p>
          {user && (
            <div className="mt-4 inline-flex items-center gap-3 px-4 py-2 bg-white rounded-full shadow-sm">
              <span className="text-sm text-gray-600">
                Поточний план: <span className="font-semibold text-blue-600">{getAccountTypeName(user.accountType)}</span>
              </span>
              {trialInfo?.trialStatus === 'active' && (
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200" title="Пробний період активний">
                  {trialInfo.trialDaysLeft} дн. залишилось
                </span>
              )}
              {trialInfo?.trialStatus === 'expired' && (
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200" title="Пробний період завершено">
                  Пробний період завершено
                </span>
              )}
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = user?.accountType === plan.type;
            
            return (
              <div
                key={plan.type}
                className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transition-transform hover:scale-105 ${
                  plan.popular || plan.premium ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {/* Popular/Premium Badge */}
                {(plan.popular || plan.premium) && (
                  <div className={`absolute top-0 right-0 ${plan.premium ? 'bg-gradient-to-r from-yellow-400 to-orange-400' : 'bg-blue-500'} text-white px-4 py-1 text-xs font-bold rounded-bl-lg`}>
                    {plan.premium ? '👑 ПРЕМІУМ' : '⭐ ПОПУЛЯРНИЙ'}
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute top-0 left-0 bg-green-500 text-white px-4 py-1 text-xs font-bold rounded-br-lg">
                    ✓ АКТИВНИЙ
                  </div>
                )}

                <div className={`${plan.bgColor} p-6`}>
                  <Icon className={`w-12 h-12 ${plan.color} mb-4`} />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="text-3xl font-bold text-gray-900">{plan.price}</div>
                  {isCurrentPlan && trialInfo?.trialStatus === 'active' && (
                    <div className="mt-2 text-sm font-medium text-amber-700">
                      Пробний період: {trialInfo.trialDaysLeft} дн. залишилось
                    </div>
                  )}
                  {isCurrentPlan && trialInfo?.trialStatus === 'expired' && (
                    <div className="mt-2 text-sm font-medium text-neutral-600">
                      Пробний період завершено
                    </div>
                  )}
                </div>

                <div className="p-6">
                  {/* Features */}
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Limitations */}
                  {plan.limitations && (
                    <ul className="space-y-2 mb-6 pb-6 border-b border-gray-200">
                      {plan.limitations.map((limitation, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-red-400 mr-2">✗</span>
                          <span className="text-xs text-gray-500">{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* CTA Button */}
                  {isCurrentPlan ? (
                    <button
                      disabled
                      className="w-full py-3 px-4 bg-gray-100 text-gray-500 rounded-lg font-medium cursor-not-allowed"
                    >
                      Поточний план
                    </button>
                  ) : plan.type === 'basic' ? (
                    <Link
                      href="/auth/register"
                      className="block w-full py-3 px-4 bg-gray-900 text-white rounded-lg font-medium text-center hover:bg-gray-800 transition-colors"
                    >
                      Почати безкоштовно
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleSelectPlan(plan.type)}
                      className={`w-full py-3 px-4 ${
                        plan.premium
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
                          : 'bg-blue-600 hover:bg-blue-700'
                      } text-white rounded-lg font-medium transition-colors`}
                    >
                      Обрати план
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Часті питання</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Чи можу я змінити план пізніше?</h3>
              <p className="text-gray-600 text-sm">
                Так, ви можете оновити або понизити свій план в будь-який час. Зміни набудуть чинності з наступного платіжного циклу.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Чи можу я скасувати підписку?</h3>
              <p className="text-gray-600 text-sm">
                Так, ви можете скасувати підписку в будь-який час. Доступ до преміум функцій збережеться до кінця оплаченого періоду.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Які методи оплати підтримуються?</h3>
              <p className="text-gray-600 text-sm">
                Ми приймаємо всі основні банківські карти (Visa, Mastercard), а також Apple Pay та Google Pay.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Що таке аналіз спільноти?</h3>
              <p className="text-gray-600 text-sm">
                Інструменти аналітики взаємодій та контенту користувачів для виявлення потенційних клієнтів і партнерів.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Потрібна допомога з вибором плану?
          </p>
          <Link
            href="/contacts"
            className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg font-medium shadow-sm hover:shadow-md transition-shadow"
          >
            Зв'язатися з нами
          </Link>
        </div>
      </div>
    </div>
  );
}

// Локальна функція видалена — використовуємо єдине джерело правди з '@/lib/permissions'
