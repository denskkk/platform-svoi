'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, MapPin, Briefcase, Heart, Car, Globe, Target } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { getCityName } from '@/lib/constants';

// Option values are stored in the DB, so they stay in Ukrainian; only labels are translated via `key`.
const OTHER_OPTION = 'Інше'; // i18n-ignore

const OTHER_TRANSPORT_OPTIONS = [
  { value: 'Велосипед', key: 'bicycle' }, // i18n-ignore
  { value: 'Самокат', key: 'scooter' }, // i18n-ignore
  { value: 'Мотоцикл', key: 'motorcycle' }, // i18n-ignore
  { value: 'Скейт', key: 'skateboard' }, // i18n-ignore
  { value: 'Гірський велосипед', key: 'mountainBike' }, // i18n-ignore
  { value: OTHER_OPTION, key: 'other' },
];

const PETS_OPTIONS = [
  { value: 'Кіт', key: 'cat' }, // i18n-ignore
  { value: 'Собака', key: 'dog' }, // i18n-ignore
  { value: 'Птахи', key: 'birds' }, // i18n-ignore
  { value: 'Рибки', key: 'fish' }, // i18n-ignore
  { value: 'Гризуни', key: 'rodents' }, // i18n-ignore
  { value: 'Немає', key: 'none' }, // i18n-ignore
  { value: OTHER_OPTION, key: 'other' },
];

const HOBBIES_OPTIONS = [
  { value: 'Музика', key: 'music' }, // i18n-ignore
  { value: 'Кіно', key: 'movies' }, // i18n-ignore
  { value: 'Читання', key: 'reading' }, // i18n-ignore
  { value: 'Подорожі', key: 'travel' }, // i18n-ignore
  { value: 'Фотографія', key: 'photography' }, // i18n-ignore
  { value: 'Малювання', key: 'drawing' }, // i18n-ignore
  { value: 'Рукоділля', key: 'handicrafts' }, // i18n-ignore
  { value: 'Кулінарія', key: 'cooking' }, // i18n-ignore
  { value: OTHER_OPTION, key: 'other' },
];

const OUTDOOR_OPTIONS = [
  { value: 'Прогулянки', key: 'walks' }, // i18n-ignore
  { value: 'Пікніки', key: 'picnics' }, // i18n-ignore
  { value: 'Походи', key: 'hiking' }, // i18n-ignore
  { value: 'Риболовля', key: 'fishing' }, // i18n-ignore
  { value: 'Поїздки на природу', key: 'natureTrips' }, // i18n-ignore
  { value: 'Покатушки на велосипеді', key: 'cycling' }, // i18n-ignore
  { value: OTHER_OPTION, key: 'other' },
];

const SPORTS_OPTIONS = [
  { value: 'Футбол', key: 'football' }, // i18n-ignore
  { value: 'Баскетбол', key: 'basketball' }, // i18n-ignore
  { value: 'Плавання', key: 'swimming' }, // i18n-ignore
  { value: 'Біг', key: 'running' }, // i18n-ignore
  { value: 'Тренажерний зал', key: 'gym' }, // i18n-ignore
  { value: 'Йога', key: 'yoga' }, // i18n-ignore
  { value: 'Велоспорт', key: 'cycling' }, // i18n-ignore
  { value: OTHER_OPTION, key: 'other' },
];

const LIFESTYLE_OPTIONS = [
  { value: 'Активний', key: 'active' }, // i18n-ignore
  { value: 'Спокійний', key: 'calm' }, // i18n-ignore
  { value: 'Сімейний', key: 'family' }, // i18n-ignore
  { value: 'Соціальний', key: 'social' }, // i18n-ignore
  { value: 'Творчий', key: 'creative' }, // i18n-ignore
  { value: 'Кар\'єрний', key: 'career' }, // i18n-ignore
  { value: OTHER_OPTION, key: 'other' },
];

