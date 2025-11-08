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
  childrenAges: '',
    
    // Місце проживання
    city: '',
    region: '',
    housingType: '',
    livingSituation: '',
  housingDetails: '',
    
    // Транспорт
    hasCar: '',
    carInfo: '',
    otherTransport: '',
  carServices: '',
    
    // Професійна діяльність
    profession: '',
    employmentStatus: '',
    workplace: '',
  educationLevel: '',
  educationDetails: '',
    privateBusinessInfo: '',
    jobSeeking: '',
  seekingPartTime: '',
  seekingFullTime: '',
  wantsStartBusiness: '',
  ucmMember: '',
  ucmSupporter: '',
    
    // Домашні тварини
    hasPets: '',
    petsInfo: '',
    
    // Інтереси
    hobbies: '',
    outdoorActivities: '',
    lifestyle: '',
    sports: '',
    bio: '',
  // Переваги та використання сервісів
  usesDelivery: '',
  restaurantFrequency: '',
  cuisinePreference: '',
  usesServices: '',
  usesBusinessServices: '',
  beautyServices: '',
  readyToSwitchToUCM: '',
    
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
        
        const toListString = (val: any): string => {
          if (!val) return '';
          if (Array.isArray(val)) return val.join(', ');
          if (typeof val === 'object') {
            const entries = Object.entries(val as Record<string, any>)
              .filter(([_, v]) => !!v)
              .map(([k]) => k);
            return entries.length ? entries.join(', ') : Object.keys(val).join(', ');
          }
          if (typeof val === 'string') return val;
          return '';
        };

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
          childrenAges: Array.isArray(u.childrenAges) ? (u.childrenAges as any[]).join(', ') : '',
          
          city: u.city || '',
          region: u.region || '',
          housingType: u.housingType || '',
          livingSituation: u.livingSituation || '',
          housingDetails: u.housingDetails ? JSON.stringify(u.housingDetails) : '',
          
          hasCar: u.hasCar === true ? 'yes' : u.hasCar === false ? 'no' : '',
          carInfo: u.carInfo || '',
          otherTransport: u.otherTransport || '',
          carServices: toListString(u.carServices),
          
          profession: u.profession || '',
          employmentStatus: u.employmentStatus || '',
          workplace: u.workplace || '',
          educationLevel: u.educationLevel || '',
          educationDetails: u.educationDetails || '',
          privateBusinessInfo: u.privateBusinessInfo || '',
          jobSeeking: u.jobSeeking || '',
          seekingPartTime: u.seekingPartTime === true ? 'yes' : u.seekingPartTime === false ? 'no' : '',
          seekingFullTime: u.seekingFullTime === true ? 'yes' : u.seekingFullTime === false ? 'no' : '',
          wantsStartBusiness: u.wantsStartBusiness === true ? 'yes' : u.wantsStartBusiness === false ? 'no' : '',
          ucmMember: u.ucmMember === true ? 'yes' : u.ucmMember === false ? 'no' : '',
          ucmSupporter: u.ucmSupporter === true ? 'yes' : u.ucmSupporter === false ? 'no' : '',
          
          hasPets: u.hasPets === true ? 'yes' : u.hasPets === false ? 'no' : '',
          petsInfo: u.petsInfo || '',
          
          hobbies: u.hobbies || '',
          outdoorActivities: u.outdoorActivities || '',
          lifestyle: u.lifestyle || '',
          sports: u.sports || '',
          bio: u.bio || '',

          usesDelivery: u.usesDelivery === true ? 'yes' : u.usesDelivery === false ? 'no' : '',
          restaurantFrequency: u.restaurantFrequency || '',
          cuisinePreference: u.cuisinePreference || '',
          usesServices: toListString(u.usesServices),
          usesBusinessServices: toListString(u.usesBusinessServices),
          beautyServices: toListString(u.beautyServices),
          readyToSwitchToUCM: u.readyToSwitchToUCM === true ? 'yes' : u.readyToSwitchToUCM === false ? 'no' : '',
          
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
      if (file.size > 10 * 1024 * 1024) {
        setError('Файл занадто великий. Максимум 10MB');
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
  formData.append('type', 'avatars');

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

      const yesNoToBool = (v: string) => v === '' ? null : v === 'yes';
      const toArray = (v: string) => {
        if (!v) return null;
        try {
          // allow JSON input too
          if (v.trim().startsWith('[')) {
            const arr = JSON.parse(v.trim());
            return Array.isArray(arr) ? arr : null;
          }
        } catch {}
        return v.split(',').map(s => s.trim()).filter(Boolean);
      };
      const toChildrenAges = (v: string) => {
        if (!v) return null;
        try {
          if (v.trim().startsWith('[')) {
            const arr = JSON.parse(v.trim());
            return Array.isArray(arr) ? arr : null;
          }
        } catch {}
        return v.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !Number.isNaN(n));
      };

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
        childrenAges: toChildrenAges(formData.childrenAges),
        
        housingType: formData.housingType || null,
        livingSituation: formData.livingSituation || null,
        housingDetails: (() => {
          if (!formData.housingDetails) return null;
          try { return JSON.parse(formData.housingDetails); } catch {}
          return { details: formData.housingDetails };
        })(),
        
        hasCar: formData.hasCar ? formData.hasCar === 'yes' : null,
        carInfo: formData.carInfo || null,
        otherTransport: formData.otherTransport || null,
        carServices: toArray(formData.carServices),
        
        profession: formData.profession || null,
        employmentStatus: formData.employmentStatus || null,
        workplace: formData.workplace || null,
  educationLevel: formData.educationLevel || null,
  educationDetails: formData.educationDetails || null,
        privateBusinessInfo: formData.privateBusinessInfo || null,
        jobSeeking: formData.jobSeeking || null,
        seekingPartTime: yesNoToBool(formData.seekingPartTime),
        seekingFullTime: yesNoToBool(formData.seekingFullTime),
        wantsStartBusiness: yesNoToBool(formData.wantsStartBusiness),
        ucmMember: yesNoToBool(formData.ucmMember),
        ucmSupporter: yesNoToBool(formData.ucmSupporter),
        
        hasPets: formData.hasPets ? formData.hasPets === 'yes' : null,
        petsInfo: formData.petsInfo || null,
        
        hobbies: formData.hobbies || null,
        outdoorActivities: formData.outdoorActivities || null,
        lifestyle: formData.lifestyle || null,
        sports: formData.sports || null,
        bio: formData.bio || null,

        usesDelivery: yesNoToBool(formData.usesDelivery),
        restaurantFrequency: formData.restaurantFrequency || null,
        cuisinePreference: formData.cuisinePreference || null,
        usesServices: toArray(formData.usesServices),
        usesBusinessServices: toArray(formData.usesBusinessServices),
        beautyServices: toArray(formData.beautyServices),
        readyToSwitchToUCM: yesNoToBool(formData.readyToSwitchToUCM),
        
        socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : null,
      };

      console.log('[Edit Profile] Відправка даних:', requestBody);

      const response = await fetch(`/api/profile/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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

  // Определяем доступные вкладки по типу аккаунта
  const getAvailableTabs = () => {
    const tabs = ['basic', 'social']; // Базовые + соцсети доступны всем
    
    if (user?.accountType === 'extended' || user?.accountType === 'business' || user?.accountType === 'business_premium') {
      tabs.splice(1, 0, 'location', 'work', 'interests'); // Вставляем расширенные вкладки
    }
    
    return tabs;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 py-4 md:py-8 px-3 sm:px-4 md:px-6 lg:px-8 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl md:rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-500 to-accent-500 px-4 md:px-8 py-4 md:py-6">
            <h1 className="text-xl md:text-3xl font-bold text-white">Редагувати профіль</h1>
            <p className="text-primary-100 mt-1 md:mt-2 text-sm md:text-base">Дозаповніть або оновіть вашу інформацію</p>
          </div>

          {/* Avatar Upload */}
          <div className="px-4 md:px-8 py-4 md:py-6 border-b border-neutral-200">
            <div className="flex items-center space-x-4 md:space-x-6">
              <div className="relative flex-shrink-0">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-4 border-primary-200"
                  />
                ) : (
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary-500 flex items-center justify-center border-4 border-primary-200">
                    <span className="text-white font-bold text-2xl md:text-3xl">
                      {formData.firstName?.[0]}{formData.lastName?.[0]}
                    </span>
                  </div>
                )}
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:bg-neutral-50 transition-colors border-2 border-primary-500 touch-manipulation"
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
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-neutral-900 text-sm md:text-base">Фото профілю</h3>
                <p className="text-xs md:text-sm text-neutral-600 mt-1">
                  JPG, PNG, GIF або HEIC. Макс 10MB
                </p>
                {avatarFile && (
                  <p className="text-xs md:text-sm text-primary-600 mt-1 truncate">
                    ✓ Нове фото: {avatarFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-neutral-200 overflow-x-auto">
            <div className="px-4 md:px-8">
              <div className="flex space-x-2 md:space-x-8 min-w-max">
                <button
                  type="button"
                  onClick={() => setActiveTab('basic')}
                  className={`py-3 md:py-4 px-3 md:px-0 border-b-2 transition-colors whitespace-nowrap text-sm md:text-base touch-manipulation ${
                    activeTab === 'basic'
                      ? 'border-primary-500 text-primary-600 font-medium'
                      : 'border-transparent text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <User className="w-4 h-4 md:w-5 md:h-5 inline mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Основне</span>
                  <span className="sm:hidden">Основ.</span>
                </button>
                {(user?.accountType === 'extended' || user?.accountType === 'business' || user?.accountType === 'business_premium') && (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveTab('location')}
                      className={`py-3 md:py-4 px-3 md:px-0 border-b-2 transition-colors whitespace-nowrap text-sm md:text-base touch-manipulation ${
                        activeTab === 'location'
                          ? 'border-primary-500 text-primary-600 font-medium'
                          : 'border-transparent text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      <MapPin className="w-4 h-4 md:w-5 md:h-5 inline mr-1 md:mr-2" />
                      <span className="hidden sm:inline">Локація</span>
                      <span className="sm:hidden">Лок.</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('work')}
                      className={`py-3 md:py-4 px-3 md:px-0 border-b-2 transition-colors whitespace-nowrap text-sm md:text-base touch-manipulation ${
                        activeTab === 'work'
                          ? 'border-primary-500 text-primary-600 font-medium'
                          : 'border-transparent text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      <Briefcase className="w-4 h-4 md:w-5 md:h-5 inline mr-1 md:mr-2" />
                      Робота
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('interests')}
                      className={`py-3 md:py-4 px-3 md:px-0 border-b-2 transition-colors whitespace-nowrap text-sm md:text-base touch-manipulation ${
                        activeTab === 'interests'
                          ? 'border-primary-500 text-primary-600 font-medium'
                          : 'border-transparent text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      <Heart className="w-4 h-4 md:w-5 md:h-5 inline mr-1 md:mr-2" />
                      <span className="hidden sm:inline">Інтереси</span>
                      <span className="sm:hidden">Інтер.</span>
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab('social')}
                  className={`py-3 md:py-4 px-3 md:px-0 border-b-2 transition-colors whitespace-nowrap text-sm md:text-base touch-manipulation ${
                    activeTab === 'social'
                      ? 'border-primary-500 text-primary-600 font-medium'
                      : 'border-transparent text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <Globe className="w-4 h-4 md:w-5 md:h-5 inline mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Соцмережі</span>
                  <span className="sm:hidden">Соцм.</span>
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="px-4 md:px-8 pt-4 md:pt-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs md:text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs md:text-sm">
                {success}
              </div>
            )}
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="px-4 md:px-8 py-4 md:py-6">
            {/* Basic Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Ім&apos;я *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
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
                      className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
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
                      className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
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
                      className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
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
                      className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
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
                      className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
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
                      className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
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
                      className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Вік дітей (через кому)
                    </label>
                    <input
                      type="text"
                      name="childrenAges"
                      value={formData.childrenAges}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                      placeholder="наприклад: 4, 7, 12"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Склад сім&apos;ї
                  </label>
                  <textarea
                    name="familyComposition"
                    rows={2}
                    value={formData.familyComposition}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-base"
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
                    className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-base"
                    placeholder="Розкажіть трохи про себе..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Учасник УЦМ
                    </label>
                    <select
                      name="ucmMember"
                      value={formData.ucmMember}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                    >
                      <option value="">Не вказано</option>
                      <option value="yes">Так</option>
                      <option value="no">Ні</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Підтримую проєкти УЦМ
                    </label>
                    <select
                      name="ucmSupporter"
                      value={formData.ucmSupporter}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                    >
                      <option value="">Не вказано</option>
                      <option value="yes">Так</option>
                      <option value="no">Ні</option>
                    </select>
                  </div>
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
                      className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
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
                      className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
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
                      className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
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
                      className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
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
                      className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                    >
                      <option value="">Не вказано</option>
                      <option value="yes">Так</option>
                      <option value="no">Ні</option>
                    </select>
                  </div>

                  {formData.hasCar === 'yes' && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Марка та модель авто <span className="text-neutral-400 font-normal">(без держномера)</span>
                      </label>
                      <input
                        type="text"
                        name="carInfo"
                        value={formData.carInfo}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                        placeholder="Наприклад: Toyota Camry 2020"
                      />
                      <p className="mt-1 text-xs text-neutral-500">Не вказуйте державний номер авто з міркувань конфіденційності.</p>
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
                      className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
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
                      className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
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
                        className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Деталі житла (JSON)
                  </label>
                  <textarea
                    name="housingDetails"
                    rows={3}
                    value={formData.housingDetails}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-base"
                    placeholder='Наприклад: {"garage":true, "garden":true}'
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Авто-сервіси, якими користуюсь (через кому)
                  </label>
                  <input
                    type="text"
                    name="carServices"
                    value={formData.carServices}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                    placeholder="СТО, мийка, шиномонтаж..."
                  />
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
                      className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
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
                      className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                    >
                      <option value="">Не вказано</option>
                      <option value="employed">Працюю</option>
                      <option value="unemployed">Тимчасово не працюю</option>
                      <option value="looking">У пошуку роботи</option>
                      <option value="student">Студент</option>
                      <option value="retired">Пенсіонер</option>
                      <option value="self_employed">Самозайнятий</option>
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
                      className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Рівень освіти</label>
                    <select
                      name="educationLevel"
                      value={formData.educationLevel}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                    >
                      <option value="">Не вказано</option>
                      <option value="secondary">Середня</option>
                      <option value="college">Коледж</option>
                      <option value="bachelor">Бакалавр</option>
                      <option value="master">Магістр</option>
                      <option value="doctorate">Аспірантура</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Заклад та напрямок</label>
                    <input
                      type="text"
                      name="educationDetails"
                      value={formData.educationDetails}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                      placeholder="КНУ ім. Шевченка, Економіка"
                    />
                  </div>
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
                      className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-base"
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
                      className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-base"
                    />
                  </div>
                )}

                {/* Пошук роботи/бізнесу */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Шукаю часткову зайнятість</label>
                    <select
                      name="seekingPartTime"
                      value={formData.seekingPartTime}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                    >
                      <option value="">Не вказано</option>
                      <option value="yes">Так</option>
                      <option value="no">Ні</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Шукаю повну зайнятість</label>
                    <select
                      name="seekingFullTime"
                      value={formData.seekingFullTime}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                    >
                      <option value="">Не вказано</option>
                      <option value="yes">Так</option>
                      <option value="no">Ні</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Хочу почати власну справу</label>
                    <select
                      name="wantsStartBusiness"
                      value={formData.wantsStartBusiness}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                    >
                      <option value="">Не вказано</option>
                      <option value="yes">Так</option>
                      <option value="no">Ні</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Interests Tab */}
            {activeTab === 'interests' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Хобі / Захоплення</label>
                  <textarea
                    name="hobbies"
                    rows={2}
                    value={formData.hobbies}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Охота, рибалка, активний відпочинок</label>
                  <textarea
                    name="outdoorActivities"
                    rows={2}
                    value={formData.outdoorActivities}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Спортивна активність</label>
                  <textarea
                    name="sports"
                    rows={2}
                    value={formData.sports}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Стиль життя</label>
                  <textarea
                    name="lifestyle"
                    rows={2}
                    value={formData.lifestyle}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-base"
                  />
                </div>
                <div className="border-t pt-6 space-y-4">
                  <h3 className="text-lg font-semibold text-neutral-900">Переваги та використання сервісів</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Користуюсь доставкою</label>
                      <select
                        name="usesDelivery"
                        value={formData.usesDelivery}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                      >
                        <option value="">Не вказано</option>
                        <option value="yes">Так</option>
                        <option value="no">Ні</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Частота відвідування ресторанів</label>
                      <select
                        name="restaurantFrequency"
                        value={formData.restaurantFrequency}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                      >
                        <option value="">Не вказано</option>
                        <option value="rare">Рідко</option>
                        <option value="sometimes">По бажанню</option>
                        <option value="often">Часто</option>
                        <option value="never">Не ходжу</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Улюблена кухня</label>
                      <input
                        type="text"
                        name="cuisinePreference"
                        value={formData.cuisinePreference}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                        placeholder="Домашня, Європейська, Азійська..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Побутові сервіси (через кому)</label>
                      <input
                        type="text"
                        name="usesServices"
                        value={formData.usesServices}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                        placeholder="Електрик, Сантехнік, Клінінг..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Бізнес-сервіси (через кому)</label>
                      <input
                        type="text"
                        name="usesBusinessServices"
                        value={formData.usesBusinessServices}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                        placeholder="Бухгалтер, Юрист, СММ..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Beauty / Послуги (через кому)</label>
                      <input
                        type="text"
                        name="beautyServices"
                        value={formData.beautyServices}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                        placeholder="Перукар, Манікюр, СПА, Масаж..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Готовий перейти на учасників</label>
                      <select
                        name="readyToSwitchToUCM"
                        value={formData.readyToSwitchToUCM}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                      >
                        <option value="">Не вказано</option>
                        <option value="yes">Так</option>
                        <option value="no">Ні</option>
                      </select>
                    </div>
                  </div>
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
                    className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
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
                    className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
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
                    className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
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
                    className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                    placeholder="https://tiktok.com/@username"
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-8 pt-6 border-t border-neutral-200">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation text-base"
              >
                {loading ? 'Зберігаємо...' : 'Зберегти зміни'}
              </button>
              <button
                type="button"
                onClick={() => router.push(`/profile/${user.id}`)}
                disabled={loading}
                className="sm:w-auto py-3 px-6 border border-neutral-300 rounded-lg font-medium text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50 touch-manipulation text-base"
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
