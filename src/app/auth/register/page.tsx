'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Building2, 
  Eye, 
  CheckCircle, 
  X, 
  ArrowRight
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const accountTypes = [
    {
      id: 'viewer',
      name: 'Глядач',
      icon: Eye,
      color: 'bg-neutral-500',
      hoverColor: 'hover:bg-neutral-600',
      price: 'Безкоштовно',
      description: 'Перегляд профілів і послуг',
      features: [
        'Перегляд профілів та послуг',
        'Збереження обраного',
        'Безкоштовний перехід на звичайний профіль',
      ],
      limitations: []
    },
    {
      id: 'individual',
      name: 'Звичайний',
      icon: User,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      price: 'Безкоштовно',
      description: 'Профіль виконавця послуг',
      features: [
        'Повний профіль (детально)',
        'Публікація послуг',
        'Повідомлення та відгуки',
      ],
      limitations: []
    },
    {
      id: 'business',
      name: 'Бізнес',
      icon: Building2,
      color: 'bg-gradient-to-r from-orange-500 to-red-500',
      hoverColor: 'hover:from-orange-600 hover:to-red-600',
      price: 'Безкоштовно',
      description: 'Для компаній та підприємців',
      features: [
        'Бізнес-профіль',
        'Пошук партнерів/інвесторів',
        'Вакансії та пропозиції',
      ],
      limitations: []
    },
  ];

  const handleSelect = (typeId: string) => {
    if (typeId === 'viewer') {
      router.push('/auth/register/viewer');
    } else if (typeId === 'individual') {
      router.push('/auth/register/individual');
    } else if (typeId === 'business') {
      router.push('/auth/register/business');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Оберіть тип акаунту
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Від простого перегляду до повного бізнес-профілю — знайдіть ідеальний варіант для себе
          </p>
        </div>

        {/* Account Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {accountTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;
            
            return (
              <div
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`
                  relative bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer
                  transform transition-all duration-300
                  ${isSelected ? 'ring-4 ring-offset-2 scale-105' : 'hover:shadow-2xl hover:scale-102'}
                  ${isSelected && type.id === 'individual' ? 'ring-blue-500' : ''}
                  ${isSelected && type.id === 'business' ? 'ring-orange-500' : ''}
                  ${isSelected && type.id === 'viewer' ? 'ring-neutral-500' : ''}
                `}
              >
                {/* Header */}
                <div className={`${type.color} p-6 text-white relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 opacity-10">
                    <Icon className="w-32 h-32" />
                  </div>
                  <div className="relative z-10">
                    <Icon className="w-12 h-12 mb-3" />
                    <h3 className="text-2xl font-bold mb-1">{type.name}</h3>
                    <p className="text-sm opacity-90">{type.description}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="px-6 py-4 border-b border-gray-100">
                  <div className="text-2xl font-bold text-gray-900">{type.price}</div>
                </div>

                {/* Features */}
                <div className="p-6">
                  <div className="space-y-3 mb-4">
                    {type.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {type.limitations.length > 0 && (
                    <div className="space-y-2 pt-4 border-t border-gray-100">
                      {type.limitations.map((limitation, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-500">{limitation}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Select Button */}
                <div className="px-6 pb-6">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(type.id);
                    }}
                    className={`
                      w-full ${type.color} ${type.hoverColor} text-white 
                      py-3 px-6 rounded-lg font-semibold 
                      transition-all duration-300 
                      flex items-center justify-center gap-2
                      shadow-md hover:shadow-lg
                    `}
                  >
                    Обрати
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Text */}
        <div className="text-center mt-12 space-y-4">
          <p className="text-gray-600">
            Вже маєте акаунт?{' '}
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-semibold">
              Увійти
            </Link>
          </p>
          
          <div className="max-w-2xl mx-auto bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Порада</h4>
            <p className="text-sm text-blue-800">
              Оберіть <strong>Глядач</strong> для пошуку та перегляду фахівців, 
              <strong>Звичайний</strong> якщо надаєте послуги, або <strong>Бізнес</strong> для компаній.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