const SITE_USAGE_GOAL_OPTIONS = [
  { value: 'Знайти клієнтів', key: 'findClients' }, // i18n-ignore
  { value: 'Знайти підрядників/послуги', key: 'findContractors' }, // i18n-ignore
  { value: 'Пошук роботи', key: 'jobSearch' }, // i18n-ignore
  { value: 'Спілкування/мережування', key: 'networking' }, // i18n-ignore
  { value: OTHER_OPTION, key: 'other' },
];

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

export default function QuestionnairePage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(1);
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
    otherTransport: [] as string[],
    otherTransportOther: '',
    
    // Професійна діяльність
    profession: '',
    employmentStatus: '',
    workplace: '',
    education: '',
    businessInfo: '',
    jobSeeking: '',
    
    // Домашні тварини
    hasPets: '',
    petsInfo: [] as string[],
    petsInfoOther: '',
    
    // Інтереси
    hobbies: [] as string[],
    hobbiesOther: '',
    outdoorActivities: [] as string[],
    outdoorActivitiesOther: '',
    lifestyle: [] as string[],
    lifestyleOther: '',
    sports: [] as string[],
    sportsOther: '',
    bio: '',
    
    // Соцмережі
    instagram: '',
    facebook: '',
    telegram: '',
    tiktok: '',
    // Мета використання
    siteUsageGoal: [] as string[],
    siteUsageGoalOther: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      // Получить данные пользователя из localStorage
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      
      let userData: any = null;

      // If we have localStorage user+token prefer them, otherwise try httpOnly cookie via /api/auth/me
      if (storedUser && storedToken) {
        try {
          userData = JSON.parse(storedUser);
          setUser(userData);
          setToken(storedToken);
        } catch {}
      } else {
        try {
          const meRes = await fetch('/api/auth/me', { credentials: 'include' });
          if (meRes.ok) {
            const meJson = await meRes.json();
            if (meJson?.user) {
              userData = meJson.user;
              setUser(userData);
              // token remains from localStorage if present, otherwise empty (we will use cookie auth)
            }
          }
        } catch (e) {
          console.warn('auth/me failed', e);
        }
      }

      if (!userData) {
        router.push('/auth/login');
        return;
      }

      // Заполнить форму базовыми данными из регистрации/профиля
      setFormData(prev => ({
        ...prev,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        city: userData.city || '',
      }));

      // Также попытаться получить профиль с сервера и заполнить поля для редактирования
      try {
        const res = await fetch(`/api/profile/${userData.id}`, { credentials: 'include' });
        if (!res.ok) return;
        const json = await res.json();
        const u = json.user;
        if (!u) return;

        // Вспомогательная функция: перевод строки CSV -> string[]
        const csvToArray = (val: any) => {
          if (!val) return [] as string[];
          if (Array.isArray(val)) return val;
          if (typeof val === 'string') {
            return val.split(',').map((s) => s.trim()).filter(Boolean);
          }
          return [] as string[];
        };

        const mapOther = (arr: string[], known: string[]) => {
          // Если есть элементы, не в known — помечаем как 'Інше' и сохраняем текст
          const otherItems = arr.filter(a => !known.includes(a));
          const filtered = arr.filter(a => known.includes(a));
          if (otherItems.length) {
            return { values: [...filtered, OTHER_OPTION], other: otherItems.join(', ') };
          }
          return { values: filtered, other: '' };
        };

        const otherTransportKnown = ['Автомобіль', 'Громадський транспорт', 'Велосипед', 'Пішки', 'Таксі', 'Інше']; // i18n-ignore
        const petsKnown = ['Собака', 'Кіт', 'Птахи', 'Риби', 'Інше']; // i18n-ignore
        const hobbiesKnown = ['Читання', 'Музика', 'Кіно', 'Подорожі', 'Кулінарія', 'Інше']; // i18n-ignore
        const outdoorKnown = ['Похід', 'Пікнік', 'Пляж', 'Парки', 'Інше']; // i18n-ignore
        const lifestyleKnown = ['Еко', 'Мінімалізм', 'Здоровий спосіб життя', 'Вегетаріанство', 'Інше']; // i18n-ignore
        const sportsKnown = ['Футбол', 'Біг', 'Тренажерний зал', 'Йога', 'Інше']; // i18n-ignore

        const ot = mapOther(csvToArray(u.otherTransport), otherTransportKnown);
        const pets = mapOther(csvToArray(u.petsInfo), petsKnown);
        const hobbies = mapOther(csvToArray(u.hobbies), hobbiesKnown);
        const outdoor = mapOther(csvToArray(u.outdoorActivities), outdoorKnown);
        const lifestyle = mapOther(csvToArray(u.lifestyle), lifestyleKnown);
        const sports = mapOther(csvToArray(u.sports), sportsKnown);

        setFormData(prev => ({
          ...prev,
          middleName: u.middleName || prev.middleName,
          phone: u.phone || prev.phone,
          age: u.age ? String(u.age) : prev.age,
          gender: u.gender || prev.gender,
          maritalStatus: u.maritalStatus || prev.maritalStatus,
          familyComposition: u.familyComposition || prev.familyComposition,
          childrenCount: u.childrenCount ? String(u.childrenCount) : prev.childrenCount,
          city: u.city || prev.city,
          region: u.region || prev.region,
          housingType: u.housingType || prev.housingType,
          livingSituation: u.livingSituation || prev.livingSituation,
          hasCar: typeof u.hasCar === 'boolean' ? (u.hasCar ? 'yes' : 'no') : prev.hasCar,
          carInfo: u.carInfo || prev.carInfo,
          otherTransport: ot.values,
          otherTransportOther: ot.other,
          profession: u.profession || prev.profession,
          employmentStatus: u.employmentStatus || prev.employmentStatus,
          workplace: u.workplace || prev.workplace,
          education: u.educationLevel || u.educationDetails || prev.education,
          businessInfo: u.privateBusinessInfo || prev.businessInfo,
          jobSeeking: u.jobSeeking || prev.jobSeeking,
          hasPets: typeof u.hasPets === 'boolean' ? (u.hasPets ? 'yes' : 'no') : prev.hasPets,
          petsInfo: pets.values,
          petsInfoOther: pets.other,
          hobbies: hobbies.values,
          hobbiesOther: hobbies.other,
          outdoorActivities: outdoor.values,
          outdoorActivitiesOther: outdoor.other,
          lifestyle: lifestyle.values,
          lifestyleOther: lifestyle.other,
          sports: sports.values,
          sportsOther: sports.other,
          bio: u.bio || prev.bio,
          instagram: u.socialLinks?.instagram || prev.instagram,
          facebook: u.socialLinks?.facebook || prev.facebook,
          telegram: u.socialLinks?.telegram || prev.telegram,
          tiktok: u.socialLinks?.tiktok || prev.tiktok,
          siteUsageGoal: csvToArray(u.siteUsageGoal),
          siteUsageGoalOther: '',
        }));
      } catch (e) {
        console.warn('Failed to fetch profile for questionnaire prefill', e);
      }
    })();
  }, [router]);

  const cities = CITIES;
  const cityLabel = (city: string) => (EXTRA_CITY_KEYS[city] ? t(`questionnaire.cities.${EXTRA_CITY_KEYS[city]}`) : getCityName(city, locale));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCheckboxChange = (name: string, value: string) => {
    const current = (formData as any)[name];
    if (!Array.isArray(current)) return;
    const exists = current.includes(value);
    const updated = exists ? current.filter((v: string) => v !== value) : [...current, value];
    setFormData({ ...formData, [name]: updated });
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
      if (formData.telegram) socialLinks.telegram = formData.telegram;
      if (formData.tiktok) socialLinks.tiktok = formData.tiktok;

      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`/api/profile/${user.id}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          firstName: formData.firstName,
          middleName: formData.middleName || null,
          lastName: formData.lastName,
          phone: formData.phone || null,
          city: formData.city,
          region: formData.region || null,
          
          gender: formData.gender || null,
          age: formData.age ? parseInt(formData.age) : null,
          maritalStatus: formData.maritalStatus || null,
          familyComposition: formData.familyComposition || null,
          childrenCount: formData.childrenCount ? parseInt(formData.childrenCount) : null,
          
          housingType: formData.housingType || null,
          livingSituation: formData.livingSituation || null,
          
          hasCar: formData.hasCar ? formData.hasCar === 'yes' : null,
          carInfo: formData.carInfo || null,
          otherTransport: Array.isArray(formData.otherTransport)
            ? (formData.otherTransport
                .map((v: string) => (v === OTHER_OPTION && formData.otherTransportOther ? formData.otherTransportOther : v))
                .filter(Boolean)
                .join(', ') || null)
            : formData.otherTransport || null,
          
          profession: formData.profession || null,
          employmentStatus: formData.employmentStatus || null,
          workplace: formData.workplace || null,
          education: formData.education || null,
          privateBusinessInfo: formData.businessInfo || null,
          jobSeeking: formData.jobSeeking || null,
          
          hasPets: formData.hasPets ? formData.hasPets === 'yes' : null,
          petsInfo: Array.isArray(formData.petsInfo)
            ? (formData.petsInfo
                .map((v: string) => (v === OTHER_OPTION && formData.petsInfoOther ? formData.petsInfoOther : v))
                .filter(Boolean)
                .join(', ') || null)
            : formData.petsInfo || null,

          hobbies: Array.isArray(formData.hobbies)
            ? (formData.hobbies
                .map((v: string) => (v === OTHER_OPTION && formData.hobbiesOther ? formData.hobbiesOther : v))
                .filter(Boolean)
                .join(', ') || null)
            : formData.hobbies || null,

          outdoorActivities: Array.isArray(formData.outdoorActivities)
            ? (formData.outdoorActivities
                .map((v: string) => (v === OTHER_OPTION && formData.outdoorActivitiesOther ? formData.outdoorActivitiesOther : v))
                .filter(Boolean)
                .join(', ') || null)
            : formData.outdoorActivities || null,

          lifestyle: Array.isArray(formData.lifestyle)
            ? (formData.lifestyle
                .map((v: string) => (v === OTHER_OPTION && formData.lifestyleOther ? formData.lifestyleOther : v))
                .filter(Boolean)
                .join(', ') || null)
            : formData.lifestyle || null,

          sports: Array.isArray(formData.sports)
            ? (formData.sports
                .map((v: string) => (v === OTHER_OPTION && formData.sportsOther ? formData.sportsOther : v))
                .filter(Boolean)
                .join(', ') || null)
            : formData.sports || null,
          bio: formData.bio || null,
          
          socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : null,
          siteUsageGoal: Array.isArray(formData.siteUsageGoal)
            ? (formData.siteUsageGoal
                .map((v: string) => (v === OTHER_OPTION && (formData as any).siteUsageGoalOther ? (formData as any).siteUsageGoalOther : v))
                .filter(Boolean)
                .join(', ') || null)
            : formData.siteUsageGoal || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('questionnaire.individual.saveError'));
      }

      // Обновить данные пользователя в localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Перейти на главную
      router.push('/');
    } catch (err: any) {
      setError(err.message || t('questionnaire.individual.saveError'));
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
        <div className="text-neutral-600">{t('questionnaire.individual.loading')}</div>
      </div>
    );
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
          <User className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          {t('questionnaire.individual.step1.title')}
        </h2>
        <p className="text-neutral-600">
          {t('questionnaire.individual.step1.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('questionnaire.individual.step1.firstName')}
          </label>
          <input
            type="text"
            name="firstName"
            required
            value={formData.firstName}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('questionnaire.individual.step1.firstNamePlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('questionnaire.individual.step1.lastName')}
          </label>
          <input
            type="text"
            name="lastName"
            required
            value={formData.lastName}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('questionnaire.individual.step1.lastNamePlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('questionnaire.individual.step1.middleName')}
          </label>
          <input
            type="text"
            name="middleName"
            value={formData.middleName}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('questionnaire.individual.step1.middleNamePlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('questionnaire.individual.step1.phone')}
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
            {t('questionnaire.individual.step1.age')}
          </label>
          <input
            type="number"
            name="age"
            min="18"
            max="120"
            value={formData.age}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('questionnaire.individual.step1.agePlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('questionnaire.individual.step1.gender')}
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">{t('questionnaire.individual.common.notSpecified')}</option>
            <option value="male">{t('questionnaire.individual.step1.genderMale')}</option>
            <option value="female">{t('questionnaire.individual.step1.genderFemale')}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('questionnaire.individual.step1.maritalStatus')}
          </label>
          <select
            name="maritalStatus"
            value={formData.maritalStatus}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">{t('questionnaire.individual.common.notSpecified')}</option>
            <option value="single">{t('questionnaire.individual.step1.maritalSingle')}</option>
            <option value="married">{t('questionnaire.individual.step1.maritalMarried')}</option>
            <option value="relationship">{t('questionnaire.individual.step1.maritalRelationship')}</option>
            <option value="divorced">{t('questionnaire.individual.step1.maritalDivorced')}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('questionnaire.individual.step1.childrenCount')}
          </label>
          <input
            type="number"
            name="childrenCount"
            min="0"
            max="20"
            value={formData.childrenCount}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="0"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {t('questionnaire.individual.step1.familyComposition')}
        </label>
        <textarea
          name="familyComposition"
          rows={2}
          value={formData.familyComposition}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          placeholder={t('questionnaire.individual.step1.familyCompositionPlaceholder')}
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
          <MapPin className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          {t('questionnaire.individual.step2.title')}
        </h2>
        <p className="text-neutral-600">
          {t('questionnaire.individual.step2.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('questionnaire.individual.step2.city')}
          </label>
          <select
            name="city"
            required
            value={formData.city}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">{t('questionnaire.individual.step2.cityPlaceholder')}</option>
            {cities.map(city => (
              <option key={city} value={city}>{cityLabel(city)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('questionnaire.individual.step2.region')}
          </label>
          <input
            type="text"
            name="region"
            value={formData.region}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('questionnaire.individual.step2.regionPlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('questionnaire.individual.step2.housingType')}
          </label>
          <select
            name="housingType"
            value={formData.housingType}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">{t('questionnaire.individual.common.notSpecified')}</option>
            <option value="house">{t('questionnaire.individual.step2.housingHouse')}</option>
            <option value="apartment">{t('questionnaire.individual.step2.housingApartment')}</option>
            <option value="other">{t('questionnaire.individual.step2.housingOther')}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('questionnaire.individual.step2.livingSituation')}
          </label>
          <select
            name="livingSituation"
            value={formData.livingSituation}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">{t('questionnaire.individual.common.notSpecified')}</option>
            <option value="alone">{t('questionnaire.individual.step2.livingAlone')}</option>
            <option value="family">{t('questionnaire.individual.step2.livingFamily')}</option>
            <option value="roommates">{t('questionnaire.individual.step2.livingRoommates')}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('questionnaire.individual.step2.hasCar')}
          </label>
          <select
            name="hasCar"
            value={formData.hasCar}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">{t('questionnaire.individual.common.notSpecified')}</option>
            <option value="yes">{t('questionnaire.individual.common.yes')}</option>
            <option value="no">{t('questionnaire.individual.common.no')}</option>
          </select>
        </div>

        {formData.hasCar === 'yes' && (
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('questionnaire.individual.step2.carInfo')} <span className="text-neutral-400 font-normal">{t('questionnaire.individual.step2.carInfoHint')}</span>
            </label>
            <input
              type="text"
              name="carInfo"
              value={formData.carInfo}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder={t('questionnaire.individual.step2.carInfoPlaceholder')}
            />
            <p className="mt-1 text-xs text-neutral-500">{t('questionnaire.individual.step2.carInfoPrivacy')}</p>
          </div>
        )}

        <div className={formData.hasCar === 'yes' ? '' : 'md:col-span-2'}>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('questionnaire.individual.step2.otherTransport')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {OTHER_TRANSPORT_OPTIONS.map(opt => (
              <label key={opt.value} className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  name="otherTransport"
                  checked={Array.isArray(formData.otherTransport) && formData.otherTransport.includes(opt.value)}
                  onChange={() => handleCheckboxChange('otherTransport', opt.value)}
                />
                <span className="text-sm">{t(`questionnaire.individual.options.otherTransport.${opt.key}`)}</span>
              </label>
            ))}
          </div>
          {Array.isArray(formData.otherTransport) && formData.otherTransport.includes(OTHER_OPTION) && (
            <input
              type="text"
              name="otherTransportOther"
              value={formData.otherTransportOther}
              onChange={handleChange}
              className="mt-2 w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder={t('questionnaire.individual.step2.otherTransportPlaceholder')}
            />
          )}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
          <Briefcase className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          {t('questionnaire.individual.step3.title')}
        </h2>
        <p className="text-neutral-600">
          {t('questionnaire.individual.step3.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('questionnaire.individual.step3.profession')}
          </label>
          <input
            type="text"
            name="profession"
            value={formData.profession}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('questionnaire.individual.step3.professionPlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('questionnaire.individual.step3.employmentStatus')}
          </label>
          <select
            name="employmentStatus"
            value={formData.employmentStatus}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">{t('questionnaire.individual.common.notSpecified')}</option>
            <option value="employed">{t('questionnaire.individual.step3.statusEmployed')}</option>
            <option value="unemployed">{t('questionnaire.individual.step3.statusUnemployed')}</option>
            <option value="looking">{t('questionnaire.individual.step3.statusLooking')}</option>
            <option value="student">{t('questionnaire.individual.step3.statusStudent')}</option>
            <option value="retired">{t('questionnaire.individual.step3.statusRetired')}</option>
            <option value="business">{t('questionnaire.individual.step3.statusBusiness')}</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('questionnaire.individual.step3.workplace')}
          </label>
          <input
            type="text"
            name="workplace"
            value={formData.workplace}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('questionnaire.individual.step3.workplacePlaceholder')}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {t('questionnaire.individual.step3.education')}
        </label>
        <textarea
          name="education"
          rows={2}
          value={formData.education}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          placeholder={t('questionnaire.individual.step3.educationPlaceholder')}
        />
      </div>

      {formData.employmentStatus === 'business' && (
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('questionnaire.individual.step3.businessInfo')}
          </label>
          <textarea
            name="businessInfo"
            rows={2}
            value={formData.businessInfo}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            placeholder={t('questionnaire.individual.step3.businessInfoPlaceholder')}
          />
        </div>
      )}

      {(formData.employmentStatus === 'looking' || formData.employmentStatus === 'unemployed') && (
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('questionnaire.individual.step3.jobSeeking')}
          </label>
          <textarea
            name="jobSeeking"
            rows={2}
            value={formData.jobSeeking}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            placeholder={t('questionnaire.individual.step3.jobSeekingPlaceholder')}
          />
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
          <Heart className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          {t('questionnaire.individual.step4.title')}
        </h2>
        <p className="text-neutral-600">
          {t('questionnaire.individual.step4.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('questionnaire.individual.step4.hasPets')}
          </label>
          <select
            name="hasPets"
            value={formData.hasPets}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">{t('questionnaire.individual.common.notSpecified')}</option>
            <option value="yes">{t('questionnaire.individual.common.yes')}</option>
            <option value="no">{t('questionnaire.individual.common.no')}</option>
          </select>
        </div>

        {formData.hasPets === 'yes' && (
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">{t('questionnaire.individual.step4.petsInfo')}</label>
            <div className="grid grid-cols-2 gap-2">
              {PETS_OPTIONS.map(opt => (
                <label key={opt.value} className="inline-flex items-center gap-2">
                  <input type="checkbox" name="petsInfo" checked={Array.isArray(formData.petsInfo) && formData.petsInfo.includes(opt.value)} onChange={() => handleCheckboxChange('petsInfo', opt.value)} />
                  <span className="text-sm">{t(`questionnaire.individual.options.pets.${opt.key}`)}</span>
                </label>
              ))}
            </div>
            {Array.isArray(formData.petsInfo) && formData.petsInfo.includes(OTHER_OPTION) && (
              <input type="text" name="petsInfoOther" value={formData.petsInfoOther} onChange={handleChange} className="mt-2 w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder={t('questionnaire.individual.step4.petsInfoPlaceholder')} />
            )}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">{t('questionnaire.individual.step4.hobbies')}</label>
        <div className="grid grid-cols-2 gap-2">
          {HOBBIES_OPTIONS.map(opt => (
            <label key={opt.value} className="inline-flex items-center gap-2">
              <input type="checkbox" name="hobbies" checked={Array.isArray(formData.hobbies) && formData.hobbies.includes(opt.value)} onChange={() => handleCheckboxChange('hobbies', opt.value)} />
              <span className="text-sm">{t(`questionnaire.individual.options.hobbies.${opt.key}`)}</span>
            </label>
          ))}
        </div>
        {Array.isArray(formData.hobbies) && formData.hobbies.includes(OTHER_OPTION) && (
          <input type="text" name="hobbiesOther" value={formData.hobbiesOther} onChange={handleChange} className="mt-2 w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder={t('questionnaire.individual.step4.hobbiesPlaceholder')} />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">{t('questionnaire.individual.step4.outdoorActivities')}</label>
        <div className="grid grid-cols-2 gap-2">
          {OUTDOOR_OPTIONS.map(opt => (
            <label key={opt.value} className="inline-flex items-center gap-2">
              <input type="checkbox" name="outdoorActivities" checked={Array.isArray(formData.outdoorActivities) && formData.outdoorActivities.includes(opt.value)} onChange={() => handleCheckboxChange('outdoorActivities', opt.value)} />
              <span className="text-sm">{t(`questionnaire.individual.options.outdoorActivities.${opt.key}`)}</span>
            </label>
          ))}
        </div>
        {Array.isArray(formData.outdoorActivities) && formData.outdoorActivities.includes(OTHER_OPTION) && (
          <input type="text" name="outdoorActivitiesOther" value={formData.outdoorActivitiesOther} onChange={handleChange} className="mt-2 w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder={t('questionnaire.individual.step4.outdoorActivitiesPlaceholder')} />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">{t('questionnaire.individual.step4.sports')}</label>
        <div className="grid grid-cols-2 gap-2">
          {SPORTS_OPTIONS.map(opt => (
            <label key={opt.value} className="inline-flex items-center gap-2">
              <input type="checkbox" name="sports" checked={Array.isArray(formData.sports) && formData.sports.includes(opt.value)} onChange={() => handleCheckboxChange('sports', opt.value)} />
              <span className="text-sm">{t(`questionnaire.individual.options.sports.${opt.key}`)}</span>
            </label>
          ))}
        </div>
        {Array.isArray(formData.sports) && formData.sports.includes(OTHER_OPTION) && (
          <input type="text" name="sportsOther" value={formData.sportsOther} onChange={handleChange} className="mt-2 w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder={t('questionnaire.individual.step4.sportsPlaceholder')} />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">{t('questionnaire.individual.step4.lifestyle')}</label>
        <div className="grid grid-cols-2 gap-2">
          {LIFESTYLE_OPTIONS.map(opt => (
            <label key={opt.value} className="inline-flex items-center gap-2">
              <input type="checkbox" name="lifestyle" checked={Array.isArray(formData.lifestyle) && formData.lifestyle.includes(opt.value)} onChange={() => handleCheckboxChange('lifestyle', opt.value)} />
              <span className="text-sm">{t(`questionnaire.individual.options.lifestyle.${opt.key}`)}</span>
            </label>
          ))}
        </div>
        {Array.isArray(formData.lifestyle) && formData.lifestyle.includes(OTHER_OPTION) && (
          <input type="text" name="lifestyleOther" value={formData.lifestyleOther} onChange={handleChange} className="mt-2 w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder={t('questionnaire.individual.step4.lifestylePlaceholder')} />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {t('questionnaire.individual.step4.bio')}
        </label>
        <textarea
          name="bio"
          rows={3}
          value={formData.bio}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          placeholder={t('questionnaire.individual.step4.bioPlaceholder')}
        />
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
          <Globe className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          {t('questionnaire.individual.step5.title')}
        </h2>
        <p className="text-neutral-600">
          {t('questionnaire.individual.step5.subtitle')}
        </p>
      </div>

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
            placeholder={t('questionnaire.individual.step5.telegramPlaceholder')}
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

      <div className="mt-8 p-4 bg-primary-50 border border-primary-200 rounded-lg">
        <p className="text-sm text-neutral-600 text-center">
          💡 <strong>{t('questionnaire.individual.step5.tipLabel')}</strong> {t('questionnaire.individual.step5.tipText')}
        </p>
      </div>
    </div>
  );

  const renderStepMeta = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
          <Target className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          {t('questionnaire.individual.stepMeta.title')}
        </h2>
        <p className="text-neutral-600">{t('questionnaire.individual.stepMeta.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SITE_USAGE_GOAL_OPTIONS.map(opt => (
          <label key={opt.value} className="inline-flex items-center gap-2">
            <input type="checkbox" name="siteUsageGoal" checked={Array.isArray(formData.siteUsageGoal) && formData.siteUsageGoal.includes(opt.value)} onChange={() => handleCheckboxChange('siteUsageGoal', opt.value)} />
            <span className="text-sm">{t(`questionnaire.individual.options.siteUsageGoal.${opt.key}`)}</span>
          </label>
        ))}
      </div>

      {Array.isArray(formData.siteUsageGoal) && formData.siteUsageGoal.includes(OTHER_OPTION) && (
        <input type="text" name="siteUsageGoalOther" value={formData.siteUsageGoalOther || ''} onChange={handleChange} className="mt-2 w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder={t('questionnaire.individual.stepMeta.otherPlaceholder')} />
      )}
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
                {t('questionnaire.individual.progress.step', { current: currentStep })}
              </span>
              <span className="text-sm text-neutral-600">
                {Math.round((currentStep / 5) * 100)}%
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
              {currentStep === 6 && renderStepMeta()}

              {/* Navigation Buttons */}
              <div className="flex gap-4 mt-8">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={loading}
                    className="px-6 py-3 border-2 border-neutral-300 rounded-lg font-medium text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50"
                  >
                    {t('questionnaire.individual.nav.back')}
                  </button>
                )}

                {currentStep < 5 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={loading}
                    className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {t('questionnaire.individual.nav.next')}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? t('questionnaire.individual.nav.saving') : t('questionnaire.individual.nav.finish')}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={loading}
                  className="px-6 py-3 border border-neutral-300 rounded-lg font-medium text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-50"
                >
                  {t('questionnaire.individual.nav.skip')}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center text-sm text-neutral-500">
              <p>{t('questionnaire.individual.nav.footerNote')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
