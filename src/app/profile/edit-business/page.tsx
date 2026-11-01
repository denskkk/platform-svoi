'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, User, Camera, Image as ImageIcon, Users, Phone, Plus, Trash2, Upload } from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { cities, getCityName } from '@/lib/constants';
import { useI18n } from '@/i18n/client';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

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
  'education',
  'products',
  'advertising',
  'online_sales',
  'offline_sales',
  'auto_service',
  'construction',
  'it',
  'other',
];

const TABS = [
  { id: 'basic', icon: User },
  { id: 'company', icon: Building2 },
  { id: 'contacts', icon: Phone },
  { id: 'seeking', icon: Users },
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
  const { t, locale } = useI18n();
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
      setError(t('profileEdit.business.errors.fileTooLarge', { label }));
      return;
    }
    if (file.type && !file.type.startsWith('image/')) {
      setError(t('profileEdit.business.errors.notImage', { label }));
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
      throw new Error(t('profileEdit.business.errors.upload', { label, error: data.error || t('profileEdit.business.errors.uploadFallback') }));
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
      setError(t('profileEdit.business.errors.representativeRequired'));
      return;
    }
    if (!formData.companyName.trim()) {
      setActiveTab('company');
      setError(t('profileEdit.business.errors.companyNameRequired'));
      return;
    }

    setLoading(true);
    try {
      let avatarUrl = avatarPreview;
      let logoUrl = logoPreview;
      let bannerUrl = bannerPreview;

      if (avatarFile) avatarUrl = await uploadImage(avatarFile, 'avatars', t('profileEdit.avatar.title'));
      if (logoFile) logoUrl = await uploadImage(logoFile, 'logos', t('profileEdit.business.labels.logo'));
      if (bannerFile) bannerUrl = await uploadImage(bannerFile, 'banners', t('profileEdit.business.labels.banner'));

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
        throw new Error(profileData.error || t('profileEdit.business.errors.saveRepresentative'));
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
        throw new Error(businessData.error || t('profileEdit.business.errors.saveCompany'));
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
      setSuccess(t('profileEdit.success.updated'));
      setTimeout(() => router.push(`/profile/${user.id}`), 1200);
    } catch (err: any) {
      setError(err.message || t('profileEdit.errors.save'));
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
        <div className="text-neutral-600">{t('profileEdit.loading')}</div>
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
            <h1 className="text-3xl font-bold text-white">{t('profileEdit.header.title')}</h1>
            <p className="text-primary-100 mt-2">{t('profileEdit.business.header.subtitle')}</p>
          </div>

          {/* Interface language */}
          <div className="px-8 py-6 border-b border-neutral-200">
            <h3 className="font-semibold text-neutral-900">{t('profileEdit.language.title')}</h3>
            <p className="text-sm text-neutral-600 mt-1 mb-3">{t('profileEdit.language.description')}</p>
            <LanguageSwitcher variant="buttons" />
          </div>

          {/* Avatar */}
          <div className="px-8 py-6 border-b border-neutral-200">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <UserAvatar
                  src={avatarPreview}
                  alt={formData.firstName || t('profileEdit.business.labels.photoAlt')}
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
                  onChange={(e) => pickImage(e, setAvatarFile, setAvatarPreview, t('profileEdit.avatar.title'))}
                  className="hidden"
                />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">{t('profileEdit.avatar.title')}</h3>
                <p className="text-sm text-neutral-600 mt-1">{t('profileEdit.avatar.hint')}</p>
                {avatarFile && <p className="text-sm text-primary-600 mt-1">{t('profileEdit.avatar.newPhoto', { name: avatarFile.name })}</p>}
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
                    {t(`profileEdit.business.tabs.${tab.id}`)}
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
                  {t('profileEdit.business.basic.title')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label={t('profileEdit.business.basic.firstName')} required>
                    <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className={inputClass} />
                  </Field>
                  <Field label={t('profileEdit.business.basic.lastName')} required>
                    <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className={inputClass} />
                  </Field>
                  <Field label={t('profileEdit.business.basic.phone')} className="md:col-span-2">
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
                  {t('profileEdit.business.company.title')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label={t('profileEdit.business.company.name')} required className="md:col-span-2">
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder={t('profileEdit.business.company.namePlaceholder')}
                      className={inputClass}
                    />
                  </Field>
                  <Field label={t('profileEdit.business.company.code')}>
                    <input type="text" name="companyCode" value={formData.companyCode} onChange={handleChange} placeholder="12345678" className={inputClass} />
                  </Field>
                  <Field label={t('profileEdit.business.company.city')}>
                    <select name="city" value={formData.city} onChange={handleChange} className={inputClass}>
                      <option value="">{t('profileEdit.location.selectCity')}</option>
                      {cityOptions.map((city) => (
                        <option key={city} value={city}>
                          {getCityName(city, locale)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t('profileEdit.business.company.type')}>
                    <select name="companyType" value={formData.companyType} onChange={handleChange} className={inputClass}>
                      <option value="">{t('profileEdit.business.company.selectType')}</option>
                      <option value="fop">{t('profileEdit.business.options.companyType.fop')}</option>
                      <option value="tov">{t('profileEdit.business.options.companyType.tov')}</option>
                      <option value="other">{t('profileEdit.business.options.companyType.other')}</option>
                    </select>
                  </Field>
                  <Field label={t('profileEdit.business.company.category')}>
                    <select name="businessCategory" value={formData.businessCategory} onChange={handleChange} className={inputClass}>
                      <option value="">{t('profileEdit.business.company.selectCategory')}</option>
                      {BUSINESS_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {t(`profileEdit.business.options.businessCategory.${cat}`)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t('profileEdit.business.company.offerType')}>
                    <select name="offerType" value={formData.offerType} onChange={handleChange} className={inputClass}>
                      <option value="">{t('profileEdit.business.company.select')}</option>
                      <option value="service">{t('profileEdit.business.options.offerType.service')}</option>
                      <option value="product">{t('profileEdit.business.options.offerType.product')}</option>
                      <option value="both">{t('profileEdit.business.options.offerType.both')}</option>
                    </select>
                  </Field>
                  <Field label={t('profileEdit.business.company.description')} className="md:col-span-2">
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      placeholder={t('profileEdit.business.company.descriptionPlaceholder')}
                      className={`${inputClass} resize-none`}
                    />
                  </Field>

                  <Field label={t('profileEdit.business.company.logoLabel')}>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => pickImage(e, setLogoFile, setLogoPreview, t('profileEdit.business.labels.logo'))}
                      className="hidden"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="flex flex-col items-center justify-center gap-2 w-full px-4 py-6 border-2 border-dashed border-neutral-300 rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors"
                    >
                      {logoPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={logoPreview} alt={t('profileEdit.business.company.logoAlt')} className="w-24 h-24 object-contain" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-neutral-400" />
                      )}
                      <span className="flex items-center gap-2 text-sm text-neutral-600">
                        <Upload className="w-4 h-4" />
                        {logoFile ? logoFile.name : logoPreview ? t('profileEdit.business.company.replaceLogo') : t('profileEdit.business.company.uploadLogo')}
                      </span>
                    </label>
                  </Field>

                  <Field label={t('profileEdit.business.company.bannerLabel')}>
                    <input
                      id="banner-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => pickImage(e, setBannerFile, setBannerPreview, t('profileEdit.business.labels.banner'))}
                      className="hidden"
                    />
                    <label
                      htmlFor="banner-upload"
                      className="flex flex-col items-center justify-center gap-2 w-full px-4 py-6 border-2 border-dashed border-neutral-300 rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors"
                    >
                      {bannerPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={bannerPreview} alt={t('profileEdit.business.company.bannerAlt')} className="w-full h-24 object-cover rounded" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-neutral-400" />
                      )}
                      <span className="flex items-center gap-2 text-sm text-neutral-600">
                        <Upload className="w-4 h-4" />
                        {bannerFile ? bannerFile.name : bannerPreview ? t('profileEdit.business.company.replaceBanner') : t('profileEdit.business.company.uploadBanner')}
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
                  {t('profileEdit.business.contacts.title')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label={t('profileEdit.business.contacts.companyPhone')}>
                    <input type="tel" name="companyPhone" value={formData.companyPhone} onChange={handleChange} placeholder="+380..." className={inputClass} />
                  </Field>
                  <Field label="Viber">
                    <input type="text" name="viber" value={formData.viber} onChange={handleChange} placeholder="+380..." className={inputClass} />
                  </Field>
                  <Field label={t('profileEdit.business.contacts.website')}>
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
                  <Field label={t('profileEdit.business.contacts.address')} className="md:col-span-2">
                    <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder={t('profileEdit.business.contacts.addressPlaceholder')} className={inputClass} />
                  </Field>
                  <Field label={t('profileEdit.business.contacts.workHours')} className="md:col-span-2">
                    <input type="text" name="workHours" value={formData.workHours} onChange={handleChange} placeholder={t('profileEdit.business.contacts.workHoursPlaceholder')} className={inputClass} />
                  </Field>
                </div>
              </div>
            )}

            {activeTab === 'seeking' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary-500" />
                  {t('profileEdit.business.seeking.title')}
                </h3>

                <SeekingCard
                  name="seekingPartner"
                  checked={formData.seekingPartner}
                  onChange={handleChange}
                  title={t('profileEdit.business.seeking.partner.title')}
                  hint={t('profileEdit.business.seeking.partner.hint')}
                >
                  <Field label={t('profileEdit.business.seeking.partner.type')}>
                    <select name="partnerType" value={formData.partnerType} onChange={handleChange} className={inputClass}>
                      <option value="">{t('profileEdit.business.company.selectType')}</option>
                      <option value="investor">{t('profileEdit.business.options.partnerType.investor')}</option>
                      <option value="supplier">{t('profileEdit.business.options.partnerType.supplier')}</option>
                      <option value="distributor">{t('profileEdit.business.options.partnerType.distributor')}</option>
                      <option value="franchise">{t('profileEdit.business.options.partnerType.franchise')}</option>
                      <option value="strategic">{t('profileEdit.business.options.partnerType.strategic')}</option>
                      <option value="other">{t('profileEdit.business.options.partnerType.other')}</option>
                    </select>
                  </Field>
                  <Field label={t('profileEdit.business.seeking.partner.sphere')}>
                    <input
                      type="text"
                      name="partnerSphere"
                      value={formData.partnerSphere}
                      onChange={handleChange}
                      placeholder={t('profileEdit.business.seeking.partner.spherePlaceholder')}
                      className={inputClass}
                    />
                  </Field>
                  <Field label={t('profileEdit.business.seeking.partner.collaboration')}>
                    <textarea
                      name="partnerCollaboration"
                      value={formData.partnerCollaboration}
                      onChange={handleChange}
                      rows={3}
                      placeholder={t('profileEdit.business.seeking.partner.collaborationPlaceholder')}
                      className={`${inputClass} resize-none`}
                    />
                  </Field>
                </SeekingCard>

                <SeekingCard
                  name="seekingInvestor"
                  checked={formData.seekingInvestor}
                  onChange={handleChange}
                  title={t('profileEdit.business.seeking.investor.title')}
                  hint={t('profileEdit.business.seeking.investor.hint')}
                >
                  <Field label={t('profileEdit.business.seeking.investor.amount')}>
                    <input
                      type="text"
                      name="investmentAmount"
                      value={formData.investmentAmount}
                      onChange={handleChange}
                      placeholder={t('profileEdit.business.seeking.investor.amountPlaceholder')}
                      className={inputClass}
                    />
                  </Field>
                  <Field label={t('profileEdit.business.seeking.investor.term')}>
                    <input type="text" name="investmentTerm" value={formData.investmentTerm} onChange={handleChange} placeholder={t('profileEdit.business.seeking.investor.termPlaceholder')} className={inputClass} />
                  </Field>
                  <Field label={t('profileEdit.business.seeking.investor.goals')}>
                    <textarea
                      name="investmentGoals"
                      value={formData.investmentGoals}
                      onChange={handleChange}
                      rows={2}
                      placeholder={t('profileEdit.business.seeking.investor.goalsPlaceholder')}
                      className={`${inputClass} resize-none`}
                    />
                  </Field>
                  <Field label={t('profileEdit.business.seeking.investor.offer')}>
                    <textarea
                      name="investmentOffer"
                      value={formData.investmentOffer}
                      onChange={handleChange}
                      rows={2}
                      placeholder={t('profileEdit.business.seeking.investor.offerPlaceholder')}
                      className={`${inputClass} resize-none`}
                    />
                  </Field>
                </SeekingCard>

                <SeekingCard
                  name="seekingCustomer"
                  checked={formData.seekingCustomer}
                  onChange={handleChange}
                  title={t('profileEdit.business.seeking.customer.title')}
                  hint={t('profileEdit.business.seeking.customer.hint')}
                >
                  <Field label={t('profileEdit.business.seeking.customer.target')}>
                    <input
                      type="text"
                      name="customerTarget"
                      value={formData.customerTarget}
                      onChange={handleChange}
                      placeholder={t('profileEdit.business.seeking.customer.targetPlaceholder')}
                      className={inputClass}
                    />
                  </Field>
                  <Field label={t('profileEdit.business.seeking.customer.offer')}>
                    <textarea
                      name="customerOffer"
                      value={formData.customerOffer}
                      onChange={handleChange}
                      rows={2}
                      placeholder={t('profileEdit.business.seeking.customer.offerPlaceholder')}
                      className={`${inputClass} resize-none`}
                    />
                  </Field>
                  <Field label={t('profileEdit.business.seeking.customer.benefits')}>
                    <textarea
                      name="customerBenefits"
                      value={formData.customerBenefits}
                      onChange={handleChange}
                      rows={2}
                      placeholder={t('profileEdit.business.seeking.customer.benefitsPlaceholder')}
                      className={`${inputClass} resize-none`}
                    />
                  </Field>
                </SeekingCard>

                <SeekingCard
                  name="seekingEmployee"
                  checked={formData.seekingEmployee}
                  onChange={handleChange}
                  title={t('profileEdit.business.seeking.employee.title')}
                  hint={t('profileEdit.business.seeking.employee.hint')}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-neutral-900">{t('profileEdit.business.seeking.employee.vacancies')}</h4>
                    <button
                      type="button"
                      onClick={addVacancy}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      {t('profileEdit.business.seeking.employee.addVacancy')}
                    </button>
                  </div>

                  {formData.vacancies.length === 0 && (
                    <p className="text-sm text-neutral-500 text-center py-4">{t('profileEdit.business.seeking.employee.empty')}</p>
                  )}

                  {formData.vacancies.map((vacancy, index) => (
                    <div key={index} className="border border-neutral-200 rounded-lg p-4 space-y-3 bg-neutral-50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-neutral-700">{t('profileEdit.business.seeking.employee.vacancyNumber', { number: index + 1 })}</span>
                        <button type="button" onClick={() => removeVacancy(index)} className="text-red-500 hover:text-red-700" aria-label={t('profileEdit.business.seeking.employee.removeVacancy')}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder={t('profileEdit.business.seeking.employee.position')}
                        value={vacancy.position}
                        onChange={(e) => updateVacancy(index, 'position', e.target.value)}
                        className={inputClass}
                      />
                      <textarea
                        placeholder={t('profileEdit.business.seeking.employee.responsibilities')}
                        value={vacancy.responsibilities}
                        onChange={(e) => updateVacancy(index, 'responsibilities', e.target.value)}
                        rows={2}
                        className={`${inputClass} resize-none`}
                      />
                      <textarea
                        placeholder={t('profileEdit.business.seeking.employee.requirements')}
                        value={vacancy.requirements}
                        onChange={(e) => updateVacancy(index, 'requirements', e.target.value)}
                        rows={2}
                        className={`${inputClass} resize-none`}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder={t('profileEdit.business.seeking.employee.salary')}
                          value={vacancy.salary}
                          onChange={(e) => updateVacancy(index, 'salary', e.target.value)}
                          className={inputClass}
                        />
                        <select
                          value={vacancy.employmentType}
                          onChange={(e) => updateVacancy(index, 'employmentType', e.target.value)}
                          className={inputClass}
                        >
                          <option value="">{t('profileEdit.business.seeking.employee.employmentType')}</option>
                          <option value="full-time">{t('profileEdit.business.options.employmentType.fullTime')}</option>
                          <option value="part-time">{t('profileEdit.business.options.employmentType.partTime')}</option>
                          <option value="remote">{t('profileEdit.business.options.employmentType.remote')}</option>
                          <option value="contract">{t('profileEdit.business.options.employmentType.contract')}</option>
                          <option value="freelance">{t('profileEdit.business.options.employmentType.freelance')}</option>
                        </select>
                      </div>
                      <input
                        type="text"
                        placeholder={t('profileEdit.business.seeking.employee.experience')}
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
                {t('profileEdit.actions.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('profileEdit.actions.saving') : t('profileEdit.actions.save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
