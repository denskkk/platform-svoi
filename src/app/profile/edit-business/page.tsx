'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, User, Camera, Image as ImageIcon, Users, Phone, Plus, Trash2, Upload } from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { cities } from '@/lib/constants';

type Vacancy = {
  position: string;
  responsibilities: string;
  requirements: string;
  salary: string;
  employmentType: string;
  experience: string;
};

const INITIAL_FORM = {
  // Представник
  firstName: '',
  lastName: '',
  phone: '',

  // Компанія
  companyName: '',
  companyCode: '',
  city: '',
  businessCategory: '',
  companyType: '',
  offerType: '',
  description: '',

  // Контакти компанії
  companyPhone: '',
  website: '',
  telegram: '',
  viber: '',
  instagram: '',
  facebook: '',
  address: '',
  workHours: '',

  // Співпраця
  seekingPartner: false,
  seekingInvestor: false,
  seekingCustomer: false,
  seekingEmployee: false,
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
  vacancies: [] as Vacancy[],
};

type FormState = typeof INITIAL_FORM;

const BUSINESS_CATEGORIES = [
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

const TABS = [
  { id: 'basic', name: 'Основне', icon: User },
  { id: 'company', name: 'Компанія', icon: Building2 },
  { id: 'contacts', name: 'Контакти', icon: Phone },
  { id: 'seeking', name: 'Співпраця', icon: Users },
];

const inputClass =
  'w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent';

const stripCacheBuster = (url: string) => url.split('?')[0];

const asObject = (value: unknown): Record<string, any> => {
  if (!value) return {};
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  return typeof value === 'object' ? (value as Record<string, any>) : {};
};

const asArray = (value: unknown): any[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

function Field({ label, required, children, className = '' }: { label: string; required?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        {label}
        {required && ' *'}
      </label>
      {children}
    </div>
  );
}

function SeekingCard({
  name,
  checked,
  title,
  hint,
  onChange,
  children,
}: {
  name: string;
  checked: boolean;
  title: string;
  hint: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-neutral-300 rounded-lg overflow-hidden">
      <label className="flex items-center gap-3 p-4 bg-neutral-50 cursor-pointer hover:bg-neutral-100">
        <input type="checkbox" name={name} checked={checked} onChange={onChange} className="w-5 h-5 accent-primary-600" />
        <div className="flex-1">
          <div className="font-medium">{title}</div>
          <div className="text-sm text-neutral-500">{hint}</div>
        </div>
      </label>
      {checked && <div className="p-4 space-y-4 bg-white border-t">{children}</div>}
    </div>
  );
}

export default function EditBusinessProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM);

  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const storedToken = localStorage.getItem('token') || '';
    setToken(storedToken);

    const init = async () => {
      let me: any = null;
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
          headers: storedToken ? { Authorization: `Bearer ${storedToken}` } : {},
        });
        if (res.ok) me = (await res.json()).user;
      } catch (e) {
        console.error('Auth check failed:', e);
      }

      if (!me) {
        router.push('/auth/login');
        return;
      }

      if (!String(me.accountType || '').startsWith('business')) {
        router.replace('/profile/edit');
        return;
      }

      setUser(me);
      setAvatarPreview(me.avatarUrl || '');

      let b: any = {};
      try {
        const res = await fetch(`/api/business-info?userId=${me.id}`, { credentials: 'include' });
        if (res.ok) b = (await res.json()).businessInfo || {};
      } catch (e) {
        console.error('Error loading business info:', e);
      }

      const partner = asObject(b.partnerSearchDetails);
      const investor = asObject(b.investorSearchDetails);
      const customer = asObject(b.customerSearchDetails);
      const social = asObject(b.socialLinks);

      setLogoPreview(b.logoUrl || '');
      setBannerPreview(b.bannerUrl || '');
      setFormData({
        firstName: me.firstName || '',
        lastName: me.lastName || '',
        phone: me.phone || '',

        companyName: b.companyName || '',
        companyCode: b.companyCode || '',
        city: b.city || me.city || '',
        businessCategory: b.businessCategory || '',
        companyType: b.companyType || '',
        offerType: b.offerType || '',
        description: b.description || '',

        companyPhone: b.phone || '',
        website: b.website || '',
        telegram: b.telegram || social.telegram || '',
        viber: b.viber || '',
        instagram: social.instagram || '',
        facebook: social.facebook || '',
        address: b.address || '',
        workHours: b.workHours || '',

        seekingPartner: !!b.seekingPartner,
        seekingInvestor: !!b.seekingInvestor,
        seekingCustomer: !!b.seekingCustomer,
        seekingEmployee: !!b.seekingEmployee,
        partnerType: partner.type || '',
        partnerSphere: partner.sphere || '',
        partnerCollaboration: partner.collaboration || '',
        investmentAmount: investor.amount || '',
        investmentTerm: investor.term || '',
        investmentGoals: investor.goals || '',
        investmentOffer: investor.offer || '',
        customerTarget: customer.target || '',
        customerOffer: customer.offer || '',
        customerBenefits: customer.benefits || '',
        vacancies: asArray(b.employeeVacancies),
      });
    };

    init();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const next = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: next }));
  };

  const pickImage = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    setPreview: (url: string) => void,
    label: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError(`${label}: файл занадто великий. Максимум 10MB`);
      return;
    }
    if (file.type && !file.type.startsWith('image/')) {
      setError(`${label}: оберіть зображення`);
      return;
    }
    setError('');
    setFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const authHeaders = (json = false): Record<string, string> => {
    const headers: Record<string, string> = {};
    if (json) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const uploadImage = async (file: File, dir: 'avatars' | 'logos' | 'banners', label: string): Promise<string> => {
    const body = new FormData();
    body.append('file', file);
    body.append('type', dir);

    const response = await fetch('/api/upload', {
      method: 'POST',
      credentials: 'include',
      headers: authHeaders(),
      body,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.url) {
      throw new Error(`${label}: ${data.error || 'не вдалося завантажити зображення'}`);
    }
    return data.url as string;
  };

  const updateVacancy = (index: number, field: keyof Vacancy, value: string) => {
    setFormData((prev) => {
      const vacancies = [...prev.vacancies];
      vacancies[index] = { ...vacancies[index], [field]: value };
      return { ...prev, vacancies };
    });
  };

  const addVacancy = () => {
    setFormData((prev) => ({
      ...prev,
      vacancies: [
        ...prev.vacancies,
        { position: '', responsibilities: '', requirements: '', salary: '', employmentType: '', experience: '' },
      ],
    }));
  };

  const removeVacancy = (index: number) => {
    setFormData((prev) => ({ ...prev, vacancies: prev.vacancies.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setActiveTab('basic');
      setError("Вкажіть ім'я та прізвище представника");
      return;
    }
    if (!formData.companyName.trim()) {
      setActiveTab('company');
      setError('Вкажіть назву компанії');
      return;
    }

    setLoading(true);
    try {
      let avatarUrl = avatarPreview;
      let logoUrl = logoPreview;
      let bannerUrl = bannerPreview;

      if (avatarFile) avatarUrl = await uploadImage(avatarFile, 'avatars', 'Фото профілю');
      if (logoFile) logoUrl = await uploadImage(logoFile, 'logos', 'Логотип');
      if (bannerFile) bannerUrl = await uploadImage(bannerFile, 'banners', 'Банер');

      const profileResponse = await fetch(`/api/profile/${user.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: authHeaders(true),
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: formData.phone.trim() || null,
          avatarUrl: avatarUrl ? stripCacheBuster(avatarUrl) : null,
        }),
      });
      const profileData = await profileResponse.json().catch(() => ({}));
      if (!profileResponse.ok) {
        throw new Error(profileData.error || 'Не вдалося зберегти дані представника');
      }

      const socialLinks: Record<string, string> = {};
      if (formData.instagram.trim()) socialLinks.instagram = formData.instagram.trim();
      if (formData.facebook.trim()) socialLinks.facebook = formData.facebook.trim();
      if (formData.telegram.trim()) socialLinks.telegram = formData.telegram.trim();
      if (formData.website.trim()) socialLinks.website = formData.website.trim();

      const businessResponse = await fetch('/api/business-info', {
        method: 'PUT',
        credentials: 'include',
        headers: authHeaders(true),
        body: JSON.stringify({
          companyName: formData.companyName.trim(),
          companyCode: formData.companyCode.trim() || null,
          companyType: formData.companyType || null,
          businessCategory: formData.businessCategory || null,
          offerType: formData.offerType || null,
          city: formData.city || null,
          description: formData.description.trim() || null,

          phone: formData.companyPhone.trim() || null,
          website: formData.website.trim() || null,
          telegram: formData.telegram.trim() || null,
          viber: formData.viber.trim() || null,
          address: formData.address.trim() || null,
          workHours: formData.workHours.trim() || null,
          socialLinks,

          logoUrl: logoUrl ? stripCacheBuster(logoUrl) : null,
          bannerUrl: bannerUrl ? stripCacheBuster(bannerUrl) : null,

          seekingPartner: formData.seekingPartner,
          seekingInvestor: formData.seekingInvestor,
          seekingCustomer: formData.seekingCustomer,
          seekingEmployee: formData.seekingEmployee,
          partnerSearchDetails: formData.seekingPartner
            ? { type: formData.partnerType, sphere: formData.partnerSphere, collaboration: formData.partnerCollaboration }
            : {},
          investorSearchDetails: formData.seekingInvestor
            ? {
                amount: formData.investmentAmount,
                term: formData.investmentTerm,
                goals: formData.investmentGoals,
                offer: formData.investmentOffer,
              }
            : {},
          customerSearchDetails: formData.seekingCustomer
            ? { target: formData.customerTarget, offer: formData.customerOffer, benefits: formData.customerBenefits }
            : {},
          employeeVacancies: formData.seekingEmployee ? formData.vacancies : [],
        }),
      });
      const businessData = await businessResponse.json().catch(() => ({}));
      if (!businessResponse.ok) {
        throw new Error(businessData.error || 'Не вдалося зберегти дані компанії');
      }

      try {
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem(
          'user',
          JSON.stringify({
            ...stored,
            ...(profileData.user || {}),
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            avatarUrl: avatarUrl ? stripCacheBuster(avatarUrl) : null,
          })
        );
        window.dispatchEvent(new Event('auth:changed'));
      } catch {}

      setAvatarFile(null);
      setLogoFile(null);
      setBannerFile(null);
      setSuccess('Профіль успішно оновлено!');
      setTimeout(() => router.push(`/profile/${user.id}`), 1200);
    } catch (err: any) {
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

  const cityOptions: string[] = [...cities];
  if (formData.city && !cityOptions.includes(formData.city)) cityOptions.unshift(formData.city);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-500 to-accent-500 px-8 py-6">
            <h1 className="text-3xl font-bold text-white">Редагувати профіль</h1>
            <p className="text-primary-100 mt-2">Оновіть інформацію про себе та вашу компанію</p>
          </div>

          {/* Avatar */}
          <div className="px-8 py-6 border-b border-neutral-200">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <UserAvatar
                  src={avatarPreview}
                  alt={formData.firstName || 'Фото'}
                  fallbackName={`${formData.firstName} ${formData.lastName}`.trim() || undefined}
                  className="w-24 h-24 rounded-full object-cover border-4 border-primary-200 text-2xl"
                />
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:bg-neutral-50 transition-colors border-2 border-primary-500"
                >
                  <Camera className="w-5 h-5 text-primary-600" />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => pickImage(e, setAvatarFile, setAvatarPreview, 'Фото профілю')}
                  className="hidden"
                />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Фото профілю</h3>
                <p className="text-sm text-neutral-600 mt-1">PNG, JPG або HEIC. Макс 10MB</p>
                {avatarFile && <p className="text-sm text-primary-600 mt-1">✓ Нове фото: {avatarFile.name}</p>}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-neutral-200">
            <div className="px-8 flex space-x-8 overflow-x-auto">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    type="button"
                    className={`py-4 px-4 border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600 font-medium'
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
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</div>
            )}

            {activeTab === 'basic' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary-500" />
                  Дані представника компанії
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Ім'я" required>
                    <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className={inputClass} />
                  </Field>
                  <Field label="Прізвище" required>
                    <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className={inputClass} />
                  </Field>
                  <Field label="Телефон представника" className="md:col-span-2">
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+380..."
                      className={inputClass}
                    />
                  </Field>
                </div>
              </div>
            )}

            {activeTab === 'company' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary-500" />
                  Інформація про компанію
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Назва компанії" required className="md:col-span-2">
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="ТОВ 'Будівельна компанія'"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Код ЄДРПОУ">
                    <input type="text" name="companyCode" value={formData.companyCode} onChange={handleChange} placeholder="12345678" className={inputClass} />
                  </Field>
                  <Field label="Місто діяльності">
                    <select name="city" value={formData.city} onChange={handleChange} className={inputClass}>
                      <option value="">Оберіть місто</option>
                      {cityOptions.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Тип компанії">
                    <select name="companyType" value={formData.companyType} onChange={handleChange} className={inputClass}>
                      <option value="">Оберіть тип</option>
                      <option value="fop">ФОП</option>
                      <option value="tov">ТОВ</option>
                      <option value="other">Інше</option>
                    </select>
                  </Field>
                  <Field label="Категорія діяльності">
                    <select name="businessCategory" value={formData.businessCategory} onChange={handleChange} className={inputClass}>
                      <option value="">Оберіть категорію</option>
                      {BUSINESS_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Що пропонуєте?">
                    <select name="offerType" value={formData.offerType} onChange={handleChange} className={inputClass}>
                      <option value="">Оберіть</option>
                      <option value="service">Послуга</option>
                      <option value="product">Товар</option>
                      <option value="both">Послуги та товари</option>
                    </select>
                  </Field>
                  <Field label="Короткий опис" className="md:col-span-2">
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Що пропонує ваша компанія..."
                      className={`${inputClass} resize-none`}
                    />
                  </Field>

                  <Field label="Логотип компанії">
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => pickImage(e, setLogoFile, setLogoPreview, 'Логотип')}
                      className="hidden"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="flex flex-col items-center justify-center gap-2 w-full px-4 py-6 border-2 border-dashed border-neutral-300 rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors"
                    >
                      {logoPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={logoPreview} alt="Логотип компанії" className="w-24 h-24 object-contain" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-neutral-400" />
                      )}
                      <span className="flex items-center gap-2 text-sm text-neutral-600">
                        <Upload className="w-4 h-4" />
                        {logoFile ? logoFile.name : logoPreview ? 'Замінити логотип' : 'Завантажити логотип'}
                      </span>
                    </label>
                  </Field>

                  <Field label="Банер компанії">
                    <input
                      id="banner-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => pickImage(e, setBannerFile, setBannerPreview, 'Банер')}
                      className="hidden"
                    />
                    <label
                      htmlFor="banner-upload"
                      className="flex flex-col items-center justify-center gap-2 w-full px-4 py-6 border-2 border-dashed border-neutral-300 rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors"
                    >
                      {bannerPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={bannerPreview} alt="Банер компанії" className="w-full h-24 object-cover rounded" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-neutral-400" />
                      )}
                      <span className="flex items-center gap-2 text-sm text-neutral-600">
                        <Upload className="w-4 h-4" />
                        {bannerFile ? bannerFile.name : bannerPreview ? 'Замінити банер' : 'Завантажити банер'}
                      </span>
                    </label>
                  </Field>
                </div>
              </div>
            )}

            {activeTab === 'contacts' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-primary-500" />
                  Контакти та соцмережі компанії
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Телефон компанії">
                    <input type="tel" name="companyPhone" value={formData.companyPhone} onChange={handleChange} placeholder="+380..." className={inputClass} />
                  </Field>
                  <Field label="Viber">
                    <input type="text" name="viber" value={formData.viber} onChange={handleChange} placeholder="+380..." className={inputClass} />
                  </Field>
                  <Field label="Веб-сайт">
                    <input type="url" name="website" value={formData.website} onChange={handleChange} placeholder="https://yourcompany.com" className={inputClass} />
                  </Field>
                  <Field label="Telegram">
                    <input type="text" name="telegram" value={formData.telegram} onChange={handleChange} placeholder="https://t.me/..." className={inputClass} />
                  </Field>
                  <Field label="Instagram">
                    <input type="url" name="instagram" value={formData.instagram} onChange={handleChange} placeholder="https://instagram.com/..." className={inputClass} />
                  </Field>
                  <Field label="Facebook">
                    <input type="url" name="facebook" value={formData.facebook} onChange={handleChange} placeholder="https://facebook.com/..." className={inputClass} />
                  </Field>
                  <Field label="Адреса" className="md:col-span-2">
                    <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Місто, вулиця, будинок" className={inputClass} />
                  </Field>
                  <Field label="Графік роботи" className="md:col-span-2">
                    <input type="text" name="workHours" value={formData.workHours} onChange={handleChange} placeholder="Пн-Пт 9:00–18:00" className={inputClass} />
                  </Field>
                </div>
              </div>
            )}

            {activeTab === 'seeking' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary-500" />
                  Кого/що шукаєте?
                </h3>

                <SeekingCard
                  name="seekingPartner"
                  checked={formData.seekingPartner}
                  onChange={handleChange}
                  title="Партнера"
                  hint="Пошук ділових партнерів для співпраці"
                >
                  <Field label="Тип партнера">
                    <select name="partnerType" value={formData.partnerType} onChange={handleChange} className={inputClass}>
                      <option value="">Оберіть тип</option>
                      <option value="investor">Інвестиційний партнер</option>
                      <option value="supplier">Постачальник</option>
                      <option value="distributor">Дистриб'ютор</option>
                      <option value="franchise">Франчайзі</option>
                      <option value="strategic">Стратегічний партнер</option>
                      <option value="other">Інше</option>
                    </select>
                  </Field>
                  <Field label="Сфера співпраці">
                    <input
                      type="text"
                      name="partnerSphere"
                      value={formData.partnerSphere}
                      onChange={handleChange}
                      placeholder="Наприклад: оптові поставки, спільний маркетинг..."
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Умови співпраці">
                    <textarea
                      name="partnerCollaboration"
                      value={formData.partnerCollaboration}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Опишіть, що ви пропонуєте партнеру..."
                      className={`${inputClass} resize-none`}
                    />
                  </Field>
                </SeekingCard>

                <SeekingCard
                  name="seekingInvestor"
                  checked={formData.seekingInvestor}
                  onChange={handleChange}
                  title="Інвестора"
                  hint="Залучення інвестицій для розвитку"
                >
                  <Field label="Необхідна сума інвестицій">
                    <input
                      type="text"
                      name="investmentAmount"
                      value={formData.investmentAmount}
                      onChange={handleChange}
                      placeholder="Наприклад: від 500 000 до 1 000 000 грн"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Строк окупності">
                    <input type="text" name="investmentTerm" value={formData.investmentTerm} onChange={handleChange} placeholder="Наприклад: 18-24 місяці" className={inputClass} />
                  </Field>
                  <Field label="Цілі інвестицій">
                    <textarea
                      name="investmentGoals"
                      value={formData.investmentGoals}
                      onChange={handleChange}
                      rows={2}
                      placeholder="На що підуть інвестиції: розширення, обладнання, маркетинг..."
                      className={`${inputClass} resize-none`}
                    />
                  </Field>
                  <Field label="Що пропонуєте інвестору">
                    <textarea
                      name="investmentOffer"
                      value={formData.investmentOffer}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Частка бізнесу, дивіденди, інше..."
                      className={`${inputClass} resize-none`}
                    />
                  </Field>
                </SeekingCard>

                <SeekingCard
                  name="seekingCustomer"
                  checked={formData.seekingCustomer}
                  onChange={handleChange}
                  title="Споживача"
                  hint="Розширення клієнтської бази"
                >
                  <Field label="Цільова аудиторія">
                    <input
                      type="text"
                      name="customerTarget"
                      value={formData.customerTarget}
                      onChange={handleChange}
                      placeholder="Хто ваші клієнти: приватні особи, бізнес, вікова група..."
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Що пропонуєте">
                    <textarea
                      name="customerOffer"
                      value={formData.customerOffer}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Опишіть ваші продукти/послуги..."
                      className={`${inputClass} resize-none`}
                    />
                  </Field>
                  <Field label="Переваги для клієнтів">
                    <textarea
                      name="customerBenefits"
                      value={formData.customerBenefits}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Чому обирають вас: якість, ціна, швидкість..."
                      className={`${inputClass} resize-none`}
                    />
                  </Field>
                </SeekingCard>

                <SeekingCard
                  name="seekingEmployee"
                  checked={formData.seekingEmployee}
                  onChange={handleChange}
                  title="Працівника"
                  hint="Пошук співробітників у команду"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-neutral-900">Вакансії</h4>
                    <button
                      type="button"
                      onClick={addVacancy}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Додати вакансію
                    </button>
                  </div>

                  {formData.vacancies.length === 0 && (
                    <p className="text-sm text-neutral-500 text-center py-4">Додайте вакансії, які ви хочете опублікувати</p>
                  )}

                  {formData.vacancies.map((vacancy, index) => (
                    <div key={index} className="border border-neutral-200 rounded-lg p-4 space-y-3 bg-neutral-50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-neutral-700">Вакансія #{index + 1}</span>
                        <button type="button" onClick={() => removeVacancy(index)} className="text-red-500 hover:text-red-700" aria-label="Видалити вакансію">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Посада"
                        value={vacancy.position}
                        onChange={(e) => updateVacancy(index, 'position', e.target.value)}
                        className={inputClass}
                      />
                      <textarea
                        placeholder="Обов'язки"
                        value={vacancy.responsibilities}
                        onChange={(e) => updateVacancy(index, 'responsibilities', e.target.value)}
                        rows={2}
                        className={`${inputClass} resize-none`}
                      />
                      <textarea
                        placeholder="Вимоги"
                        value={vacancy.requirements}
                        onChange={(e) => updateVacancy(index, 'requirements', e.target.value)}
                        rows={2}
                        className={`${inputClass} resize-none`}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Зарплата (грн)"
                          value={vacancy.salary}
                          onChange={(e) => updateVacancy(index, 'salary', e.target.value)}
                          className={inputClass}
                        />
                        <select
                          value={vacancy.employmentType}
                          onChange={(e) => updateVacancy(index, 'employmentType', e.target.value)}
                          className={inputClass}
                        >
                          <option value="">Тип зайнятості</option>
                          <option value="full-time">Повна зайнятість</option>
                          <option value="part-time">Часткова зайнятість</option>
                          <option value="remote">Віддалена робота</option>
                          <option value="contract">За контрактом</option>
                          <option value="freelance">Фріланс</option>
                        </select>
                      </div>
                      <input
                        type="text"
                        placeholder="Необхідний досвід"
                        value={vacancy.experience}
                        onChange={(e) => updateVacancy(index, 'experience', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  ))}
                </SeekingCard>
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
                className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
