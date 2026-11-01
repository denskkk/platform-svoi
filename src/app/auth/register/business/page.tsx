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
import { cities, getCityName } from '@/lib/constants';
import { ConsentCheckbox } from '@/components/ui/ConsentCheckbox';
import { useI18n } from '@/i18n/client';

function BusinessRegistrationForm() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPremium = searchParams?.get("premium") === "true";
  
  const [loading, setLoading] = useState(false);
  const [consent, setConsent] = useState(false);
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

  const businessCategories = [
    { value: "education", label: t('registerBusiness.company.categories.education') },
    { value: "products", label: t('registerBusiness.company.categories.products') },
    { value: "advertising", label: t('registerBusiness.company.categories.advertising') },
    { value: "online_sales", label: t('registerBusiness.company.categories.online_sales') },
    { value: "offline_sales", label: t('registerBusiness.company.categories.offline_sales') },
    { value: "auto_service", label: t('registerBusiness.company.categories.auto_service') },
    { value: "construction", label: t('registerBusiness.company.categories.construction') },
    { value: "it", label: t('registerBusiness.company.categories.it') },
    { value: "other", label: t('registerBusiness.company.categories.other') },
  ];

  const tabs = [
    { id: "basic", name: t('registerBusiness.tabs.basic'), icon: User },
    { id: "company", name: t('registerBusiness.tabs.company'), icon: Building2 },
    { id: "seeking", name: t('registerBusiness.tabs.seeking'), icon: Target },
  ];

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
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.email.trim() ||
      !formData.password
    ) {
      setError(t('registerBusiness.errors.requiredPersonal'));
      return;
    }

    if (!formData.companyName.trim()) {
      setError(t('registerBusiness.errors.companyNameRequired'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('registerBusiness.errors.passwordMismatch'));
      return;
    }

    if (formData.password.length < 6) {
      setError(t('registerBusiness.errors.passwordTooShort'));
      return;
    }

    if (!consent) {
      setError(t('registerBusiness.errors.consentRequired'));
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
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim(),
            password: formData.password,
            phone: formData.phone.trim() || undefined,
            city: formData.city.trim() || undefined,
            role: "business",
            accountType: "business",
          },
          business: {
            companyName: formData.companyName.trim(),
            companyCode: formData.companyCode.trim() || undefined,
            city: formData.city.trim() || undefined,
            businessCategory: formData.businessCategory || undefined,
            companyType: formData.companyType || undefined,
            offerType: formData.offerType || undefined,
            description: formData.description.trim() || undefined,
            website: formData.website.trim() || undefined,
            seekingPartner: formData.seekingPartner,
            seekingInvestor: formData.seekingInvestor,
            seekingCustomer: formData.seekingCustomer,
            seekingEmployee: formData.seekingEmployee,
            offerToCustomers: isPremium ? formData.offerToCustomers : false,
            offerToPartners: isPremium ? formData.offerToPartners : false,
            offerToInvestors: isPremium ? formData.offerToInvestors : false,
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
        throw new Error(data.error || t('registerBusiness.errors.registrationFailed'));
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
      setError(err.message || t('registerBusiness.errors.registrationFailed'));
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
          {t('registerBusiness.back')}
        </Link>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                  🏢 {t('registerBusiness.header.title')}
                </h1>
                <p className="text-white/90 mt-1">
                  {t('registerBusiness.header.subtitle')}
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
                  {t('registerBusiness.basic.title')}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('registerBusiness.basic.firstName')}
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
                      {t('registerBusiness.basic.lastName')}
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
                      {t('registerBusiness.basic.email')}
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
                      {t('registerBusiness.basic.phone')}
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
                      {t('registerBusiness.basic.password')}
                    </label>
                    <input
                      type="password"
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder={t('registerBusiness.basic.passwordPlaceholder')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('registerBusiness.basic.confirmPassword')}
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder={t('registerBusiness.basic.confirmPasswordPlaceholder')}
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
                      {t('registerBusiness.company.name')}
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      required
                      value={formData.companyName}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder={t('registerBusiness.company.namePlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('registerBusiness.company.code')}
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
                      {t('registerBusiness.company.city')}
                    </label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">{t('registerBusiness.company.cityPlaceholder')}</option>
                      {cities.map((city) => (
                        <option key={city} value={city}>
                          {getCityName(city, locale)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('registerBusiness.company.type')}
                    </label>
                    <select
                      name="companyType"
                      value={formData.companyType}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">{t('registerBusiness.company.typePlaceholder')}</option>
                      <option value="fop">{t('registerBusiness.company.types.fop')}</option>
                      <option value="tov">{t('registerBusiness.company.types.tov')}</option>
                      <option value="other">{t('registerBusiness.company.types.other')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('registerBusiness.company.category')}
                    </label>
                    <select
                      name="businessCategory"
                      value={formData.businessCategory}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">{t('registerBusiness.company.categoryPlaceholder')}</option>
                      {businessCategories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('registerBusiness.company.offer')}
                    </label>
                    <select
                      name="offerType"
                      value={formData.offerType}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">{t('registerBusiness.company.offerPlaceholder')}</option>
                      <option value="service">{t('registerBusiness.company.offerTypes.service')}</option>
                      <option value="product">{t('registerBusiness.company.offerTypes.product')}</option>
                      <option value="both">{t('registerBusiness.company.offerTypes.both')}</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('registerBusiness.company.description')}
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                      placeholder={t('registerBusiness.company.descriptionPlaceholder')}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('registerBusiness.company.website')}
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
                      {t('registerBusiness.company.logo')}
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
                            <span className="text-sm text-gray-600">{t('registerBusiness.company.logoUpload')}</span>
                          </>
                        )}
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{t('registerBusiness.company.logoHint')}</p>
                  </div>

                  {/* Банер компанії */}
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <ImageIcon className="w-4 h-4 inline mr-1" />
                      {t('registerBusiness.company.banner')}
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
                            <span className="text-sm text-gray-600">{t('registerBusiness.company.bannerUpload')}</span>
                          </>
                        )}
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{t('registerBusiness.company.bannerHint')}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Seeking */}
            {activeTab === "seeking" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('registerBusiness.seeking.title')}
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
                        <div className="font-medium">{t('registerBusiness.seeking.partner.title')}</div>
                        <div className="text-sm text-gray-500">
                          {t('registerBusiness.seeking.partner.description')}
                        </div>
                      </div>
                    </label>
                    {formData.seekingPartner && (
                      <div className="p-4 space-y-4 bg-white border-t">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('registerBusiness.seeking.partner.type')}
                          </label>
                          <select
                            name="partnerType"
                            value={formData.partnerType}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="">{t('registerBusiness.seeking.partner.typePlaceholder')}</option>
                            <option value="investor">{t('registerBusiness.seeking.partner.types.investor')}</option>
                            <option value="supplier">{t('registerBusiness.seeking.partner.types.supplier')}</option>
                            <option value="distributor">{t('registerBusiness.seeking.partner.types.distributor')}</option>
                            <option value="franchise">{t('registerBusiness.seeking.partner.types.franchise')}</option>
                            <option value="strategic">{t('registerBusiness.seeking.partner.types.strategic')}</option>
                            <option value="other">{t('registerBusiness.seeking.partner.types.other')}</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('registerBusiness.seeking.partner.sphere')}
                          </label>
                          <input
                            type="text"
                            name="partnerSphere"
                            value={formData.partnerSphere}
                            onChange={handleChange}
                            placeholder={t('registerBusiness.seeking.partner.spherePlaceholder')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('registerBusiness.seeking.partner.collaboration')}
                          </label>
                          <textarea
                            name="partnerCollaboration"
                            value={formData.partnerCollaboration}
                            onChange={handleChange}
                            rows={3}
                            placeholder={t('registerBusiness.seeking.partner.collaborationPlaceholder')}
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
                        <div className="font-medium">{t('registerBusiness.seeking.investor.title')}</div>
                        <div className="text-sm text-gray-500">
                          {t('registerBusiness.seeking.investor.description')}
                        </div>
                      </div>
                    </label>
                    {formData.seekingInvestor && (
                      <div className="p-4 space-y-4 bg-white border-t">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('registerBusiness.seeking.investor.amount')}
                          </label>
                          <input
                            type="text"
                            name="investmentAmount"
                            value={formData.investmentAmount}
                            onChange={handleChange}
                            placeholder={t('registerBusiness.seeking.investor.amountPlaceholder')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('registerBusiness.seeking.investor.term')}
                          </label>
                          <input
                            type="text"
                            name="investmentTerm"
                            value={formData.investmentTerm}
                            onChange={handleChange}
                            placeholder={t('registerBusiness.seeking.investor.termPlaceholder')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('registerBusiness.seeking.investor.goals')}
                          </label>
                          <textarea
                            name="investmentGoals"
                            value={formData.investmentGoals}
                            onChange={handleChange}
                            rows={2}
                            placeholder={t('registerBusiness.seeking.investor.goalsPlaceholder')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('registerBusiness.seeking.investor.offer')}
                          </label>
                          <textarea
                            name="investmentOffer"
                            value={formData.investmentOffer}
                            onChange={handleChange}
                            rows={2}
                            placeholder={t('registerBusiness.seeking.investor.offerPlaceholder')}
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
                        <div className="font-medium">{t('registerBusiness.seeking.customer.title')}</div>
                        <div className="text-sm text-gray-500">
                          {t('registerBusiness.seeking.customer.description')}
                        </div>
                      </div>
                    </label>
                    {formData.seekingCustomer && (
                      <div className="p-4 space-y-4 bg-white border-t">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('registerBusiness.seeking.customer.target')}
                          </label>
                          <input
                            type="text"
                            name="customerTarget"
                            value={formData.customerTarget}
                            onChange={handleChange}
                            placeholder={t('registerBusiness.seeking.customer.targetPlaceholder')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('registerBusiness.seeking.customer.offer')}
                          </label>
                          <textarea
                            name="customerOffer"
                            value={formData.customerOffer}
                            onChange={handleChange}
                            rows={2}
                            placeholder={t('registerBusiness.seeking.customer.offerPlaceholder')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('registerBusiness.seeking.customer.benefits')}
                          </label>
                          <textarea
                            name="customerBenefits"
                            value={formData.customerBenefits}
                            onChange={handleChange}
                            rows={2}
                            placeholder={t('registerBusiness.seeking.customer.benefitsPlaceholder')}
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
                        <div className="font-medium">{t('registerBusiness.seeking.employee.title')}</div>
                        <div className="text-sm text-gray-500">
                          {t('registerBusiness.seeking.employee.description')}
                        </div>
                      </div>
                    </label>
                    {formData.seekingEmployee && (
                      <div className="p-4 space-y-4 bg-white border-t">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{t('registerBusiness.seeking.employee.vacancies')}</h4>
                          <button
                            type="button"
                            onClick={addVacancy}
                            className="flex items-center gap-1 px-3 py-1 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            {t('registerBusiness.seeking.employee.addVacancy')}
                          </button>
                        </div>

                        {formData.vacancies.length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-4">
                            {t('registerBusiness.seeking.employee.empty')}
                          </p>
                        )}

                        {formData.vacancies.map((vacancy, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                {t('registerBusiness.seeking.employee.vacancyNumber', { number: index + 1 })}
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
                                  placeholder={t('registerBusiness.seeking.employee.position')}
                                  value={vacancy.position}
                                  onChange={(e) => updateVacancy(index, 'position', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                />
                              </div>
                              <div className="col-span-2">
                                <textarea
                                  placeholder={t('registerBusiness.seeking.employee.responsibilities')}
                                  value={vacancy.responsibilities}
                                  onChange={(e) => updateVacancy(index, 'responsibilities', e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 resize-none"
                                />
                              </div>
                              <div className="col-span-2">
                                <textarea
                                  placeholder={t('registerBusiness.seeking.employee.requirements')}
                                  value={vacancy.requirements}
                                  onChange={(e) => updateVacancy(index, 'requirements', e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 resize-none"
                                />
                              </div>
                              <div>
                                <input
                                  type="text"
                                  placeholder={t('registerBusiness.seeking.employee.salary')}
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
                                  <option value="">{t('registerBusiness.seeking.employee.employmentType')}</option>
                                  <option value="full-time">{t('registerBusiness.seeking.employee.employmentTypes.full-time')}</option>
                                  <option value="part-time">{t('registerBusiness.seeking.employee.employmentTypes.part-time')}</option>
                                  <option value="remote">{t('registerBusiness.seeking.employee.employmentTypes.remote')}</option>
                                  <option value="contract">{t('registerBusiness.seeking.employee.employmentTypes.contract')}</option>
                                  <option value="freelance">{t('registerBusiness.seeking.employee.employmentTypes.freelance')}</option>
                                </select>
                              </div>
                              <div className="col-span-2">
                                <input
                                  type="text"
                                  placeholder={t('registerBusiness.seeking.employee.experience')}
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

            {/* Згода з умовами */}
            <div className="pt-6 border-t border-gray-200 mt-8">
              <ConsentCheckbox checked={consent} onChange={setConsent} />
            </div>

            {/* Кнопки */}
            <div className="flex gap-4 pt-6 mt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 px-6 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? t('registerBusiness.actions.submitting') : `🚀 ${t('registerBusiness.actions.submit')}`}
              </button>
              <Link
                href="/auth/register"
                className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-center"
              >
                {t('registerBusiness.actions.cancel')}
              </Link>
            </div>

            {/* Login Link */}
            <div className="text-center pt-4">
              <p className="text-gray-600">
                {t('registerBusiness.login.prompt')}{" "}
                <Link
                  href="/auth/login"
                  className="text-orange-600 hover:text-orange-700 font-semibold"
                >
                  {t('registerBusiness.login.link')}
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Info */}
        <div className="mt-6 border rounded-xl p-4 bg-orange-50 border-orange-200">
          <p className="text-sm text-orange-800">
            🏢 <strong>{t('registerBusiness.info.label')}</strong> {t('registerBusiness.info.text')}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterBusinessPage() {
  const { t } = useI18n();
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('registerBusiness.loading')}</p>
        </div>
      </div>
    }>
      <BusinessRegistrationForm />
    </Suspense>
  );
}
