'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, User, Mail, Phone, MapPin, GraduationCap, Briefcase,
  Home, Car, Heart, Users, PawPrint, Utensils, Dumbbell
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function RegisterExtendedPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('basic');

  // Заборона прямого доступу: extended реєстрація можлива лише через апгрейд існуючого акаунту
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      // Немає акаунту — редирект на базову реєстрацію
      toast.warning('Спочатку потрібно створити Базовий акаунт, а потім покращити до Розширеного.');
      router.push('/auth/register/basic');
    }
  }, [router, toast]);
  
  const [formData, setFormData] = useState({
    // Основна інформація (з базового)
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    city: '',
    educationLevel: '',
    educationDetails: '',
    ucmMember: '',
    ucmSupporter: '',
    employmentStatus: '',
    
    // Розширена інформація
    // Сім'я
    gender: '',
    age: '',
    maritalStatus: '',
    childrenCount: '',
    childrenAges: '',
    
    // Житло
    housingType: '',
    housingDetails: '',
    livingSituation: '',
    
    // Транспорт
    hasCar: '',
    carInfo: '',
    carServices: '',
    otherTransport: '',
    
    // Тварини
    hasPets: '',
    petsInfo: '',
    
    // Інтереси
    hobbies: '',
    outdoorActivities: '',
    restaurantFrequency: '',
    cuisinePreference: '',
    sports: '',
    
    // Послуги
    usesServices: '',
    usesDelivery: '',
    beautyServices: '',
  });

  const cities = [
    'Київ', 'Харків', 'Одеса', 'Дніпро', 'Донецьк', 'Запоріжжя',
    'Львів', 'Кривий Ріг', 'Миколаїв', 'Маріуполь', 'Вінниця',
    'Херсон', 'Полтава', 'Чернігів', 'Черкаси', 'Суми'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Валідація
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError('Заповніть всі обов\'язкові поля на вкладці "Основне"');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Паролі не співпадають');
      return;
    }

    if (formData.password.length < 6) {
      setError('Пароль повинен містити мінімум 6 символів');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          accountType: 'extended',
          role: 'user',
          ucmMember: formData.ucmMember === 'yes',
          ucmSupporter: formData.ucmSupporter === 'yes',
          age: formData.age ? parseInt(formData.age) : null,
          childrenCount: formData.childrenCount ? parseInt(formData.childrenCount) : null,
          hasCar: formData.hasCar === 'yes',
          hasPets: formData.hasPets === 'yes',
          usesDelivery: formData.usesDelivery === 'yes',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Помилка реєстрації');
      }

      // Зберегти користувача та токен
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      // Перенаправити на профіль
      router.push(`/profile/${data.user.id}`);
    } catch (err: any) {
      setError(err.message || 'Помилка реєстрації');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'basic', name: 'Основне', icon: User },
    { id: 'family', name: 'Сім\'я', icon: Users },
    { id: 'housing', name: 'Житло та транспорт', icon: Home },
    { id: 'lifestyle', name: 'Спосіб життя', icon: Heart },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          href="/auth/register"
          className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад до вибору типу
        </Link>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Розширений Акаунт</h1>
                <p className="text-purple-100 mt-1">Повний профіль + заявки + пошук</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="px-8 flex space-x-4 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-4 border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'border-purple-500 text-purple-600 font-medium'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Основне Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                {/* ПІБ */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Особисті дані</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ім&apos;я *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        required
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        По батькові
                      </label>
                      <input
                        type="text"
                        name="middleName"
                        value={formData.middleName}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Прізвище *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        required
                        value={formData.lastName}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Контакти */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Контакти</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Телефон
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Пароль *
                      </label>
                      <input
                        type="password"
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Підтвердження паролю *
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Місто та освіта */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Місто
                    </label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Оберіть місто</option>
                      {cities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Освіта
                    </label>
                    <select
                      name="educationLevel"
                      value={formData.educationLevel}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Оберіть рівень</option>
                      <option value="secondary">Середня</option>
                      <option value="college">Коледж</option>
                      <option value="bachelor">Бакалавр</option>
                      <option value="master">Магістр</option>
                    </select>
                  </div>
                </div>

                {/* УЦМ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Участник УЦМ?
                    </label>
                    <select
                      name="ucmMember"
                      value={formData.ucmMember}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Оберіть</option>
                      <option value="yes">Так</option>
                      <option value="no">Ні</option>
                      <option value="planning">Планую</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Статус роботи
                    </label>
                    <select
                      name="employmentStatus"
                      value={formData.employmentStatus}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Оберіть</option>
                      <option value="employed">Працюю</option>
                      <option value="business">Власник бізнесу</option>
                      <option value="looking">В пошуку роботи</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Сім'я Tab */}
            {activeTab === 'family' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Стать
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Оберіть</option>
                      <option value="male">Чоловік</option>
                      <option value="female">Жінка</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Вік
                    </label>
                    <input
                      type="number"
                      name="age"
                      min="18"
                      max="120"
                      value={formData.age}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Сімейний стан
                    </label>
                    <select
                      name="maritalStatus"
                      value={formData.maritalStatus}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Оберіть</option>
                      <option value="single">В пошуку</option>
                      <option value="relationship">Цивільний шлюб</option>
                      <option value="married">Одружений/Одружена</option>
                      <option value="divorced">В розводі</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Кількість дітей
                    </label>
                    <select
                      name="childrenCount"
                      value={formData.childrenCount}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Оберіть</option>
                      <option value="0">Немає</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">Більше 3</option>
                    </select>
                  </div>
                </div>

                {formData.childrenCount && formData.childrenCount !== '0' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Вік дітей (для підбору садка/школи)
                    </label>
                    <input
                      type="text"
                      name="childrenAges"
                      value={formData.childrenAges}
                      onChange={handleChange}
                      placeholder="Наприклад: 0-2, 6-10"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      0-2, 2-5, 6-10, 10-14, 14-18
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Житло та транспорт Tab */}
            {activeTab === 'housing' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Житло</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Тип житла
                    </label>
                    <select
                      name="housingType"
                      value={formData.housingType}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Оберіть</option>
                      <option value="house">Будинок (гараж, двір, сад)</option>
                      <option value="apartment">Квартира</option>
                      <option value="ground_apartment">Квартира на землі</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Проживання
                    </label>
                    <select
                      name="livingSituation"
                      value={formData.livingSituation}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Оберіть</option>
                      <option value="alone">Один/Одна</option>
                      <option value="family">З родиною</option>
                      <option value="roommates">З співмешканцями</option>
                    </select>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 pt-4">Транспорт</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Автомобіль
                    </label>
                    <select
                      name="hasCar"
                      value={formData.hasCar}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Оберіть</option>
                      <option value="yes">Так</option>
                      <option value="no">Ні, користуюсь таксі</option>
                    </select>
                  </div>

                  {formData.hasCar === 'yes' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Марка та рік
                        </label>
                        <input
                          type="text"
                          name="carInfo"
                          value={formData.carInfo}
                          onChange={handleChange}
                          placeholder="Toyota Camry 2020"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Відвідуєте (СТО, Мийку, Автосалони)
                        </label>
                        <input
                          type="text"
                          name="carServices"
                          value={formData.carServices}
                          onChange={handleChange}
                          placeholder="СТО Автомайстер, Мийка на Хрещатику"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </>
                  )}

                  <div className={formData.hasCar === 'yes' ? 'md:col-span-2' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Велосипед/Самокат
                    </label>
                    <input
                      type="text"
                      name="otherTransport"
                      value={formData.otherTransport}
                      onChange={handleChange}
                      placeholder="Giant велосипед, Xiaomi самокат"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 pt-4">Домашні тварини</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Чи є тварини?
                    </label>
                    <select
                      name="hasPets"
                      value={formData.hasPets}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Оберіть</option>
                      <option value="yes">Так</option>
                      <option value="no">Ні</option>
                    </select>
                  </div>

                  {formData.hasPets === 'yes' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Які тварини
                      </label>
                      <input
                        type="text"
                        name="petsInfo"
                        value={formData.petsInfo}
                        onChange={handleChange}
                        placeholder="Кіт, Пес, Свиня, Корова..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Спосіб життя Tab */}
            {activeTab === 'lifestyle' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Харчування та відпочинок</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Інтернет-доставка їжі та товарів
                    </label>
                    <select
                      name="usesDelivery"
                      value={formData.usesDelivery}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Оберіть</option>
                      <option value="yes">Користуюсь</option>
                      <option value="no">Не пробував, але хотів би</option>
                      <option value="never">Не цікаво</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Кафе та ресторани
                    </label>
                    <select
                      name="restaurantFrequency"
                      value={formData.restaurantFrequency}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Оберіть</option>
                      <option value="often">Часто</option>
                      <option value="sometimes">По бажанню</option>
                      <option value="rarely">Рідко</option>
                      <option value="never">Не хожу</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Улюблена кухня
                    </label>
                    <select
                      name="cuisinePreference"
                      value={formData.cuisinePreference}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Оберіть</option>
                      <option value="home">Домашня</option>
                      <option value="chinese">Китайська</option>
                      <option value="european">Європейська</option>
                      <option value="street">Вулична їжа</option>
                    </select>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 pt-4">Активність</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Активний відпочинок (Охота/Рибалка/Природа)
                  </label>
                  <textarea
                    name="outdoorActivities"
                    value={formData.outdoorActivities}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    placeholder="Опишіть ваші захоплення..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Відношення до спорту
                  </label>
                  <input
                    type="text"
                    name="sports"
                    value={formData.sports}
                    onChange={handleChange}
                    placeholder="Спортзал, біг, йога..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <h3 className="text-lg font-semibold text-gray-900 pt-4">Послуги</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Користуюся послугами
                  </label>
                  <input
                    type="text"
                    name="usesServices"
                    value={formData.usesServices}
                    onChange={handleChange}
                    placeholder="Електрик, Сантехнік, Клінінг, Будівельник..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Салони краси
                  </label>
                  <input
                    type="text"
                    name="beautyServices"
                    value={formData.beautyServices}
                    onChange={handleChange}
                    placeholder="Перукар, Манікюр, СПА, Масаж..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Кнопки */}
            <div className="flex gap-4 pt-6 border-t border-gray-200 mt-8">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? 'Реєструємо...' : 'Зареєструватися'}
              </button>
              <Link
                href="/auth/register"
                className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-center"
              >
                Скасувати
              </Link>
            </div>

            <div className="text-center pt-4">
              <p className="text-gray-600">
                Вже маєте акаунт?{' '}
                <Link href="/auth/login" className="text-purple-600 hover:text-purple-700 font-semibold">
                  Увійти
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Info */}
        <div className="mt-6 bg-purple-50 border border-purple-200 rounded-xl p-4">
          <p className="text-sm text-purple-800">
            ⭐ <strong>Розширений акаунт:</strong> Заповніть всю інформацію для повного доступу до функцій платформи. 
            Ви зможете залишати та приймати заявки, а роботодавці та інші користувачі зможуть знайти вас за критеріями!
          </p>
        </div>
      </div>
    </div>
  );
}
