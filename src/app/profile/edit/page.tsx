'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, GraduationCap, Briefcase, Home, Car, Heart, Target, Camera } from 'lucide-react';

export default function EditProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string>('');
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    // 1-4: Основні дані
    firstName: '',
    middleName: '',
    lastName: '',
    phone: '',
    email: '',
    city: '',
    
    // 5-6: Освіта
    educationLevel: '',
    educationDetails: '',
    
    // 6-7: Участь в УЦМ
    ucmMember: '',
    ucmSupporter: '',
    
    // 8: Працевлаштування
    employmentStatus: '',
    workplace: '',
    profession: '',
    seekingPartTime: false,
    seekingFullTime: false,
    seekingSpecialty: '',
    wantsStartBusiness: '',
    
    // Для підприємців
    businessType: '',
    fopGroup: '',
    tovType: '',
    companyCode: '',
    businessCategory: '',
    offerType: '',
    
    // 9: Використання бізнес-послуг
    usesBusinessServices: [] as string[],
    readyToSwitchToUCM: '',
    
    // 9: Останні місця роботи
    workHistory: '',
    
    // 10-12: Сімейний стан та діти
    gender: '',
    maritalStatus: '',
    hasChildren: '',
    childrenCount: '',
    childrenAges: [] as string[],
    
    // 13: Домашні тварини
    hasPets: '',
    petsInfo: '',
    
    // 14: Проживання
    housingType: '',
    housingDetails: [] as string[],
    
    // 15: Використання побутових послуг
    usesHomeServices: [] as string[],
    
    // 16: Автомобіль
    hasCar: '',
    carInfo: '',
    usesTaxi: false,
    carServices: [] as string[],
    
    // 17: Велосипед/Самокат
    hasBicycle: '',
    bicycleInfo: '',
    
    // 18-20: Доставка та їжа
    usesDelivery: '',
    restaurantFrequency: '',
    cuisinePreference: '',
    
    // 21: Активний відпочинок
    outdoorActivities: '',
    
    // 22: Спорт
    sports: '',
    
    // 23: Салони краси
    beautyServices: [] as string[],
    
    // 24: Мета використання сайту
    siteUsageGoal: [] as string[],
    
    // Соцмережі
    instagram: '',
    facebook: '',
    telegram: '',
    tiktok: '',
    
    // Опис (для базового)
    bio: '',
  });
  
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const cities = [
    'Київ', 'Харків', 'Одеса', 'Дніпро', 'Донецьк', 'Запоріжжя', 
    'Львів', 'Кривий Ріг', 'Миколаїв', 'Маріуполь', 'Вінниця', 
    'Макіївка', 'Херсон', 'Чернігів', 'Полтава', 'Черкаси', 
    'Хмельницький', 'Житомир', 'Суми', 'Рівне', 'Горлівка',
    'Кам\'янське', 'Кропивницький', 'Івано-Франківськ', 'Кременчук',
    'Тернопіль', 'Луцьк', 'Біла Церква', 'Краматорськ', 'Мелітополь'
  ];

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

    loadProfile(userData.id, storedToken);
  }, [router]);

  const loadProfile = async (userId: number, authToken: string) => {
    try {
      const response = await fetch(`/api/profile/${userId}`);
      const data = await response.json();
      
      if (data.user) {
        const u = data.user;
        const socialLinks = u.socialLinks || {};
        
        const toArray = (val: any): string[] => {
          if (!val) return [];
          if (Array.isArray(val)) return val;
          if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
          return [];
        };
        
        setFormData({
          firstName: u.firstName || '',
          middleName: u.middleName || '',
          lastName: u.lastName || '',
          phone: u.phone || '',
          email: u.email || '',
          city: u.city || '',
          
          educationLevel: u.educationLevel || '',
          educationDetails: u.educationDetails || '',
          
          ucmMember: u.ucmMember || '',
          ucmSupporter: u.ucmSupporter || '',
          
          employmentStatus: u.employmentStatus || '',
          workplace: u.workplace || '',
          profession: u.profession || '',
          seekingPartTime: u.seekingPartTime === true,
          seekingFullTime: u.seekingFullTime === true,
          seekingSpecialty: u.seekingSpecialty || '',
          wantsStartBusiness: u.wantsStartBusiness || '',
          
          businessType: u.businessType || '',
          fopGroup: u.fopGroup || '',
          tovType: u.tovType || '',
          companyCode: u.companyCode || '',
          businessCategory: u.businessCategory || '',
          offerType: u.offerType || '',
          
          usesBusinessServices: toArray(u.usesBusinessServices),
          readyToSwitchToUCM: u.readyToSwitchToUCM || '',
          
          workHistory: u.workHistory || '',
          
          gender: u.gender || '',
          maritalStatus: u.maritalStatus || '',
          hasChildren: u.hasChildren || '',
          childrenCount: u.childrenCount?.toString() || '',
          childrenAges: toArray(u.childrenAges),
          
          hasPets: u.hasPets || '',
          petsInfo: u.petsInfo || '',
          
          housingType: u.housingType || '',
          housingDetails: toArray(u.housingDetails),
          
          usesHomeServices: toArray(u.usesHomeServices),
          
          hasCar: u.hasCar || '',
          carInfo: u.carInfo || '',
          usesTaxi: u.usesTaxi === true,
          carServices: toArray(u.carServices),
          
          hasBicycle: u.hasBicycle || '',
          bicycleInfo: u.bicycleInfo || '',
          
          usesDelivery: u.usesDelivery || '',
          restaurantFrequency: u.restaurantFrequency || '',
          cuisinePreference: u.cuisinePreference || '',
          
          outdoorActivities: u.outdoorActivities || '',
          
          sports: u.sports || '',
          
          beautyServices: toArray(u.beautyServices),
          
          siteUsageGoal: toArray(u.siteUsageGoal),
          
          instagram: socialLinks.instagram || '',
          facebook: socialLinks.facebook || '',
          telegram: socialLinks.telegram || '',
          tiktok: socialLinks.tiktok || '',
          
          bio: u.bio || '',
        });
      }
    } catch (err) {
      console.error('Помилка завантаження профілю:', err);
      setError('Помилка завантаження даних профілю');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleCheckboxGroup = (field: keyof typeof formData, value: string) => {
    const currentValues = formData[field] as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    setFormData({ ...formData, [field]: newValues });
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

    const uploadFormData = new FormData();
    uploadFormData.append('file', avatarFile);
    uploadFormData.append('type', 'avatars');

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: uploadFormData,
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
      
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar();
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        }
      }

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
        email: formData.email || null,
        city: formData.city,
        avatarUrl: avatarUrl || null,
        
        educationLevel: formData.educationLevel || null,
        educationDetails: formData.educationDetails || null,
        
        ucmMember: formData.ucmMember || null,
        ucmSupporter: formData.ucmSupporter || null,
        
        gender: formData.gender || null,
        employmentStatus: formData.employmentStatus || null,
        workplace: formData.workplace || null,
        profession: formData.profession || null,
        
        seekingPartTime: formData.seekingPartTime || null,
        seekingFullTime: formData.seekingFullTime || null,
        seekingSpecialty: formData.seekingSpecialty || null,
        wantsStartBusiness: formData.wantsStartBusiness || null,
        
        businessType: formData.businessType || null,
        fopGroup: formData.fopGroup || null,
        tovType: formData.tovType || null,
        companyCode: formData.companyCode || null,
        businessCategory: formData.businessCategory || null,
        offerType: formData.offerType || null,
        
        usesBusinessServices: formData.usesBusinessServices.length > 0 ? formData.usesBusinessServices : null,
        readyToSwitchToUCM: formData.readyToSwitchToUCM || null,
        
        workHistory: formData.workHistory || null,
        
        maritalStatus: formData.maritalStatus || null,
        hasChildren: formData.hasChildren || null,
        childrenCount: formData.childrenCount ? parseInt(formData.childrenCount) : null,
        childrenAges: formData.childrenAges.length > 0 ? formData.childrenAges : null,
        
        hasPets: formData.hasPets || null,
        petsInfo: formData.petsInfo || null,
        
        housingType: formData.housingType || null,
        housingDetails: formData.housingDetails.length > 0 ? formData.housingDetails : null,
        
        usesHomeServices: formData.usesHomeServices.length > 0 ? formData.usesHomeServices : null,
        
        hasCar: formData.hasCar || null,
        carInfo: formData.carInfo || null,
        usesTaxi: formData.usesTaxi || null,
        carServices: formData.carServices.length > 0 ? formData.carServices : null,
        
        hasBicycle: formData.hasBicycle || null,
        bicycleInfo: formData.bicycleInfo || null,
        
        usesDelivery: formData.usesDelivery || null,
        restaurantFrequency: formData.restaurantFrequency || null,
        cuisinePreference: formData.cuisinePreference || null,
        
        outdoorActivities: formData.outdoorActivities || null,
        
        sports: formData.sports || null,
        
        beautyServices: formData.beautyServices.length > 0 ? formData.beautyServices : null,
        
        siteUsageGoal: formData.siteUsageGoal.length > 0 ? formData.siteUsageGoal : null,
        
        bio: formData.bio || null,
        
        socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : null,
      };

      const response = await fetch(`/api/profile/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Помилка збереження');
      }

      setSuccess('Профіль успішно оновлено!');
      
      setTimeout(() => {
        router.push(`/profile/${user.id}`);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Помилка збереження');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-neutral-600">Завантаження...</div>
      </div>
    );
  }

  const isExtended = user.accountType === 'extended';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4 md:py-8 px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl md:rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 md:px-8 py-4 md:py-6">
            <h1 className="text-xl md:text-3xl font-bold text-white">
              👤 Редагувати профіль
            </h1>
            <p className="text-blue-100 mt-1 md:mt-2 text-sm md:text-base">
              {isExtended ? 'Заповніть детальну анкету' : 'Оновіть свою інформацію'}
            </p>
          </div>

          {/* Avatar Upload */}
          <div className="px-4 md:px-8 py-4 md:py-6 border-b border-neutral-200">
            <div className="flex items-center space-x-4 md:space-x-6">
              <div className="relative flex-shrink-0">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-4 border-blue-200"
                  />
                ) : (
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-blue-500 flex items-center justify-center border-4 border-blue-200">
                    <User className="w-10 h-10 md:w-12 md:h-12 text-white" />
                  </div>
                )}
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:bg-neutral-50 transition-colors border-2 border-blue-500 touch-manipulation"
                >
                  <Camera className="w-4 h-4 text-blue-600" />
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
                  PNG, JPG або HEIC. Макс 10MB
                </p>
                {avatarFile && (
                  <p className="text-xs md:text-sm text-blue-600 mt-1 truncate">
                    ✓ Нове фото: {avatarFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tabs - показувати тільки для extended */}
          {isExtended && (
            <div className="border-b border-neutral-200 overflow-x-auto">
              <div className="px-4 md:px-8">
                <div className="flex space-x-2 md:space-x-6 min-w-max">
                  <button
                    type="button"
                    onClick={() => setActiveTab('basic')}
                    className={`py-3 md:py-4 px-2 md:px-0 border-b-2 transition-colors whitespace-nowrap text-xs md:text-base touch-manipulation ${
                      activeTab === 'basic'
                        ? 'border-blue-500 text-blue-600 font-medium'
                        : 'border-transparent text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <User className="w-4 h-4 inline mr-1" />
                    Основні дані
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('education')}
                    className={`py-3 md:py-4 px-2 md:px-0 border-b-2 transition-colors whitespace-nowrap text-xs md:text-base touch-manipulation ${
                      activeTab === 'education'
                        ? 'border-blue-500 text-blue-600 font-medium'
                        : 'border-transparent text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4 inline mr-1" />
                    Освіта та УЦМ
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('work')}
                    className={`py-3 md:py-4 px-2 md:px-0 border-b-2 transition-colors whitespace-nowrap text-xs md:text-base touch-manipulation ${
                      activeTab === 'work'
                        ? 'border-blue-500 text-blue-600 font-medium'
                        : 'border-transparent text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <Briefcase className="w-4 h-4 inline mr-1" />
                    Робота та бізнес
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('family')}
                    className={`py-3 md:py-4 px-2 md:px-0 border-b-2 transition-colors whitespace-nowrap text-xs md:text-base touch-manipulation ${
                      activeTab === 'family'
                        ? 'border-blue-500 text-blue-600 font-medium'
                        : 'border-transparent text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <Home className="w-4 h-4 inline mr-1" />
                    Сім'я та побут
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('transport')}
                    className={`py-3 md:py-4 px-2 md:px-0 border-b-2 transition-colors whitespace-nowrap text-xs md:text-base touch-manipulation ${
                      activeTab === 'transport'
                        ? 'border-blue-500 text-blue-600 font-medium'
                        : 'border-transparent text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <Car className="w-4 h-4 inline mr-1" />
                    Транспорт
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('lifestyle')}
                    className={`py-3 md:py-4 px-2 md:px-0 border-b-2 transition-colors whitespace-nowrap text-xs md:text-base touch-manipulation ${
                      activeTab === 'lifestyle'
                        ? 'border-blue-500 text-blue-600 font-medium'
                        : 'border-transparent text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <Heart className="w-4 h-4 inline mr-1" />
                    Стиль життя
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('goal')}
                    className={`py-3 md:py-4 px-2 md:px-0 border-b-2 transition-colors whitespace-nowrap text-xs md:text-base touch-manipulation ${
                      activeTab === 'goal'
                        ? 'border-blue-500 text-blue-600 font-medium'
                        : 'border-transparent text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <Target className="w-4 h-4 inline mr-1" />
                    Мета
                  </button>
                </div>
              </div>
            </div>
          )}

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
            
            {/* Basic Tab - ЗАВЖДИ для базового, або перший таб для extended */}
            {(!isExtended || activeTab === 'basic') && (
              <div className="space-y-6">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">
                  1-4. Основні дані
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
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
                      className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
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
                      className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      2. Номер телефону *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                      placeholder="+380 XX XXX XX XX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      3. Електронна пошта
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    4. Об. Місто проживання *
                  </label>
                  <select
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  >
                    <option value="">Оберіть місто</option>
                    {cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                {!isExtended && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Про себе
                      </label>
                      <textarea
                        name="bio"
                        rows={4}
                        value={formData.bio}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-base"
                        placeholder="Розкажіть трохи про себе..."
                      />
                    </div>

                    <div className="pt-4">
                      <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">
                        📱 Соціальні мережі
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Instagram
                          </label>
                          <input
                            type="text"
                            name="instagram"
                            value={formData.instagram}
                            onChange={handleChange}
                            className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                            placeholder="@username"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Facebook
                          </label>
                          <input
                            type="text"
                            name="facebook"
                            value={formData.facebook}
                            onChange={handleChange}
                            className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
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
                            className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                            placeholder="@username"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            TikTok
                          </label>
                          <input
                            type="text"
                            name="tiktok"
                            value={formData.tiktok}
                            onChange={handleChange}
                            className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                            placeholder="@username"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Education Tab - 5-7: Освіта та УЦМ */}
            {isExtended && activeTab === 'education' && (
              <div className="space-y-6">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">
                  5-7. Освіта та участь в УЦМ
                </h2>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    5. Освіта *
                  </label>
                  <select
                    name="educationLevel"
                    value={formData.educationLevel}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  >
                    <option value="">Оберіть рівень</option>
                    <option value="middle">Середня</option>
                    <option value="bachelor">Бакалавр</option>
                    <option value="master">Магістр</option>
                    <option value="college">Коледж</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Інститут та напрямок
                  </label>
                  <textarea
                    name="educationDetails"
                    rows={2}
                    value={formData.educationDetails}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-base"
                    placeholder="Назва навчального закладу та спеціальність"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    6. Учасник команди УЦМ
                  </label>
                  <select
                    name="ucmMember"
                    value={formData.ucmMember}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  >
                    <option value="">Оберіть</option>
                    <option value="yes">Так</option>
                    <option value="no">Ні</option>
                    <option value="planning">Планую стати</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    7. Підтримуєш проєкти УЦМ
                  </label>
                  <select
                    name="ucmSupporter"
                    value={formData.ucmSupporter}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  >
                    <option value="">Оберіть</option>
                    <option value="yes">Так</option>
                    <option value="no">Ні</option>
                    <option value="planning">Планую</option>
                  </select>
                </div>
              </div>
            )}

            {/* Work Tab - 8-9: Робота та бізнес */}
            {isExtended && activeTab === 'work' && (
              <div className="space-y-6">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">
                  8. Працевлаштування
                </h2>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Працюєш
                  </label>
                  <select
                    name="employmentStatus"
                    value={formData.employmentStatus}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  >
                    <option value="">Оберіть</option>
                    <option value="employed">Так</option>
                    <option value="unemployed">Ні</option>
                    <option value="business_owner">Власник бізнесу</option>
                    <option value="self_employed">Сам на себе</option>
                    <option value="job_seeking">В пошуку роботи</option>
                  </select>
                </div>

                {formData.employmentStatus === 'job_seeking' && (
                  <div className="bg-blue-50 p-4 rounded-lg space-y-4">
                    <h3 className="font-semibold text-gray-900">💁 Якщо в пошуку роботи:</h3>
                    
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="seekingPartTime"
                          checked={formData.seekingPartTime}
                          onChange={handleChange}
                          className="w-5 h-5 text-blue-600"
                        />
                        <span>1) Часткова зайнятість</span>
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="seekingFullTime"
                          checked={formData.seekingFullTime}
                          onChange={handleChange}
                          className="w-5 h-5 text-blue-600"
                        />
                        <span>2) Повноцінна робота</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Спеціальності
                      </label>
                      <input
                        type="text"
                        name="seekingSpecialty"
                        value={formData.seekingSpecialty}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Маєш бажання відкрити свою справу / Запропонувати бізнес проєкт УЦМ?
                      </label>
                      <select
                        name="wantsStartBusiness"
                        value={formData.wantsStartBusiness}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                      >
                        <option value="">Оберіть</option>
                        <option value="yes">Так</option>
                        <option value="no">Ні</option>
                        <option value="considering">Розглядаю варіанти</option>
                      </select>
                    </div>
                  </div>
                )}

                {(formData.employmentStatus === 'business_owner' || formData.employmentStatus === 'self_employed') && (
                  <div className="bg-green-50 p-4 rounded-lg space-y-4">
                    <h3 className="font-semibold text-gray-900">💁 Якщо підприємець:</h3>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Тип бізнесу
                      </label>
                      <select
                        name="businessType"
                        value={formData.businessType}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                      >
                        <option value="">Оберіть</option>
                        <option value="fop">ФОП</option>
                        <option value="tov">ТОВ</option>
                      </select>
                    </div>

                    {formData.businessType === 'fop' && (
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Група ФОП
                        </label>
                        <select
                          name="fopGroup"
                          value={formData.fopGroup}
                          onChange={handleChange}
                          className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                        >
                          <option value="">Оберіть</option>
                          <option value="1">Група 1</option>
                          <option value="2">Група 2</option>
                          <option value="3">Група 3</option>
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Що продаєте чи покупаєте
                      </label>
                      <select
                        name="offerType"
                        value={formData.offerType}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                      >
                        <option value="">Оберіть</option>
                        <option value="service">Послугу</option>
                        <option value="product">Товар</option>
                        <option value="both">Послуги та товари</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Категорія діяльності
                      </label>
                      <select
                        name="businessCategory"
                        value={formData.businessCategory}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                      >
                        <option value="">Оберіть категорію</option>
                        <option value="education">Освіта</option>
                        <option value="products">Продукти харчування</option>
                        <option value="advertising">Реклама та маркетинг</option>
                        <option value="online_sales">Інтернет-продажі</option>
                        <option value="offline_sales">Офлайн-торгівля</option>
                        <option value="auto_service">СТО та автосервіс</option>
                        <option value="construction">Будівництво та ремонт</option>
                        <option value="it">IT та розробка</option>
                        <option value="other">Інше</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Код ЄДРПОУ (для перевірки КВЕД)
                      </label>
                      <input
                        type="text"
                        name="companyCode"
                        value={formData.companyCode}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                        placeholder="12345678"
                      />
                    </div>
                  </div>
                )}

                <div className="bg-purple-50 p-4 rounded-lg space-y-4">
                  <h3 className="font-semibold text-gray-900">💁 Користуєтеся послугами:</h3>
                  <div className="space-y-2">
                    {['Бухгалтер', 'Юрист', 'СММ', 'Рекламщик', 'Спеціаліст в написанні сайтів', 'Не користувався'].map(service => (
                      <label key={service} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.usesBusinessServices.includes(service)}
                          onChange={() => handleCheckboxGroup('usesBusinessServices', service)}
                          className="w-5 h-5 text-blue-600"
                        />
                        <span>{service}</span>
                      </label>
                    ))}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Готовий перейти на спеціалістів з УЦМ?
                    </label>
                    <select
                      name="readyToSwitchToUCM"
                      value={formData.readyToSwitchToUCM}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    >
                      <option value="">Оберіть</option>
                      <option value="yes">Так</option>
                      <option value="no">Ні</option>
                      <option value="considering">Розглядаю</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    9. Останні 2-3 місця роботи
                  </label>
                  <textarea
                    name="workHistory"
                    rows={4}
                    value={formData.workHistory}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-base"
                    placeholder="Назва компанії, посада, період роботи, соц мережі компанії..."
                  />
                </div>
              </div>
            )}

            {/* Family Tab - 10-15: Сім'я та побут */}
            {isExtended && activeTab === 'family' && (
              <div className="space-y-6">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">
                  10-15. Сім'я та побут
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      10. Стать
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    >
                      <option value="">Оберіть</option>
                      <option value="male">Чоловік</option>
                      <option value="female">Жінка</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      11. Сімейний стан
                    </label>
                    <select
                      name="maritalStatus"
                      value={formData.maritalStatus}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    >
                      <option value="">Оберіть</option>
                      <option value="single">Одружений/Заміжня</option>
                      <option value="searching">В пошуку</option>
                      <option value="civil">Цивільний шлюб</option>
                      <option value="divorced">В розводі</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    12. Діти
                  </label>
                  <select
                    name="hasChildren"
                    value={formData.hasChildren}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  >
                    <option value="">Оберіть</option>
                    <option value="yes">Так</option>
                    <option value="no">Ні</option>
                  </select>
                </div>

                {formData.hasChildren === 'yes' && (
                  <div className="bg-blue-50 p-4 rounded-lg space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Кількість дітей
                      </label>
                      <select
                        name="childrenCount"
                        value={formData.childrenCount}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                      >
                        <option value="">Оберіть</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="more">Більше</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Вік дітей (для садка, школи, розвивайок)
                      </label>
                      <div className="space-y-2">
                        {['від 0 до 2', 'від 2 до 5', 'від 6 до 10', 'від 10 до 14', 'від 14 до 18'].map(age => (
                          <label key={age} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.childrenAges.includes(age)}
                              onChange={() => handleCheckboxGroup('childrenAges', age)}
                              className="w-5 h-5 text-blue-600"
                            />
                            <span>{age}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    13. Домашні тварини
                  </label>
                  <select
                    name="hasPets"
                    value={formData.hasPets}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  >
                    <option value="">Оберіть</option>
                    <option value="no">Ні</option>
                    <option value="cat">Кіт</option>
                    <option value="dog">Пес</option>
                    <option value="farm">Сільськогосподарські тварини</option>
                    <option value="other">Інше</option>
                  </select>
                </div>

                {formData.hasPets && formData.hasPets !== 'no' && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Деталі (хто саме)
                    </label>
                    <input
                      type="text"
                      name="petsInfo"
                      value={formData.petsInfo}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                      placeholder="Опишіть ваших тварин"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    14. Проживання
                  </label>
                  <select
                    name="housingType"
                    value={formData.housingType}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  >
                    <option value="">Оберіть</option>
                    <option value="house">Дім</option>
                    <option value="apartment">Квартира</option>
                    <option value="ground_apartment">Квартира на землі</option>
                  </select>
                </div>

                {formData.housingType === 'house' && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Деталі для дому
                    </label>
                    <div className="space-y-2">
                      {['Гараж', 'Двір', 'Сад', 'Ландшафт/Газон'].map(detail => (
                        <label key={detail} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.housingDetails.includes(detail)}
                            onChange={() => handleCheckboxGroup('housingDetails', detail)}
                            className="w-5 h-5 text-blue-600"
                          />
                          <span>{detail}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    15. Користуєшся послугами
                  </label>
                  <div className="space-y-2">
                    {['Електрика', 'Сантехніка', 'Клінінг', 'Будівельник', 'Садовник'].map(service => (
                      <label key={service} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.usesHomeServices.includes(service)}
                          onChange={() => handleCheckboxGroup('usesHomeServices', service)}
                          className="w-5 h-5 text-blue-600"
                        />
                        <span>{service}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Transport Tab - 16-17: Транспорт */}
            {isExtended && activeTab === 'transport' && (
              <div className="space-y-6">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">
                  16-17. Транспорт
                </h2>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    16. Автомобіль
                  </label>
                  <select
                    name="hasCar"
                    value={formData.hasCar}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  >
                    <option value="">Оберіть</option>
                    <option value="yes">Так</option>
                    <option value="no">Ні</option>
                  </select>
                </div>

                {formData.hasCar === 'no' && (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="usesTaxi"
                      checked={formData.usesTaxi}
                      onChange={handleChange}
                      className="w-5 h-5 text-blue-600"
                    />
                    <span>Користуюсь таксі</span>
                  </label>
                )}

                {formData.hasCar === 'yes' && (
                  <div className="bg-blue-50 p-4 rounded-lg space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Марка та рік
                      </label>
                      <input
                        type="text"
                        name="carInfo"
                        value={formData.carInfo}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                        placeholder="Toyota Camry 2020"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        💁 Відвідую:
                      </label>
                      <div className="space-y-2">
                        {['СТО', 'Мийку', 'Автосалони'].map(service => (
                          <label key={service} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.carServices.includes(service)}
                              onChange={() => handleCheckboxGroup('carServices', service)}
                              className="w-5 h-5 text-blue-600"
                            />
                            <span>{service}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    17. Велосипед/Самокат
                  </label>
                  <select
                    name="hasBicycle"
                    value={formData.hasBicycle}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  >
                    <option value="">Оберіть</option>
                    <option value="yes">Так</option>
                    <option value="no">Ні</option>
                  </select>
                </div>

                {formData.hasBicycle === 'yes' && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Що саме та марка
                    </label>
                    <input
                      type="text"
                      name="bicycleInfo"
                      value={formData.bicycleInfo}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                      placeholder="Велосипед Giant 2021"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Lifestyle Tab - 18-23: Стиль життя */}
            {isExtended && activeTab === 'lifestyle' && (
              <div className="space-y-6">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">
                  18-23. Стиль життя та інтереси
                </h2>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    18. Як відносишся до інтернет замовлень - доставок їди та товарів?
                  </label>
                  <select
                    name="usesDelivery"
                    value={formData.usesDelivery}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  >
                    <option value="">Оберіть</option>
                    <option value="use">Користуюсь</option>
                    <option value="want_to_try">Не пробував, але хотів би</option>
                    <option value="not_interested">Не цікаво</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    19. Полюбляєте ходити по кафе та ресторани?
                  </label>
                  <select
                    name="restaurantFrequency"
                    value={formData.restaurantFrequency}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  >
                    <option value="">Оберіть</option>
                    <option value="rarely">Рідко</option>
                    <option value="sometimes">По бажанню</option>
                    <option value="often">Часто</option>
                    <option value="never">Не хожу</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    20. Яку кухню полюбляєш
                  </label>
                  <select
                    name="cuisinePreference"
                    value={formData.cuisinePreference}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  >
                    <option value="">Оберіть</option>
                    <option value="home">Домашню</option>
                    <option value="chinese">Китайську</option>
                    <option value="european">Європейську</option>
                    <option value="street">Звичайні вуличні (шаурма, хот-доги)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    21. Активний відпочинок
                  </label>
                  <textarea
                    name="outdoorActivities"
                    rows={2}
                    value={formData.outdoorActivities}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-base"
                    placeholder="Охота / Рибалка / Природа та інше..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    22. Відношення до спорту
                  </label>
                  <select
                    name="sports"
                    value={formData.sports}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  >
                    <option value="">Оберіть</option>
                    <option value="professional">Професійно</option>
                    <option value="gym_alone">Спортзал самостійно</option>
                    <option value="gym_trainer">Спортзал з тренером</option>
                    <option value="sport_walks">Прогулянки спортивні</option>
                    <option value="not_interested">Не цікаво</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    23. Відношення до салонів краси
                  </label>
                  <div className="space-y-2">
                    {['Перукар', 'Манікюр-педікюр', 'СПА процедури', 'Масажі', 'Не цікаво'].map(service => (
                      <label key={service} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.beautyServices.includes(service)}
                          onChange={() => handleCheckboxGroup('beautyServices', service)}
                          className="w-5 h-5 text-blue-600"
                        />
                        <span>{service}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Goal Tab - 24: Мета використання сайту */}
            {isExtended && activeTab === 'goal' && (
              <div className="space-y-6">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">
                  24. Користуюся сайтом щоб...
                </h2>

                <div className="space-y-3">
                  {[
                    { value: 'ease_life', label: 'Полегшити собі життя' },
                    { value: 'support_team', label: 'Підтримати споживача і підприємця з однієї команди' },
                    { value: 'support_ucm', label: 'Підтримую проєкти УЦМ щоб наша команда розвивалася і укріплялася' }
                  ].map(goal => (
                    <label key={goal.value} className="flex items-start gap-3 p-3 md:p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer touch-manipulation">
                      <input
                        type="checkbox"
                        checked={formData.siteUsageGoal.includes(goal.value)}
                        onChange={() => handleCheckboxGroup('siteUsageGoal', goal.value)}
                        className="w-5 h-5 text-blue-600 mt-0.5 min-w-[20px]"
                      />
                      <span className="text-sm md:text-base">{goal.label}</span>
                    </label>
                  ))}
                </div>

                <div className="pt-4">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">
                    📱 Соціальні мережі
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Instagram
                      </label>
                      <input
                        type="text"
                        name="instagram"
                        value={formData.instagram}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                        placeholder="@username"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Facebook
                      </label>
                      <input
                        type="text"
                        name="facebook"
                        value={formData.facebook}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
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
                        className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                        placeholder="@username"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        TikTok
                      </label>
                      <input
                        type="text"
                        name="tiktok"
                        value={formData.tiktok}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 md:px-4 md:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                        placeholder="@username"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-8 pt-6 border-t border-neutral-200">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation text-base"
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
