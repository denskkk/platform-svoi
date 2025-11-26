"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  User,
  Target,
  Crown,
  Sparkles,
  CheckCircle,
  Upload,
  X,
  Plus,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";

function BusinessRegistrationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPremium = searchParams?.get("premium") === "true";
  const refCode = searchParams?.get('ref') || undefined;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("basic");

  // Дозволено пряму реєстрацію як бізнес-акаунт
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    companyName: "",
    companyCode: "",
    city: "",
    businessCategory: "",
    companyType: "",
    offerType: "",
    description: "",
    website: "",
    seekingPartner: false,
    seekingInvestor: false,
    seekingCustomer: false,
    seekingEmployee: false,
    offerToCustomers: false,
    offerToPartners: false,
    offerToInvestors: false,
    wantsUCMAnalysis: false,
    // Детальні поля пошуку
    partnerType: "",
    partnerSphere: "",
    partnerCollaboration: "",
    investmentAmount: "",
    investmentTerm: "",
    investmentGoals: "",
    investmentOffer: "",
    customerTarget: "",
    customerOffer: "",
    customerBenefits: "",
    vacancies: [] as Array<{
      position: string;
      responsibilities: string;
      requirements: string;
      salary: string;
      employmentType: string;
      experience: string;
    }>,
  });
  
  // Файли для завантаження
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const cities = [
    "Київ",
    "Харків",
    "Одеса",
    "Дніпро",
    "Донецьк",
    "Запоріжжя",
    "Львів",
    "Кривий Ріг",
    "Миколаїв",
    "Маріуполь",
    "Вінниця",
    "Херсон",
    "Полтава",
    "Чернігів",
    "Черкаси",
    "Суми",
  ];

  const businessCategories = [
    { value: "education", label: "Освіта" },
    { value: "products", label: "Продукти харчування" },
    { value: "advertising", label: "Реклама та маркетинг" },
    { value: "online_sales", label: "Інтернет-продажі" },
    { value: "offline_sales", label: "Офлайн-торгівля" },
    { value: "auto_service", label: "СТО та автосервіс" },
    { value: "construction", label: "Будівництво та ремонт" },
    { value: "it", label: "IT та розробка" },
    { value: "other", label: "Інше" },
  ];

  const tabs = [
    { id: "basic", name: "Основне", icon: User },
    { id: "company", name: "Компанія", icon: Building2 },
    { id: "seeking", name: "Що шукаєте", icon: Target },
  ];

  if (isPremium) {
    tabs.push({ id: "premium", name: "Преміум", icon: Crown });
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'logo') {
        setLogoFile(file);
      } else {
        setBannerFile(file);
      }
    }
  };

  const addVacancy = () => {
    setFormData({
      ...formData,
      vacancies: [
        ...formData.vacancies,
        {
          position: "",
          responsibilities: "",
          requirements: "",
          salary: "",
          employmentType: "",
          experience: "",
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
    setError("");

    // Валідація
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.password
    ) {
      setError("Заповніть всі обов'язкові особисті дані");
      return;
    }

    if (!formData.companyName) {
      setError("Вкажіть назву компанії");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Паролі не співпадають");
      return;
    }

    if (formData.password.length < 6) {
      setError("Пароль повинен містити мінімум 6 символів");
      return;
    }

    setLoading(true);

    try {
      // Спочатку завантажимо зображення, якщо вони є
      let logoUrl = null;
      let bannerUrl = null;

      if (logoFile || bannerFile) {
        const formDataImages = new FormData();
        if (logoFile) formDataImages.append('logo', logoFile);
        if (bannerFile) formDataImages.append('banner', bannerFile);

        const uploadResponse = await fetch('/api/upload/business-images', {
          method: 'POST',
          body: formDataImages,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          logoUrl = uploadData.logoUrl;
          bannerUrl = uploadData.bannerUrl;
        } else {
          const errorData = await uploadResponse.json();
          console.error('[Business Registration] Помилка завантаження зображень:', errorData);
        }
      }

      // Підготовка детальних даних пошуку
      const partnerSearchDetails = formData.seekingPartner ? {
        type: formData.partnerType,
        sphere: formData.partnerSphere,
        collaboration: formData.partnerCollaboration,
      } : {};

      const investorSearchDetails = formData.seekingInvestor ? {
        amount: formData.investmentAmount,
        term: formData.investmentTerm,
        goals: formData.investmentGoals,
        offer: formData.investmentOffer,
      } : {};

      const customerSearchDetails = formData.seekingCustomer ? {
        target: formData.customerTarget,
        offer: formData.customerOffer,
        benefits: formData.customerBenefits,
      } : {};

      const response = await fetch("/api/auth/register-business", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            password: formData.password,
            phone: formData.phone,
            city: formData.city,
            role: "business",
            accountType: "business",
            ref: refCode,
          },
          business: {
            companyName: formData.companyName,
            companyCode: formData.companyCode,
            city: formData.city,
            businessCategory: formData.businessCategory,
            companyType: formData.companyType,
            offerType: formData.offerType,
            description: formData.description,
            website: formData.website,
            seekingPartner: formData.seekingPartner,
            seekingInvestor: formData.seekingInvestor,
            seekingCustomer: formData.seekingCustomer,
            seekingEmployee: formData.seekingEmployee,
            offerToCustomers: isPremium ? formData.offerToCustomers : false,
            offerToPartners: isPremium ? formData.offerToPartners : false,
            offerToInvestors: isPremium ? formData.offerToInvestors : false,
            wantsUCMAnalysis: isPremium ? formData.wantsUCMAnalysis : false,
            // Детальна інформація пошуку
            partnerSearchDetails,
            investorSearchDetails,
            customerSearchDetails,
            employeeVacancies: formData.vacancies,
            // URLs зображень
            logoUrl,
            bannerUrl,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Помилка реєстрації");
      }

      // Зберегти користувача та токен (додаємо cache-busting для логотипа/банера на клієнті)
      if (data.user) {
        const enriched = { ...data.user };
        if (enriched.businessInfo) {
          const b = { ...enriched.businessInfo } as any;
          if (b.logoUrl) {
            const cb = b.logoUrl.includes('?') ? '&' : '?';
            b.logoUrl = `${b.logoUrl}${cb}t=${Date.now()}`;
          }
          if (b.bannerUrl) {
            const cb2 = b.bannerUrl.includes('?') ? '&' : '?';
            b.bannerUrl = `${b.bannerUrl}${cb2}t=${Date.now()}`;
          }
          enriched.businessInfo = b;
        }
        localStorage.setItem("user", JSON.stringify(enriched));
      }
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      // Перенаправити на профіль
  router.push(`/profile/${data.user.id}?t=${Date.now()}`);
    } catch (err: any) {
      setError(err.message || "Помилка реєстрації");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          href="/auth/register"
          className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад до вибору типу
        </Link>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className={`${
            isPremium
              ? "bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600"
              : "bg-gradient-to-r from-orange-500 to-red-500"
          } px-8 py-6`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                {isPremium ? (
                  <Crown className="w-6 h-6 text-white" />
                ) : (
                  <Building2 className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                  {isPremium && <Sparkles className="w-6 h-6" />}
                  Бізнес {isPremium && "Преміум"} Акаунт
                </h1>
                <p className="text-white/90 mt-1">
                  {isPremium
                    ? "Максимальна видимість та можливості"
                    : "Для підприємців та компаній"}
                </p>
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
                    type="button"
                    className={`py-4 px-4 border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                      activeTab === tab.id
                        ? "border-orange-500 text-orange-600 font-medium"
                        : "border-transparent text-gray-600 hover:text-gray-900"
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

            {/* Tab: Basic */}
            {activeTab === "basic" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Дані представника компанії
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Company */}
            {activeTab === "company" && (
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
                      placeholder="ТОВ 'Будівельна компанія'"
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
                      placeholder="12345678"
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

                  {/* Логотип компанії */}
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <ImageIcon className="w-4 h-4 inline mr-1" />
                      Логотип компанії
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'logo')}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="flex items-center justify-center gap-2 w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        {logoFile ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-sm text-gray-700">{logoFile.name}</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-gray-400" />
                            <span className="text-sm text-gray-600">Завантажити логотип</span>
                          </>
                        )}
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Рекомендований розмір: 400x400px</p>
                  </div>

                  {/* Банер компанії */}
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <ImageIcon className="w-4 h-4 inline mr-1" />
                      Банер компанії
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'banner')}
                        className="hidden"
                        id="banner-upload"
                      />
                      <label
                        htmlFor="banner-upload"
                        className="flex items-center justify-center gap-2 w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        {bannerFile ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-sm text-gray-700">{bannerFile.name}</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-gray-400" />
                            <span className="text-sm text-gray-600">Завантажити банер</span>
                          </>
                        )}
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Рекомендований розмір: 1200x400px</p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Seeking */}
            {activeTab === "seeking" && (
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
                            placeholder="Наприклад: від 500 000 до 1 000 000 УЦМ"
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
                                  placeholder="Зарплата (УЦМ)"
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

            {/* Tab: Premium */}
            {activeTab === "premium" && isPremium && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6 rounded-xl border-2 border-yellow-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Crown className="w-6 h-6 text-yellow-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Преміум можливості
                    </h3>
                  </div>
                  <p className="text-sm text-gray-700 mb-4">
                    Активуйте функції для максимальної видимості вашого бізнесу
                  </p>

                  <div className="space-y-3">
                    <label className="flex items-start gap-3 p-4 bg-white border border-yellow-300 rounded-lg hover:bg-yellow-50 cursor-pointer">
                      <input
                        type="checkbox"
                        name="offerToCustomers"
                        checked={formData.offerToCustomers}
                        onChange={handleChange}
                        className="w-5 h-5 text-yellow-600 mt-0.5"
                      />
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-yellow-600" />
                          Пропонувати споживачам
                        </div>
                        <div className="text-sm text-gray-600">
                          Система автоматично показуватиме вас потенційним
                          клієнтам
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-4 bg-white border border-yellow-300 rounded-lg hover:bg-yellow-50 cursor-pointer">
                      <input
                        type="checkbox"
                        name="offerToPartners"
                        checked={formData.offerToPartners}
                        onChange={handleChange}
                        className="w-5 h-5 text-yellow-600 mt-0.5"
                      />
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-yellow-600" />
                          Пропонувати партнерам
                        </div>
                        <div className="text-sm text-gray-600">
                          Знаходьте ділових партнерів автоматично
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-4 bg-white border border-yellow-300 rounded-lg hover:bg-yellow-50 cursor-pointer">
                      <input
                        type="checkbox"
                        name="offerToInvestors"
                        checked={formData.offerToInvestors}
                        onChange={handleChange}
                        className="w-5 h-5 text-yellow-600 mt-0.5"
                      />
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-yellow-600" />
                          Пропонувати інвесторам
                        </div>
                        <div className="text-sm text-gray-600">
                          Показувати ваш бізнес потенційним інвесторам
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-4 bg-white border border-yellow-300 rounded-lg hover:bg-yellow-50 cursor-pointer">
                      <input
                        type="checkbox"
                        name="wantsUCMAnalysis"
                        checked={formData.wantsUCMAnalysis}
                        onChange={handleChange}
                        className="w-5 h-5 text-yellow-600 mt-0.5"
                      />
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-yellow-600" />
                          Аналіз від команди УЦМ
                        </div>
                        <div className="text-sm text-gray-600">
                          Отримайте професійний аналіз та рекомендації для
                          покращення бізнесу
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Кнопки */}
            <div className="flex gap-4 pt-6 border-t border-gray-200 mt-8">
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 ${
                  isPremium
                    ? "bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 hover:from-yellow-500 hover:via-amber-600 hover:to-yellow-700"
                    : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                } text-white py-3 px-6 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
              >
                {loading ? "Реєструємо..." : "Зареєструватися"}
              </button>
              <Link
                href="/auth/register"
                className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-center"
              >
                Скасувати
              </Link>
            </div>

            {/* Login Link */}
            <div className="text-center pt-4">
              <p className="text-gray-600">
                Вже маєте акаунт?{" "}
                <Link
                  href="/auth/login"
                  className="text-orange-600 hover:text-orange-700 font-semibold"
                >
                  Увійти
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Info */}
        <div className={`mt-6 border rounded-xl p-4 ${
          isPremium
            ? "bg-yellow-50 border-yellow-200"
            : "bg-orange-50 border-orange-200"
        }`}>
          <p className={`text-sm ${isPremium ? "text-yellow-800" : "text-orange-800"}`}>
            {isPremium ? (
              <>
                � <strong>Бізнес Преміум:</strong> Автоматичні пропозиції,
                пріоритет у пошуку та аналіз від УЦМ. Максимальна видимість для
                вашого бізнесу!
              </>
            ) : (
              <>
                🏢 <strong>Бізнес акаунт:</strong> Пошук партнерів, інвесторів
                та споживачів. Завжди можна покращити до Преміум для
                автоматичних пропозицій!
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterBusinessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Завантаження...</p>
        </div>
      </div>
    }>
      <BusinessRegistrationForm />
    </Suspense>
  );
}
