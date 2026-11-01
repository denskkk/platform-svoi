'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, FileText, Users, Phone, Image, Award } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { getCityName } from '@/lib/constants';

// City values are stored in the DB, so they stay in Ukrainian; only labels are translated.
const CITIES = [
  'Київ', 'Харків', 'Одеса', 'Дніпро', 'Донецьк', 'Запоріжжя', // i18n-ignore
  'Львів', 'Кривий Ріг', 'Миколаїв', 'Маріуполь', 'Вінниця', // i18n-ignore
  'Макіївка', 'Херсон', 'Чернігів', 'Полтава', 'Черкаси', // i18n-ignore
  'Хмельницький', 'Житомир', 'Суми', 'Рівне', 'Горлівка', // i18n-ignore
  'Кам\'янське', 'Кропивницький', 'Івано-Франківськ', 'Кременчук', // i18n-ignore
  'Тернопіль', 'Луцьк', 'Біла Церква', 'Краматорськ', 'Мелітополь' // i18n-ignore
];

// Cities missing from the shared city dictionary get their labels from this namespace.
const EXTRA_CITY_KEYS: Record<string, string> = {
  'Макіївка': 'makiivka', // i18n-ignore
  'Горлівка': 'horlivka', // i18n-ignore
  'Кам\'янське': 'kamianske', // i18n-ignore
  'Кропивницький': 'kropyvnytskyi', // i18n-ignore
  'Кременчук': 'kremenchuk', // i18n-ignore
  'Біла Церква': 'bila_tserkva', // i18n-ignore
  'Краматорськ': 'kramatorsk', // i18n-ignore
  'Мелітополь': 'melitopol', // i18n-ignore
};

