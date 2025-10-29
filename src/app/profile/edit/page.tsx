'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, MapPin, Briefcase, Heart, Car, Globe, Upload, Camera } from 'lucide-react';

export default function EditProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string>('');
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    // Основна інформація
    firstName: '',
    middleName: '',
    lastName: '',
    phone: '',
    age: '',
    gender: '',
    maritalStatus: '',
    familyComposition: '',
    childrenCount: '',
    
    // Місце проживання
    city: '',
    region: '',
    housingType: '',
    livingSituation: '',
    
    // Транспорт
    hasCar: '',
    carInfo: '',
    otherTransport: '',
    
    // Професійна діяльність
    profession: '',
    employmentStatus: '',
    workplace: '',
    education: '',
    privateBusinessInfo: '',
    jobSeeking: '',
    
    // Домашні тварини
    hasPets: '',
    petsInfo: '',
    
    // Інтереси
    hobbies: '',
    outdoorActivities: '',
    lifestyle: '',
    sports: '',
    bio: '',
    
    // Соцмережі
    instagram: '',
    facebook: '',
    telegram: '',
    tiktok: '',
  });
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (!storedUser || !storedToken) {
      router.push('/auth/login');
      return;
    }

    const userData = JSON.parse(storedUser);
    setUser(userData);
    setToken(storedToken);
    setAvatarPreview(userData.avatarUrl || '');

    // Загрузить полные данные профиля
    loadProfile(userData.id, storedToken);
  }, [router]);

  const loadProfile = async (userId: number, authToken: string) => {
    try {
      console.log('[Edit Profile] Завантаження профілю:', userId);
      const response = await fetch(`/api/profile/${userId}`);
      const data = await response.json();
      
      console.log('[Edit Profile] Отримано дані:', data);
      
      if (data.user) {
        const u = data.user;
        const socialLinks = u.socialLinks || {};
        
        console.log('[Edit Profile] Заповнення форми з даними:', {
          firstName: u.firstName,
          profession: u.profession,
          bio: u.bio
        });
        
        setFormData({
          firstName: u.firstName || '',
          middleName: u.middleName || '',
          lastName: u.lastName || '',
          phone: u.phone || '',
          age: u.age?.toString() || '',
          gender: u.gender || '',
          maritalStatus: u.maritalStatus || '',
          familyComposition: u.familyComposition || '',
          childrenCount: u.childrenCount?.toString() || '',
          
          city: u.city || '',
          region: u.region || '',
          housingType: u.housingType || '',
          livingSituation: u.livingSituation || '',
          
          hasCar: u.hasCar === true ? 'yes' : u.hasCar === false ? 'no' : '',
          carInfo: u.carInfo || '',
          otherTransport: u.otherTransport || '',
          
          profession: u.profession || '',
          employmentStatus: u.employmentStatus || '',
          workplace: u.workplace || '',
          education: u.education || '',
          privateBusinessInfo: u.privateBusinessInfo || '',
          jobSeeking: u.jobSeeking || '',
          
          hasPets: u.hasPets === true ? 'yes' : u.hasPets === false ? 'no' : '',
          petsInfo: u.petsInfo || '',
          
          hobbies: u.hobbies || '',
          outdoorActivities: u.outdoorActivities || '',
          lifestyle: u.lifestyle || '',
          sports: u.sports || '',
          bio: u.bio || '',
          
          instagram: socialLinks.instagram || '',
          facebook: socialLinks.facebook || '',
          telegram: socialLinks.telegram || '',
          tiktok: socialLinks.tiktok || '',
        });
        
        console.log('[Edit Profile] Форма заповнена');
      }
    } catch (err) {
      console.error('[Edit Profile] Помилка завантаження профілю:', err);
      setError('Помилка завантаження даних профілю');
    }
  };

  const cities = [
    'Київ', 'Харків', 'Одеса', 'Дніпро', 'Донецьк', 'Запоріжжя', 
    'Львів', 'Кривий Ріг', 'Миколаїв', 'Маріуполь', 'Вінниця', 
    'Макіївка', 'Херсон', 'Чернігів', 'Полтава', 'Черкаси', 
    'Хмельницький', 'Житомир', 'Суми', 'Рівне', 'Горлівка',
    'Кам\'янське', 'Кропивницький', 'Івано-Франківськ', 'Кременчук',
    'Тернопіль', 'Луцьк', 'Біла Церква', 'Краматорськ', 'Мелітополь'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Файл занадто великий. Максимум 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setError('Будь ласка, оберіть зображення');
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return null;

    const formData = new FormData();
    formData.append('file', avatarFile);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok && data.url) {
        return data.url;
      }
      
      throw new Error(data.error || 'Помилка завантаження фото');
    } catch (err: any) {
      console.error('Upload error:', err);
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      let avatarUrl = avatarPreview;
      
      // Загрузить аватар если выбран новый
      if (avatarFile) {
        console.log('[Edit Profile] Завантаження нового аватара...');
        const uploadedUrl = await uploadAvatar();
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
          console.log('[Edit Profile] Аватар завантажено:', uploadedUrl);
        }
      }

      // Подготовка соцсетей в JSON
      const socialLinks: any = {};
      if (formData.instagram) socialLinks.instagram = formData.instagram;
      if (formData.facebook) socialLinks.facebook = formData.facebook;
      if (formData.telegram) socialLinks.telegram = formData.telegram;
      if (formData.tiktok) socialLinks.tiktok = formData.tiktok;

      const requestBody = {
        firstName: formData.firstName,
        middleName: formData.middleName || null,
        lastName: formData.lastName,
        phone: formData.phone || null,
        city: formData.city,
        region: formData.region || null,
        avatarUrl: avatarUrl || null,
        
        gender: formData.gender || null,
        age: formData.age ? parseInt(formData.age) : null,
        maritalStatus: formData.maritalStatus || null,
        familyComposition: formData.familyComposition || null,
        childrenCount: formData.childrenCount ? parseInt(formData.childrenCount) : null,
        
        housingType: formData.housingType || null,
        livingSituation: formData.livingSituation || null,
        
        hasCar: formData.hasCar ? formData.hasCar === 'yes' : null,
        carInfo: formData.carInfo || null,
        otherTransport: formData.otherTransport || null,
        
        profession: formData.profession || null,
        employmentStatus: formData.employmentStatus || null,
        workplace: formData.workplace || null,
        education: formData.education || null,
        privateBusinessInfo: formData.privateBusinessInfo || null,
        jobSeeking: formData.jobSeeking || null,
        
        hasPets: formData.hasPets ? formData.hasPets === 'yes' : null,
        petsInfo: formData.petsInfo || null,
        
        hobbies: formData.hobbies || null,
        outdoorActivities: formData.outdoorActivities || null,
        lifestyle: formData.lifestyle || null,
        sports: formData.sports || null,
        bio: formData.bio || null,
        
        socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : null,
      };

      console.log('[Edit Profile] Відправка даних:', requestBody);

      const response = await fetch(`/api/profile/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      console.log('[Edit Profile] Відповідь від сервера:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Помилка збереження');
      }

      // Обновить данные пользователя в localStorage
      const updatedUser = {
        ...user,
        ...data.user,
        avatarUrl: data.user.avatarUrl || user.avatarUrl
      };
      
      console.log('[Edit Profile] Оновлення localStorage:', updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      setSuccess('Профіль успішно оновлено!');
      
      // Перенаправить на профиль через 1 секунду і примусово оновити
      setTimeout(() => {
        window.location.href = `/profile/${user.id}`;
      }, 1000);
    } catch (err: any) {
      console.error('[Edit Profile] Помилка збереження:', err);
      setError(err.message || 'Помилка збереження');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
        <div className="text-neutral-600">Завантаження...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-500 to-accent-500 px-8 py-6">
            <h1 className="text-3xl font-bold text-white">Редагувати профіль</h1>
            <p className="text-primary-100 mt-2">Дозаповніть або оновіть вашу інформацію</p>
          </div>

          {/* Avatar Upload */}
          <div className="px-8 py-6 border-b border-neutral-200">
            <div className="flex items-center space-x-6">
              <div className="relative">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover border-4 border-primary-200"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary-500 flex items-center justify-center border-4 border-primary-200">
                    <span className="text-white font-bold text-3xl">
                      {formData.firstName?.[0]}{formData.lastName?.[0]}
                    </span>
                  </div>
                )}
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:bg-neutral-50 transition-colors border-2 border-primary-500"
                >
                  <Camera className="w-4 h-4 text-primary-600" />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Фото профілю</h3>
                <p className="text-sm text-neutral-600 mt-1">
                  JPG, PNG або GIF. Максимум 5MB
                </p>
                {avatarFile && (
                  <p className="text-sm text-primary-600 mt-1">
                    ✓ Нове фото вибрано: {avatarFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-neutral-200">
            <div className="px-8">
              <div className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('basic')}
                  className={`py-4 border-b-2 transition-colors ${
                    activeTab === 'basic'
                      ? 'border-primary-500 text-primary-600 font-medium'
                      : 'border-transparent text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <User className="w-5 h-5 inline mr-2" />
                  Основне
                </button>
                <button
                  onClick={() => setActiveTab('location')}
                  className={`py-4 border-b-2 transition-colors ${
                    activeTab === 'location'
                      ? 'border-primary-500 text-primary-600 font-medium'
                      : 'border-transparent text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <MapPin className="w-5 h-5 inline mr-2" />
                  Локація
                </button>
                <button
                  onClick={() => setActiveTab('work')}
                  className={`py-4 border-b-2 transition-colors ${
                    activeTab === 'work'
                      ? 'border-primary-500 text-primary-600 font-medium'
                      : 'border-transparent text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <Briefcase className="w-5 h-5 inline mr-2" />
                  Робота
                </button>
                <button
                  onClick={() => setActiveTab('interests')}
                  className={`py-4 border-b-2 transition-colors ${
                    activeTab === 'interests'
                      ? 'border-primary-500 text-primary-600 font-medium'
                      : 'border-transparent text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <Heart className="w-5 h-5 inline mr-2" />
                  Інтереси
                </button>
                <button
                  onClick={() => setActiveTab('social')}
                  className={`py-4 border-b-2 transition-colors ${
                    activeTab === 'social'
                      ? 'border-primary-500 text-primary-600 font-medium'
                      : 'border-transparent text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <Globe className="w-5 h-5 inline mr-2" />
                  Соцмережі
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="px-8 pt-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                {success}
              </div>
            )}
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="px-8 py-6">
            {/* Basic Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Ім'я *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Прізвище *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      По батькові
                    </label>
                    <input
                      type="text"
                      name="middleName"
                      value={formData.middleName}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Телефон
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="+380 XX XXX XX XX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Вік
                    </label>
                    <input
                      type="number"
                      name="age"
                      min="18"
                      max="120"
                      value={formData.age}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Стать
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Не вказано</option>
                      <option value="male">Чоловіча</option>
                      <option value="female">Жіноча</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Сімейний стан
                    </label>
                    <select
                      name="maritalStatus"
                      value={formData.maritalStatus}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Не вказано</option>
                      <option value="single">Неодружений/неодружена</option>
                      <option value="married">Одружений/одружена</option>
                      <option value="relationship">У стосунках</option>
                      <option value="divorced">Розлучений/розлучена</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Кількість дітей
                    </label>
                    <input
                      type="number"
                      name="childrenCount"
                      min="0"
                      max="20"
                      value={formData.childrenCount}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Склад сім'ї
                  </label>
                  <textarea
                    name="familyComposition"
                    rows={2}
                    value={formData.familyComposition}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    placeholder="Наприклад: дружина, двоє дітей, батьки..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Про себе
                  </label>
                  <textarea
                    name="bio"
                    rows={4}
                    value={formData.bio}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    placeholder="Розкажіть трохи про себе..."
                  />
                </div>
              </div>
            )}

            {/* Location Tab */}
            {activeTab === 'location' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Місто *
                    </label>
                    <select
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Оберіть місто</option>
                      {cities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Область
                    </label>
                    <input
                      type="text"
                      name="region"
                      value={formData.region}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Тип житла
                    </label>
                    <select
                      name="housingType"
                      value={formData.housingType}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Не вказано</option>
                      <option value="house">Будинок</option>
                      <option value="apartment">Квартира</option>
                      <option value="other">Інше</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Проживання
                    </label>
                    <select
                      name="livingSituation"
                      value={formData.livingSituation}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Не вказано</option>
                      <option value="alone">Самостійно</option>
                      <option value="family">З родиною</option>
                      <option value="roommates">З співмешканцями</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Чи є автомобіль?
                    </label>
                    <select
                      name="hasCar"
                      value={formData.hasCar}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Не вказано</option>
                      <option value="yes">Так</option>
                      <option value="no">Ні</option>
                    </select>
                  </div>

                  {formData.hasCar === 'yes' && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Марка, модель авто
                      </label>
                      <input
                        type="text"
                        name="carInfo"
                        value={formData.carInfo}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  )}

                  <div className={formData.hasCar === 'yes' ? '' : 'md:col-span-2'}>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Інший транспорт
                    </label>
                    <input
                      type="text"
                      name="otherTransport"
                      value={formData.otherTransport}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Велосипед, самокат..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Чи є домашні тварини?
                    </label>
                    <select
                      name="hasPets"
                      value={formData.hasPets}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Не вказано</option>
                      <option value="yes">Так</option>
                      <option value="no">Ні</option>
                    </select>
                  </div>

                  {formData.hasPets === 'yes' && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Які тварини?
                      </label>
                      <input
                        type="text"
                        name="petsInfo"
                        value={formData.petsInfo}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Work Tab */}
            {activeTab === 'work' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Професія / Спеціальність
                    </label>
                    <input
                      type="text"
                      name="profession"
                      value={formData.profession}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Поточний статус
                    </label>
                    <select
                      name="employmentStatus"
                      value={formData.employmentStatus}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Не вказано</option>
                      <option value="employed">Працюю</option>
                      <option value="unemployed">Тимчасово не працюю</option>
                      <option value="looking">У пошуку роботи</option>
                      <option value="student">Студент</option>
                      <option value="retired">Пенсіонер</option>
                      <option value="business">Приватний бізнес</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Місце роботи / Вид діяльності
                    </label>
                    <input
                      type="text"
                      name="workplace"
                      value={formData.workplace}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Освіта
                  </label>
                  <textarea
                    name="education"
                    rows={2}
                    value={formData.education}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                </div>

                {formData.employmentStatus === 'business' && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Інформація про приватний бізнес
                    </label>
                    <textarea
                      name="privateBusinessInfo"
                      rows={2}
                      value={formData.privateBusinessInfo}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    />
                  </div>
                )}

                {(formData.employmentStatus === 'looking' || formData.employmentStatus === 'unemployed') && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      У якій сфері шукаєте роботу?
                    </label>
                    <textarea
                      name="jobSeeking"
                      rows={2}
                      value={formData.jobSeeking}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Interests Tab */}
            {activeTab === 'interests' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Хобі / Захоплення
                  </label>
                  <textarea
                    name="hobbies"
                    rows={2}
                    value={formData.hobbies}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Охота, рибалка, активний відпочинок
                  </label>
                  <textarea
                    name="outdoorActivities"
                    rows={2}
                    value={formData.outdoorActivities}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Спортивна активність
                  </label>
                  <textarea
                    name="sports"
                    rows={2}
                    value={formData.sports}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Стиль життя
                  </label>
                  <textarea
                    name="lifestyle"
                    rows={2}
                    value={formData.lifestyle}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            )}

            {/* Social Tab */}
            {activeTab === 'social' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Instagram
                  </label>
                  <input
                    type="url"
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="https://instagram.com/username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Facebook
                  </label>
                  <input
                    type="url"
                    name="facebook"
                    value={formData.facebook}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="https://facebook.com/username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Telegram
                  </label>
                  <input
                    type="text"
                    name="telegram"
                    value={formData.telegram}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="@username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    TikTok
                  </label>
                  <input
                    type="url"
                    name="tiktok"
                    value={formData.tiktok}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="https://tiktok.com/@username"
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8 pt-6 border-t border-neutral-200">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Зберігаємо...' : 'Зберегти зміни'}
              </button>
              <button
                type="button"
                onClick={() => router.push(`/profile/${user.id}`)}
                disabled={loading}
                className="px-6 py-3 border border-neutral-300 rounded-lg font-medium text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50"
              >
                Скасувати
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
