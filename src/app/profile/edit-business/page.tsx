'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, User, FileText, Users, Phone, Award, Upload, Camera } from 'lucide-react';

export default function EditBusinessProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string>('');
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    companyName: '',
    representativeName: '',
    position: '',
    city: '',
    businessType: '',
    
    shortDescription: '',
    mission: '',
    uniqueValue: '',
    
    servicesList: '',
    priceRange: '',
    workingHours: '',
    locationDetails: '',
    
    employeeCount: '',
    keySpecialists: '',
    teamDescription: '',
    
    phone: '',
    email: '',
    viber: '',
    telegram: '',
    website: '',
    socialLinks: '',
    
    yearFounded: '',
    registrationType: '',
    hasCertificates: '',
    certificatesInfo: '',
    partnersInfo: '',
    externalReviews: '',
  });
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
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
    
    if (userData.role !== 'business') {
      router.push(`/profile/${userData.id}`);
      return;
    }

    setUser(userData);
    setToken(storedToken);

    loadBusinessInfo(userData.id, storedToken);
  }, [router]);

  const loadBusinessInfo = async (userId: number, authToken: string) => {
    try {
      const response = await fetch(`/api/business-info?userId=${userId}`);
      const data = await response.json();
      
      if (data.businessInfo) {
        const b = data.businessInfo;
        setLogoPreview(b.logoUrl || '');
        
        setFormData({
          companyName: b.companyName || '',
          representativeName: b.representativeName || '',
          position: b.position || '',
          city: b.city || '',
          businessType: b.businessType || '',
          
          shortDescription: b.shortDescription || b.description || '',
          mission: b.mission || '',
          uniqueValue: b.uniqueValue || '',
          
          servicesList: b.servicesList || '',
          priceRange: b.priceRange || '',
          workingHours: b.workingHours || b.workHours || '',
          locationDetails: b.locationDetails || '',
          
          employeeCount: b.employeeCount?.toString() || '',
          keySpecialists: b.keySpecialists || '',
          teamDescription: b.teamDescription || '',
          
          phone: b.phone || '',
          email: b.email || '',
          viber: b.viber || '',
          telegram: b.telegram || '',
          website: b.website || '',
          socialLinks: typeof b.socialLinks === 'string' ? b.socialLinks : JSON.stringify(b.socialLinks || {}, null, 2),
          
          yearFounded: b.yearFounded?.toString() || '',
          registrationType: b.registrationType || '',
          hasCertificates: b.hasCertificates === true ? 'yes' : b.hasCertificates === false ? 'no' : '',
          certificatesInfo: b.certificatesInfo || '',
          partnersInfo: b.partnersInfo || b.partners || '',
          externalReviews: typeof b.externalReviews === 'string' ? b.externalReviews : JSON.stringify(b.externalReviews || {}, null, 2),
        });
      }
    } catch (err) {
      console.error('Error loading business info:', err);
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

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return null;

  const formData = new FormData();
  formData.append('file', logoFile);
  formData.append('type', 'logos');

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
      
      throw new Error(data.error || 'Помилка завантаження лого');
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
      let logoUrl = logoPreview;
      
      if (logoFile) {
        const uploadedUrl = await uploadLogo();
        if (uploadedUrl) {
          logoUrl = uploadedUrl;
        }
      }

      const response = await fetch('/api/business-info', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          companyName: formData.companyName || null,
          representativeName: formData.representativeName || null,
          position: formData.position || null,
          city: formData.city || null,
          businessType: formData.businessType || null,
          logoUrl: logoUrl || null,
          
          shortDescription: formData.shortDescription || null,
          mission: formData.mission || null,
          uniqueValue: formData.uniqueValue || null,
          
          servicesList: formData.servicesList || null,
          priceRange: formData.priceRange || null,
          workingHours: formData.workingHours || null,
          locationDetails: formData.locationDetails || null,
          
          employeeCount: formData.employeeCount ? parseInt(formData.employeeCount) : null,
          keySpecialists: formData.keySpecialists || null,
          teamDescription: formData.teamDescription || null,
          
          phone: formData.phone || null,
          email: formData.email || null,
          viber: formData.viber || null,
          telegram: formData.telegram || null,
          website: formData.website || null,
          socialLinks: formData.socialLinks || null,
          
          yearFounded: formData.yearFounded ? parseInt(formData.yearFounded) : null,
          registrationType: formData.registrationType || null,
          hasCertificates: formData.hasCertificates ? formData.hasCertificates === 'yes' : null,
          certificatesInfo: formData.certificatesInfo || null,
          partners: formData.partnersInfo || null,
          externalReviews: formData.externalReviews || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Помилка збереження');
      }

      setSuccess('Бізнес-профіль успішно оновлено!');
      
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
      <div className="min-h-screen bg-gradient-to-br from-accent-50 to-primary-50 flex items-center justify-center">
        <div className="text-neutral-600">Завантаження...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-50 to-primary-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-accent-500 to-primary-500 px-8 py-6">
            <h1 className="text-3xl font-bold text-white">🏢 Редагувати бізнес-профіль</h1>
            <p className="text-accent-100 mt-2">Оновіть інформацію про вашу компанію</p>
          </div>

          {/* Logo Upload */}
          <div className="px-8 py-6 border-b border-neutral-200">
            <div className="flex items-center space-x-6">
              <div className="relative">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Company logo"
                    className="w-24 h-24 rounded-lg object-contain bg-neutral-100 p-2 border-4 border-accent-200"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-lg bg-accent-500 flex items-center justify-center border-4 border-accent-200">
                    <Building2 className="w-12 h-12 text-white" />
                  </div>
                )}
                <label
                  htmlFor="logo-upload"
                  className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:bg-neutral-50 transition-colors border-2 border-accent-500"
                >
                  <Camera className="w-4 h-4 text-accent-600" />
                </label>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Лого компанії</h3>
                <p className="text-sm text-neutral-600 mt-1">
                  PNG або JPG з прозорим фоном. Максимум 5MB
                </p>
                {logoFile && (
                  <p className="text-sm text-accent-600 mt-1">
                    ✓ Нове лого вибрано: {logoFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-neutral-200">
            <div className="px-8">
              <div className="flex space-x-8 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('basic')}
                  className={`py-4 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'basic'
                      ? 'border-accent-500 text-accent-600 font-medium'
                      : 'border-transparent text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <Building2 className="w-5 h-5 inline mr-2" />
                  Основне
                </button>
                <button
                  onClick={() => setActiveTab('description')}
                  className={`py-4 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'description'
                      ? 'border-accent-500 text-accent-600 font-medium'
                      : 'border-transparent text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <FileText className="w-5 h-5 inline mr-2" />
                  Опис
                </button>
                <button
                  onClick={() => setActiveTab('services')}
                  className={`py-4 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'services'
                      ? 'border-accent-500 text-accent-600 font-medium'
                      : 'border-transparent text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <FileText className="w-5 h-5 inline mr-2" />
                  Послуги
                </button>
                <button
                  onClick={() => setActiveTab('team')}
                  className={`py-4 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'team'
                      ? 'border-accent-500 text-accent-600 font-medium'
                      : 'border-transparent text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <Users className="w-5 h-5 inline mr-2" />
                  Команда
                </button>
                <button
                  onClick={() => setActiveTab('contacts')}
                  className={`py-4 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'contacts'
                      ? 'border-accent-500 text-accent-600 font-medium'
                      : 'border-transparent text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <Phone className="w-5 h-5 inline mr-2" />
                  Контакти
                </button>
                <button
                  onClick={() => setActiveTab('additional')}
                  className={`py-4 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'additional'
                      ? 'border-accent-500 text-accent-600 font-medium'
                      : 'border-transparent text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <Award className="w-5 h-5 inline mr-2" />
                  Додатково
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
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Назва компанії *
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      required
                      value={formData.companyName}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                      placeholder="ТОВ 'Будівельна компанія'"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Представник *
                    </label>
                    <input
                      type="text"
                      name="representativeName"
                      required
                      value={formData.representativeName}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Посада
                    </label>
                    <input
                      type="text"
                      name="position"
                      value={formData.position}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                      placeholder="Директор, Власник..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Місто *
                    </label>
                    <select
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                    >
                      <option value="">Оберіть місто</option>
                      {cities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Тип бізнесу
                    </label>
                    <select
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                    >
                      <option value="">Оберіть тип</option>
                      <option value="Виробництво">Виробництво</option>
                      <option value="Послуги">Послуги</option>
                      <option value="Торгівля">Торгівля</option>
                      <option value="IT">IT</option>
                      <option value="Будівництво">Будівництво</option>
                      <option value="Ремонт">Ремонт</option>
                      <option value="Транспорт">Транспорт</option>
                      <option value="Консалтинг">Консалтинг</option>
                      <option value="Інше">Інше</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Description Tab */}
            {activeTab === 'description' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Короткий опис компанії
                  </label>
                  <textarea
                    name="shortDescription"
                    rows={3}
                    value={formData.shortDescription}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent resize-none"
                    placeholder="Що ви пропонуєте?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Місія компанії
                  </label>
                  <textarea
                    name="mission"
                    rows={3}
                    value={formData.mission}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent resize-none"
                    placeholder="Ваша місія та цілі"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Унікальна цінність
                  </label>
                  <textarea
                    name="uniqueValue"
                    rows={3}
                    value={formData.uniqueValue}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent resize-none"
                    placeholder="Чому клієнти обирають саме вас?"
                  />
                </div>
              </div>
            )}

            {/* Services Tab */}
            {activeTab === 'services' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Перелік послуг/товарів
                  </label>
                  <textarea
                    name="servicesList"
                    rows={5}
                    value={formData.servicesList}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent resize-none"
                    placeholder="- Послуга 1&#10;- Послуга 2&#10;- Послуга 3"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Ціновий діапазон
                    </label>
                    <input
                      type="text"
                      name="priceRange"
                      value={formData.priceRange}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                      placeholder="від 500 до 5000 грн"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Години роботи
                    </label>
                    <input
                      type="text"
                      name="workingHours"
                      value={formData.workingHours}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                      placeholder="Пн-Пт: 9:00-18:00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Деталі локації (адреса, як знайти)
                  </label>
                  <textarea
                    name="locationDetails"
                    rows={2}
                    value={formData.locationDetails}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            )}

            {/* Team Tab */}
            {activeTab === 'team' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Кількість працівників
                  </label>
                  <input
                    type="number"
                    name="employeeCount"
                    min="1"
                    value={formData.employeeCount}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Ключові спеціалісти
                  </label>
                  <textarea
                    name="keySpecialists"
                    rows={3}
                    value={formData.keySpecialists}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent resize-none"
                    placeholder="Хто працює у вашій команді?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Опис команди
                  </label>
                  <textarea
                    name="teamDescription"
                    rows={3}
                    value={formData.teamDescription}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            )}

            {/* Contacts Tab */}
            {activeTab === 'contacts' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Телефон
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                      placeholder="+380 XX XXX XX XX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Viber
                    </label>
                    <input
                      type="tel"
                      name="viber"
                      value={formData.viber}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                      placeholder="+380 XX XXX XX XX"
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
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                      placeholder="@username"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Веб-сайт
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                      placeholder="https://yourcompany.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Соціальні мережі (Facebook, Instagram, тощо)
                  </label>
                  <textarea
                    name="socialLinks"
                    rows={2}
                    value={formData.socialLinks}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            )}

            {/* Additional Tab */}
            {activeTab === 'additional' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Рік заснування
                    </label>
                    <input
                      type="number"
                      name="yearFounded"
                      min="1900"
                      max={new Date().getFullYear()}
                      value={formData.yearFounded}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Тип реєстрації
                    </label>
                    <select
                      name="registrationType"
                      value={formData.registrationType}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                    >
                      <option value="">Оберіть тип</option>
                      <option value="ФОП">ФОП</option>
                      <option value="ТОВ">ТОВ</option>
                      <option value="ПрАТ">ПрАТ</option>
                      <option value="Не зареєстровано">Не зареєстровано</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Чи є сертифікати?
                    </label>
                    <select
                      name="hasCertificates"
                      value={formData.hasCertificates}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                    >
                      <option value="">Не вказано</option>
                      <option value="yes">Так</option>
                      <option value="no">Ні</option>
                    </select>
                  </div>
                </div>

                {formData.hasCertificates === 'yes' && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Інформація про сертифікати
                    </label>
                    <textarea
                      name="certificatesInfo"
                      rows={2}
                      value={formData.certificatesInfo}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent resize-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Партнери та співпраця
                  </label>
                  <textarea
                    name="partnersInfo"
                    rows={2}
                    value={formData.partnersInfo}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Зовнішні відгуки (Google, Facebook)
                  </label>
                  <textarea
                    name="externalReviews"
                    rows={2}
                    value={formData.externalReviews}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent resize-none"
                    placeholder="Посилання на відгуки"
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8 pt-6 border-t border-neutral-200">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-accent-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-accent-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