export default function BusinessQuestionnairePage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Основна інформація
    companyName: '',
    representativeName: '',
    position: '',
    city: '',
    region: '',
    businessType: '',
    
    // Короткий опис
    description: '',
    mission: '',
    uniqueValue: '',
    
    // Послуги та товари
    servicesList: '',
    priceRange: '',
    workHours: '',
    serviceLocation: '',
    address: '',
    
    // Команда
    employeeCount: '',
    keySpecialists: '',
    teamDescription: '',
    
    // Контакти
    phone: '',
    viber: '',
    telegram: '',
    email: '',
    website: '',
    
    // Соцмережі
    instagram: '',
    facebook: '',
    tiktok: '',
    youtube: '',
    linkedin: '',
    
    // Візуальні матеріали
    logoUrl: '',
    videoUrl: '',
    
    // Відгуки
    googleReviews: '',
    facebookReviews: '',
    
    // Додаткова інформація
    yearFounded: '',
    registrationType: '',
    hasCertificates: '',
    certificatesInfo: '',
    partners: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (!storedUser || !storedToken) {
      router.push('/auth/login');
      return;
    }

    const userData = JSON.parse(storedUser);
    
    // Проверка что роль - business
    if (userData.role !== 'business') {
      router.push('/auth/questionnaire');
      return;
    }

    setUser(userData);
    setToken(storedToken);
  }, [router]);

  const cities = CITIES;
  const cityLabel = (city: string) => (EXTRA_CITY_KEYS[city] ? t(`questionnaire.cities.${EXTRA_CITY_KEYS[city]}`) : getCityName(city, locale));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Подготовка соцсетей в JSON
      const socialLinks: any = {};
      if (formData.instagram) socialLinks.instagram = formData.instagram;
      if (formData.facebook) socialLinks.facebook = formData.facebook;
      if (formData.tiktok) socialLinks.tiktok = formData.tiktok;
      if (formData.youtube) socialLinks.youtube = formData.youtube;
      if (formData.linkedin) socialLinks.linkedin = formData.linkedin;

      // Подготовка внешних отзывов
      const externalReviews: any = {};
      if (formData.googleReviews) externalReviews.google = formData.googleReviews;
      if (formData.facebookReviews) externalReviews.facebook = formData.facebookReviews;

      const response = await fetch(`/api/business-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          companyName: formData.companyName,
          representativeName: formData.representativeName || null,
          position: formData.position || null,
          city: formData.city || null,
          region: formData.region || null,
          businessType: formData.businessType || null,
          
          description: formData.description || null,
          mission: formData.mission || null,
          uniqueValue: formData.uniqueValue || null,
          
          servicesList: formData.servicesList || null,
          priceRange: formData.priceRange || null,
          workHours: formData.workHours || null,
          serviceLocation: formData.serviceLocation || null,
          address: formData.address || null,
          
          employeeCount: formData.employeeCount || null,
          keySpecialists: formData.keySpecialists || null,
          teamDescription: formData.teamDescription || null,
          
          phone: formData.phone || null,
          viber: formData.viber || null,
          telegram: formData.telegram || null,
          email: formData.email || null,
          website: formData.website || null,
          
          socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : null,
          
          logoUrl: formData.logoUrl || null,
          videoUrl: formData.videoUrl || null,
          
          externalReviews: Object.keys(externalReviews).length > 0 ? externalReviews : null,
          
          yearFounded: formData.yearFounded ? parseInt(formData.yearFounded) : null,
          registrationType: formData.registrationType || null,
          hasCertificates: formData.hasCertificates ? formData.hasCertificates === 'yes' : null,
          certificatesInfo: formData.certificatesInfo || null,
          partners: formData.partners || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('questionnaire.business.saveError'));
      }

      // Перейти на главную
      router.push('/');
    } catch (err: any) {
      setError(err.message || t('questionnaire.business.saveError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/');
  };

  const nextStep = () => {
    if (currentStep < 6) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
        <div className="text-neutral-600">{t('questionnaire.business.loading')}</div>
      </div>
    );
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
          <Building2 className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          {t('questionnaire.business.step1.title')}
        </h2>
        <p className="text-neutral-600">
          {t('questionnaire.business.step1.subtitle')}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('questionnaire.business.step1.companyName')}
          </label>
          <input
            type="text"
            name="companyName"
            required
            value={formData.companyName}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('questionnaire.business.step1.companyNamePlaceholder')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('questionnaire.business.step1.representativeName')}
            </label>
            <input
              type="text"
              name="representativeName"
              value={formData.representativeName}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder={t('questionnaire.business.step1.representativeNamePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('questionnaire.business.step1.position')}
            </label>
            <select
              name="position"
              value={formData.position}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">{t('questionnaire.business.step1.positionPlaceholder')}</option>
              <option value="owner">{t('questionnaire.business.step1.positionOwner')}</option>
              <option value="director">{t('questionnaire.business.step1.positionDirector')}</option>
              <option value="manager">{t('questionnaire.business.step1.positionManager')}</option>
              <option value="administrator">{t('questionnaire.business.step1.positionAdministrator')}</option>
              <option value="other">{t('questionnaire.business.step1.positionOther')}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('questionnaire.business.step1.city')}
            </label>
            <select
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">{t('questionnaire.business.step1.cityPlaceholder')}</option>
              {cities.map(city => (
                <option key={city} value={city}>{cityLabel(city)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('questionnaire.business.step1.region')}
            </label>
            <input
              type="text"
              name="region"
              value={formData.region}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder={t('questionnaire.business.step1.regionPlaceholder')}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('questionnaire.business.step1.businessType')}
          </label>
          <input
            type="text"
            name="businessType"
            value={formData.businessType}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('questionnaire.business.step1.businessTypePlaceholder')}
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
          <FileText className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          {t('questionnaire.business.step2.title')}
        </h2>
        <p className="text-neutral-600">
          {t('questionnaire.business.step2.subtitle')}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('questionnaire.business.step2.description')}
          </label>
          <textarea
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            placeholder={t('questionnaire.business.step2.descriptionPlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('questionnaire.business.step2.mission')}
          </label>
          <textarea
            name="mission"
            rows={2}
            value={formData.mission}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            placeholder={t('questionnaire.business.step2.missionPlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('questionnaire.business.step2.uniqueValue')}
          </label>
          <textarea
            name="uniqueValue"
            rows={3}
            value={formData.uniqueValue}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            placeholder={t('questionnaire.business.step2.uniqueValuePlaceholder')}
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
          <FileText className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          {t('questionnaire.business.step3.title')}
        </h2>
        <p className="text-neutral-600">
          {t('questionnaire.business.step3.subtitle')}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('questionnaire.business.step3.servicesList')}
          </label>
          <textarea
            name="servicesList"
            rows={3}
            value={formData.servicesList}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            placeholder={t('questionnaire.business.step3.servicesListPlaceholder')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('questionnaire.business.step3.priceRange')}
            </label>
            <select
              name="priceRange"
              value={formData.priceRange}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">{t('questionnaire.business.step3.priceRangePlaceholder')}</option>
              <option value="budget">{t('questionnaire.business.step3.priceBudget')}</option>
              <option value="medium">{t('questionnaire.business.step3.priceMedium')}</option>
              <option value="premium">{t('questionnaire.business.step3.pricePremium')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('questionnaire.business.step3.workHours')}
            </label>
            <input
              type="text"
              name="workHours"
              value={formData.workHours}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder={t('questionnaire.business.step3.workHoursPlaceholder')}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('questionnaire.business.step3.serviceLocation')}
          </label>
          <input
            type="text"
            name="serviceLocation"
            value={formData.serviceLocation}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('questionnaire.business.step3.serviceLocationPlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('questionnaire.business.step3.address')}
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('questionnaire.business.step3.addressPlaceholder')}
          />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
          <Users className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          {t('questionnaire.business.step4.title')}
        </h2>
        <p className="text-neutral-600">
          {t('questionnaire.business.step4.subtitle')}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('questionnaire.business.step4.employeeCount')}
          </label>
          <select
            name="employeeCount"
            value={formData.employeeCount}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">{t('questionnaire.business.step4.employeeCountPlaceholder')}</option>
            <option value="1">{t('questionnaire.business.step4.employeeOnlyMe')}</option>
            <option value="2-5">{t('questionnaire.business.step4.employee2to5')}</option>
            <option value="6-10">{t('questionnaire.business.step4.employee6to10')}</option>
            <option value="11-50">{t('questionnaire.business.step4.employee11to50')}</option>
            <option value="50+">{t('questionnaire.business.step4.employee50plus')}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('questionnaire.business.step4.keySpecialists')}
          </label>
          <textarea
            name="keySpecialists"
            rows={3}
            value={formData.keySpecialists}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            placeholder={t('questionnaire.business.step4.keySpecialistsPlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('questionnaire.business.step4.teamDescription')}
          </label>
          <textarea
            name="teamDescription"
            rows={3}
            value={formData.teamDescription}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            placeholder={t('questionnaire.business.step4.teamDescriptionPlaceholder')}
          />
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
          <Phone className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          {t('questionnaire.business.step5.title')}
        </h2>
        <p className="text-neutral-600">
          {t('questionnaire.business.step5.subtitle')}
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('questionnaire.business.step5.phone')}
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
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="info@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Viber
            </label>
            <input
              type="text"
              name="viber"
              value={formData.viber}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="@username"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('questionnaire.business.step5.website')}
          </label>
          <input
            type="url"
            name="website"
            value={formData.website}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="https://yoursite.com"
          />
        </div>

        <div className="border-t pt-4">
          <h3 className="font-medium text-neutral-900 mb-3">{t('questionnaire.business.step5.socialTitle')}</h3>
          <div className="space-y-3">
            <input
              type="url"
              name="instagram"
              value={formData.instagram}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Instagram: https://instagram.com/..."
            />
            <input
              type="url"
              name="facebook"
              value={formData.facebook}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Facebook: https://facebook.com/..."
            />
            <input
              type="url"
              name="tiktok"
              value={formData.tiktok}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="TikTok: https://tiktok.com/@..."
            />
            <input
              type="url"
              name="youtube"
              value={formData.youtube}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="YouTube: https://youtube.com/..."
            />
            <input
              type="url"
              name="linkedin"
              value={formData.linkedin}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="LinkedIn: https://linkedin.com/..."
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
          <Award className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          {t('questionnaire.business.step6.title')}
        </h2>
        <p className="text-neutral-600">
          {t('questionnaire.business.step6.subtitle')}
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('questionnaire.business.step6.yearFounded')}
            </label>
            <input
              type="number"
              name="yearFounded"
              min="1900"
              max="2025"
              value={formData.yearFounded}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="2020"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('questionnaire.business.step6.registrationType')}
            </label>
            <select
              name="registrationType"
              value={formData.registrationType}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">{t('questionnaire.business.common.notSpecified')}</option>
              <option value="fop">{t('questionnaire.business.step6.registrationFop')}</option>
              <option value="tov">{t('questionnaire.business.step6.registrationTov')}</option>
              <option value="pp">{t('questionnaire.business.step6.registrationPp')}</option>
              <option value="other">{t('questionnaire.business.step6.registrationOther')}</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('questionnaire.business.step6.hasCertificates')}
          </label>
          <select
            name="hasCertificates"
            value={formData.hasCertificates}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">{t('questionnaire.business.common.notSpecified')}</option>
            <option value="yes">{t('questionnaire.business.common.yes')}</option>
            <option value="no">{t('questionnaire.business.common.no')}</option>
          </select>
        </div>

        {formData.hasCertificates === 'yes' && (
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('questionnaire.business.step6.certificatesInfo')}
            </label>
            <textarea
              name="certificatesInfo"
              rows={2}
              value={formData.certificatesInfo}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder={t('questionnaire.business.step6.certificatesInfoPlaceholder')}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('questionnaire.business.step6.partners')}
          </label>
          <textarea
            name="partners"
            rows={2}
            value={formData.partners}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            placeholder={t('questionnaire.business.step6.partnersPlaceholder')}
          />
        </div>

        <div className="border-t pt-4">
          <h3 className="font-medium text-neutral-900 mb-3">{t('questionnaire.business.step6.externalReviewsTitle')}</h3>
          <div className="space-y-3">
            <input
              type="url"
              name="googleReviews"
              value={formData.googleReviews}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Google Reviews: https://..."
            />
            <input
              type="url"
              name="facebookReviews"
              value={formData.facebookReviews}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Facebook Reviews: https://..."
            />
          </div>
        </div>

        <div className="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <p className="text-sm text-neutral-600 text-center">
            💡 <strong>{t('questionnaire.business.step6.tipLabel')}</strong> {t('questionnaire.business.step6.tipText')}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Progress Bar */}
          <div className="bg-neutral-100 px-8 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-700">
                {t('questionnaire.business.progress.step', { current: currentStep })}
              </span>
              <span className="text-sm text-neutral-600">
                {Math.round((currentStep / 6) * 100)}%
              </span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 6) * 100}%` }}
              />
            </div>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
              {currentStep === 4 && renderStep4()}
              {currentStep === 5 && renderStep5()}
              {currentStep === 6 && renderStep6()}

              {/* Navigation Buttons */}
              <div className="flex gap-4 mt-8">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={loading}
                    className="px-6 py-3 border-2 border-neutral-300 rounded-lg font-medium text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50"
                  >
                    {t('questionnaire.business.nav.back')}
                  </button>
                )}

                {currentStep < 6 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={loading}
                    className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {t('questionnaire.business.nav.next')}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? t('questionnaire.business.nav.saving') : t('questionnaire.business.nav.finish')}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={loading}
                  className="px-6 py-3 border border-neutral-300 rounded-lg font-medium text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-50"
                >
                  {t('questionnaire.business.nav.skip')}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center text-sm text-neutral-500">
              <p>{t('questionnaire.business.nav.footerNote')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
