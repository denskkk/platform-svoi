'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, User, Target, Upload, Camera, Image as ImageIcon, CheckCircle, Plus, Trash2 } from 'lucide-react';

export default function EditBusinessProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string>('');
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    // Особисті дані представника
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    
    // Компанія
    companyName: '',
    companyCode: '',
    city: '',
    businessCategory: '',
    companyType: '',
    offerType: '',
    description: '',
    website: '',
    
    // Що шукаєте
    seekingPartner: false,
    seekingInvestor: false,
    seekingCustomer: false,
    seekingEmployee: false,
    
    // Детальна інформація пошуку
    partnerType: '',
    partnerSphere: '',
    partnerCollaboration: '',
    investmentAmount: '',
    investmentTerm: '',
    investmentGoals: '',
    investmentOffer: '',
    customerTarget: '',
    customerOffer: '',
    customerBenefits: '',
    vacancies: [] as Array<{
      position: string;
      responsibilities: string;
      requirements: string;
      salary: string;
      employmentType: string;
      experience: string;
    }>,
  });
  
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
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

  const businessCategories = [
    { value: 'education', label: 'Освіта' },
    { value: 'products', label: 'Продукти харчування' },
    { value: 'advertising', label: 'Реклама та маркетинг' },
    { value: 'online_sales', label: 'Інтернет-продажі' },
    { value: 'offline_sales', label: 'Офлайн-торгівля' },
    { value: 'auto_service', label: 'СТО та автосервіс' },
    { value: 'construction', label: 'Будівництво та ремонт' },
    { value: 'it', label: 'IT та розробка' },
    { value: 'other', label: 'Інше' },
  ];

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
        setBannerPreview(b.bannerUrl || '');
        
        // Parse search details
        let partnerDetails: any = {};
        let investorDetails: any = {};
        let customerDetails: any = {};
        let vacanciesList: any[] = [];

        try {
          if (b.partnerSearchDetails) {
            partnerDetails = typeof b.partnerSearchDetails === 'string' 
              ? JSON.parse(b.partnerSearchDetails) 
              : b.partnerSearchDetails;
          }
          if (b.investorSearchDetails) {
            investorDetails = typeof b.investorSearchDetails === 'string'
              ? JSON.parse(b.investorSearchDetails)
              : b.investorSearchDetails;
          }
          if (b.customerSearchDetails) {
            customerDetails = typeof b.customerSearchDetails === 'string'
              ? JSON.parse(b.customerSearchDetails)
              : b.customerSearchDetails;
          }
          if (b.employeeVacancies) {
            vacanciesList = typeof b.employeeVacancies === 'string'
              ? JSON.parse(b.employeeVacancies)
              : b.employeeVacancies;
          }
        } catch (e) {
          console.error('Error parsing business details:', e);
        }

        setFormData({
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          email: user?.email || '',
          phone: b.phone || user?.phone || '',
          
          companyName: b.companyName || '',
          companyCode: b.companyCode || '',
          city: b.city || '',
          businessCategory: b.businessCategory || '',
          companyType: b.companyType || '',
          offerType: b.offerType || '',
          description: b.description || b.shortDescription || '',
          website: b.website || '',
          
          seekingPartner: b.seekingPartner || false,
          seekingInvestor: b.seekingInvestor || false,
          seekingCustomer: b.seekingCustomer || false,
          seekingEmployee: b.seekingEmployee || false,
          
          partnerType: partnerDetails.type || '',
          partnerSphere: partnerDetails.sphere || '',
          partnerCollaboration: partnerDetails.collaboration || '',
          investmentAmount: investorDetails.amount || '',
          investmentTerm: investorDetails.term || '',
          investmentGoals: investorDetails.goals || '',
          investmentOffer: investorDetails.offer || '',
          customerTarget: customerDetails.target || '',
          customerOffer: customerDetails.offer || '',
          customerBenefits: customerDetails.benefits || '',
          vacancies: Array.isArray(vacanciesList) ? vacanciesList : [],
        });
      }
    } catch (err) {
      console.error('Error loading business info:', err);
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

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Файл банера занадто великий. Максимум 10MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        setError('Будь ласка, оберіть зображення для банера');
        return;
      }

      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File, type: 'logo' | 'banner'): Promise<string | null> => {
    if (!file) return null;

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('type', type === 'logo' ? 'logos' : 'banners');

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
        const urlWithTimestamp = `${data.url}?t=${Date.now()}`;
        return urlWithTimestamp;
      }

      throw new Error(data.error || `Помилка завантаження ${type === 'logo' ? 'лого' : 'банера'}`);
    } catch (err: any) {
      console.error(`Upload ${type} error:`, err);
      throw err;
    }
  };

  const addVacancy = () => {
    setFormData({
      ...formData,
      vacancies: [
        ...formData.vacancies,
        {
          position: '',
          responsibilities: '',
          requirements: '',
          salary: '',
          employmentType: '',
          experience: '',
        },
      ],
    });
  };

  const removeVacancy = (index: number) => {
    setFormData({
      ...formData,
      vacancies: formData.vacancies.filter((_, i) => i !== index),
    });
  };

  const updateVacancy = (index: number, field: string, value: string) => {
    const updatedVacancies = [...formData.vacancies];
    updatedVacancies[index] = { ...updatedVacancies[index], [field]: value };
    setFormData({ ...formData, vacancies: updatedVacancies });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      let logoUrl = logoPreview;
      let bannerUrl = bannerPreview;
      
      if (logoFile) {
        const uploadedUrl = await uploadImage(logoFile, 'logo');
        if (uploadedUrl) logoUrl = uploadedUrl;
      }

      if (bannerFile) {
        const uploadedUrl = await uploadImage(bannerFile, 'banner');
        if (uploadedUrl) bannerUrl = uploadedUrl;
      }

      // Prepare search details
      const partnerSearchDetails = formData.seekingPartner ? {
        type: formData.partnerType,
        sphere: formData.partnerSphere,
        collaboration: formData.partnerCollaboration,
      } : null;

      const investorSearchDetails = formData.seekingInvestor ? {
        amount: formData.investmentAmount,
        term: formData.investmentTerm,
        goals: formData.investmentGoals,
        offer: formData.investmentOffer,
      } : null;

      const customerSearchDetails = formData.seekingCustomer ? {
        target: formData.customerTarget,
        offer: formData.customerOffer,
        benefits: formData.customerBenefits,
      } : null;

      const cleanUrl = (url: string | null) => url ? url.split('?')[0] : null;
      
      const response = await fetch('/api/business-info', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          companyName: formData.companyName || null,
          companyCode: formData.companyCode || null,
          companyType: formData.companyType || null,
          businessCategory: formData.businessCategory || null,
          offerType: formData.offerType || null,
          city: formData.city || null,
          description: formData.description || null,
          website: formData.website || null,
          phone: formData.phone || null,
          logoUrl: cleanUrl(logoUrl),
          bannerUrl: cleanUrl(bannerUrl),
          
          seekingPartner: formData.seekingPartner || false,
          seekingInvestor: formData.seekingInvestor || false,
          seekingCustomer: formData.seekingCustomer || false,
          seekingEmployee: formData.seekingEmployee || false,
          
          partnerSearchDetails: partnerSearchDetails ? JSON.stringify(partnerSearchDetails) : null,
          investorSearchDetails: investorSearchDetails ? JSON.stringify(investorSearchDetails) : null,
          customerSearchDetails: customerSearchDetails ? JSON.stringify(customerSearchDetails) : null,
          employeeVacancies: formData.vacancies.length > 0 ? JSON.stringify(formData.vacancies) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Помилка збереження');
      }

      setSuccess('Бізнес-профіль успішно оновлено!');
      
      setTimeout(() => {
        router.push(`/profile/${user.id}`);
      }, 1500);
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

  const tabs = [
    { id: 'basic', name: 'Основне', icon: User },
    { id: 'company', name: 'Компанія', icon: Building2 },
    { id: 'seeking', name: 'Що шукаєте', icon: Target },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 px-8 py-6">
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Building2 className="w-8 h-8" />
              Редагувати бізнес-профіль
            </h1>
            <p className="text-orange-100 mt-2">Оновіть інформацію про вашу компанію</p>
          </div>

          {/* Images Upload */}
          <div className="p-8 border-b border-neutral-200 space-y-4">
            {/* Banner */}
            <div>
              <h3 className="font-semibold text-neutral-900 mb-2 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-orange-600" /> Банер компанії
              </h3>
              <div className="relative w-full h-44 rounded-lg overflow-hidden bg-neutral-100 border border-neutral-200">
                {bannerPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={bannerPreview} alt="Company banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-500 text-sm">
                    Немає банера
                  </div>
                )}
                <label
                  htmlFor="banner-upload"
                  className="absolute bottom-2 right-2 px-3 py-1.5 bg-white/90 backdrop-blur rounded-full shadow border border-neutral-200 cursor-pointer hover:bg-white transition-colors text-sm"
                >
                  Завантажити банер
                </label>
                <input id="banner-upload" type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
              </div>
              {bannerFile && (
                <p className="text-sm text-orange-600 mt-2">✓ Новий банер: {bannerFile.name}</p>
              )}
            </div>

            {/* Logo */}
            <div className="flex items-center space-x-6">
              <div className="relative flex-shrink-0">
                {logoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoPreview}
                    alt="Company logo"
                    className="w-24 h-24 rounded-lg object-contain bg-neutral-100 p-2 border-4 border-orange-200"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-lg bg-orange-500 flex items-center justify-center border-4 border-orange-200">
                    <Building2 className="w-12 h-12 text-white" />
                  </div>
                )}
                <label
                  htmlFor="logo-upload"
                  className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:bg-neutral-50 transition-colors border-2 border-orange-500"
                >
                  <Camera className="w-4 h-4 text-orange-600" />
                </label>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-neutral-900">Лого компанії</h3>
                <p className="text-sm text-neutral-600 mt-1">
                  PNG, JPG або HEIC. Макс 10MB
                </p>
                {logoFile && (
                  <p className="text-sm text-orange-600 mt-1">
                    ✓ Нове лого: {logoFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-neutral-200">
            <div className="px-8 flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    type="button"
                    className={`py-4 px-4 border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'border-orange-500 text-orange-600 font-medium'
                        : 'border-transparent text-neutral-600 hover:text-neutral-900'
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
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}

            {/* Tab: Basic */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Дані представника компанії
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ім'я *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Company */}
            {activeTab === 'company' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Назва компанії *
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      required
                      value={formData.companyName}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Код ЄДРПОУ
                    </label>
                    <input
                      type="text"
                      name="companyCode"
                      value={formData.companyCode}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Місто діяльності
                    </label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">Оберіть місто</option>
                      {cities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Тип компанії
                    </label>
                    <select
                      name="companyType"
                      value={formData.companyType}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">Оберіть тип</option>
                      <option value="fop">ФОП</option>
                      <option value="tov">ТОВ</option>
                      <option value="other">Інше</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Категорія діяльності
                    </label>
                    <select
                      name="businessCategory"
                      value={formData.businessCategory}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">Оберіть категорію</option>
                      {businessCategories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Що пропонуєте?
                    </label>
                    <select
                      name="offerType"
                      value={formData.offerType}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">Оберіть</option>
                      <option value="service">Послуга</option>
                      <option value="product">Товар</option>
                      <option value="both">Послуги та товари</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Короткий опис
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                      placeholder="Що пропонує ваша компанія..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Веб-сайт
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="https://yourcompany.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Seeking */}
            {activeTab === 'seeking' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Кого/що шукаєте?
                </h3>

                <div className="space-y-6">
                  {/* Пошук партнера */}
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <label className="flex items-center gap-3 p-4 bg-gray-50 cursor-pointer hover:bg-gray-100">
                      <input
                        type="checkbox"
                        name="seekingPartner"
                        checked={formData.seekingPartner}
                        onChange={handleChange}
                        className="w-5 h-5 text-orange-600"
                      />
                      <div className="flex-1">
                        <div className="font-medium">Партнера</div>
                        <div className="text-sm text-gray-500">
                          Пошук ділових партнерів для співпраці
                        </div>
                      </div>
                    </label>
                    {formData.seekingPartner && (
                      <div className="p-4 space-y-4 bg-white border-t">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Тип партнера
                          </label>
                          <select
                            name="partnerType"
                            value={formData.partnerType}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="">Оберіть тип</option>
                            <option value="investor">Інвестиційний партнер</option>
                            <option value="supplier">Постачальник</option>
                            <option value="distributor">Дистриб'ютор</option>
                            <option value="franchise">Франчайзі</option>
                            <option value="strategic">Стратегічний партнер</option>
                            <option value="other">Інше</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Сфера співпраці
                          </label>
                          <input
                            type="text"
                            name="partnerSphere"
                            value={formData.partnerSphere}
                            onChange={handleChange}
                            placeholder="Наприклад: оптові поставки, спільний маркетинг..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Умови співпраці
                          </label>
                          <textarea
                            name="partnerCollaboration"
                            value={formData.partnerCollaboration}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Опишіть, що ви пропонуєте партнеру..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 resize-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Пошук інвестора */}
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <label className="flex items-center gap-3 p-4 bg-gray-50 cursor-pointer hover:bg-gray-100">
                      <input
                        type="checkbox"
                        name="seekingInvestor"
                        checked={formData.seekingInvestor}
                        onChange={handleChange}
                        className="w-5 h-5 text-orange-600"
                      />
                      <div className="flex-1">
                        <div className="font-medium">Інвестора</div>
                        <div className="text-sm text-gray-500">
                          Залучення інвестицій для розвитку
                        </div>
                      </div>
                    </label>
                    {formData.seekingInvestor && (
                      <div className="p-4 space-y-4 bg-white border-t">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Необхідна сума інвестицій
                          </label>
                          <input
                            type="text"
                            name="investmentAmount"
                            value={formData.investmentAmount}
                            onChange={handleChange}
                            placeholder="Наприклад: від 500 000 до 1 000 000 грн"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Строк окупності
                          </label>
                          <input
                            type="text"
                            name="investmentTerm"
                            value={formData.investmentTerm}
                            onChange={handleChange}
                            placeholder="Наприклад: 18-24 місяці"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Цілі інвестицій
                          </label>
                          <textarea
                            name="investmentGoals"
                            value={formData.investmentGoals}
                            onChange={handleChange}
                            rows={2}
                            placeholder="На що підуть інвестиції: розширення, обладнання, маркетинг..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Що пропонуєте інвестору
                          </label>
                          <textarea
                            name="investmentOffer"
                            value={formData.investmentOffer}
                            onChange={handleChange}
                            rows={2}
                            placeholder="Частка бізнесу, дивіденди, інше..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 resize-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Пошук споживача */}
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <label className="flex items-center gap-3 p-4 bg-gray-50 cursor-pointer hover:bg-gray-100">
                      <input
                        type="checkbox"
                        name="seekingCustomer"
                        checked={formData.seekingCustomer}
                        onChange={handleChange}
                        className="w-5 h-5 text-orange-600"
                      />
                      <div className="flex-1">
                        <div className="font-medium">Споживача</div>
                        <div className="text-sm text-gray-500">
                          Розширення клієнтської бази
                        </div>
                      </div>
                    </label>
                    {formData.seekingCustomer && (
                      <div className="p-4 space-y-4 bg-white border-t">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Цільова аудиторія
                          </label>
                          <input
                            type="text"
                            name="customerTarget"
                            value={formData.customerTarget}
                            onChange={handleChange}
                            placeholder="Хто ваші клієнти: приватні особи, бізнес, вікова група..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Що пропонуєте
                          </label>
                          <textarea
                            name="customerOffer"
                            value={formData.customerOffer}
                            onChange={handleChange}
                            rows={2}
                            placeholder="Опишіть ваші продукти/послуги..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Переваги для клієнтів
                          </label>
                          <textarea
                            name="customerBenefits"
                            value={formData.customerBenefits}
                            onChange={handleChange}
                            rows={2}
                            placeholder="Чому обирають вас: якість, ціна, швидкість..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 resize-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Пошук працівника */}
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <label className="flex items-center gap-3 p-4 bg-gray-50 cursor-pointer hover:bg-gray-100">
                      <input
                        type="checkbox"
                        name="seekingEmployee"
                        checked={formData.seekingEmployee}
                        onChange={handleChange}
                        className="w-5 h-5 text-orange-600"
                      />
                      <div className="flex-1">
                        <div className="font-medium">Працівника</div>
                        <div className="text-sm text-gray-500">
                          Пошук співробітників у команду
                        </div>
                      </div>
                    </label>
                    {formData.seekingEmployee && (
                      <div className="p-4 space-y-4 bg-white border-t">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">Вакансії</h4>
                          <button
                            type="button"
                            onClick={addVacancy}
                            className="flex items-center gap-1 px-3 py-1 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            Додати вакансію
                          </button>
                        </div>

                        {formData.vacancies.length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-4">
                            Додайте вакансії, які ви хочете опублікувати
                          </p>
                        )}

                        {formData.vacancies.map((vacancy, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                Вакансія #{index + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeVacancy(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div className="col-span-2">
                                <input
                                  type="text"
                                  placeholder="Посада"
                                  value={vacancy.position}
                                  onChange={(e) => updateVacancy(index, 'position', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                />
                              </div>
                              <div className="col-span-2">
                                <textarea
                                  placeholder="Обов'язки"
                                  value={vacancy.responsibilities}
                                  onChange={(e) => updateVacancy(index, 'responsibilities', e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 resize-none"
                                />
                              </div>
                              <div className="col-span-2">
                                <textarea
                                  placeholder="Вимоги"
                                  value={vacancy.requirements}
                                  onChange={(e) => updateVacancy(index, 'requirements', e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 resize-none"
                                />
                              </div>
                              <div>
                                <input
                                  type="text"
                                  placeholder="Зарплата (грн)"
                                  value={vacancy.salary}
                                  onChange={(e) => updateVacancy(index, 'salary', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                />
                              </div>
                              <div>
                                <select
                                  value={vacancy.employmentType}
                                  onChange={(e) => updateVacancy(index, 'employmentType', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                >
                                  <option value="">Тип зайнятості</option>
                                  <option value="full-time">Повна зайнятість</option>
                                  <option value="part-time">Часткова зайнятість</option>
                                  <option value="remote">Віддалена робота</option>
                                  <option value="contract">За контрактом</option>
                                  <option value="freelance">Фріланс</option>
                                </select>
                              </div>
                              <div className="col-span-2">
                                <input
                                  type="text"
                                  placeholder="Необхідний досвід"
                                  value={vacancy.experience}
                                  onChange={(e) => updateVacancy(index, 'experience', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border border-neutral-300 rounded-lg text-neutral-700 font-medium hover:bg-neutral-50 transition-colors"
              >
                Скасувати
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Збереження...' : 'Зберегти зміни'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
