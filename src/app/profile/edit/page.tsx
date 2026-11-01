'use client';

import { useState, useEffect } from 'react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useRouter } from 'next/navigation';
import { User, MapPin, Briefcase, Heart, Camera, Globe } from 'lucide-react';
import { cities, getCityName } from '@/lib/constants';
import { useI18n } from '@/i18n/client';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

// Stored values stay Ukrainian; only the displayed labels are translated.
const OTHER_VALUE = 'Інше'; // i18n-ignore

const OTHER_TRANSPORT_OPTIONS = [
  { value: 'Велосипед', key: 'bicycle' }, // i18n-ignore
  { value: 'Самокат', key: 'scooter' }, // i18n-ignore
  { value: 'Мотоцикл', key: 'motorcycle' }, // i18n-ignore
  { value: 'Скейт', key: 'skateboard' }, // i18n-ignore
  { value: 'Гірський велосипед', key: 'mountainBike' }, // i18n-ignore
  { value: OTHER_VALUE, key: 'other' },
];

const PETS_OPTIONS = [
  { value: 'Собака', key: 'dog' }, // i18n-ignore
  { value: 'Кіт', key: 'cat' }, // i18n-ignore
  { value: 'Птахи', key: 'birds' }, // i18n-ignore
  { value: 'Риби', key: 'fish' }, // i18n-ignore
  { value: OTHER_VALUE, key: 'other' },
];

const HOBBIES_OPTIONS = [
  { value: 'Читання', key: 'reading' }, // i18n-ignore
  { value: 'Музика', key: 'music' }, // i18n-ignore
  { value: 'Кіно', key: 'cinema' }, // i18n-ignore
  { value: 'Подорожі', key: 'travel' }, // i18n-ignore
  { value: 'Кулінарія', key: 'cooking' }, // i18n-ignore
  { value: OTHER_VALUE, key: 'other' },
];

const OUTDOOR_OPTIONS = [
  { value: 'Похід', key: 'hiking' }, // i18n-ignore
  { value: 'Пікнік', key: 'picnic' }, // i18n-ignore
  { value: 'Пляж', key: 'beach' }, // i18n-ignore
  { value: 'Парки', key: 'parks' }, // i18n-ignore
  { value: OTHER_VALUE, key: 'other' },
];

const LIFESTYLE_OPTIONS = [
  { value: 'Еко', key: 'eco' }, // i18n-ignore
  { value: 'Мінімалізм', key: 'minimalism' }, // i18n-ignore
  { value: 'Здоровий спосіб життя', key: 'healthy' }, // i18n-ignore
  { value: 'Вегетаріанство', key: 'vegetarian' }, // i18n-ignore
  { value: OTHER_VALUE, key: 'other' },
];

const SPORTS_OPTIONS = [
  { value: 'Футбол', key: 'football' }, // i18n-ignore
  { value: 'Біг', key: 'running' }, // i18n-ignore
  { value: 'Тренажерний зал', key: 'gym' }, // i18n-ignore
  { value: 'Йога', key: 'yoga' }, // i18n-ignore
  { value: OTHER_VALUE, key: 'other' },
];

const SITE_USAGE_GOAL_OPTIONS = [
  { value: 'Пошук послуг', key: 'findServices' }, // i18n-ignore
  { value: 'Пропонування послуг', key: 'offerServices' }, // i18n-ignore
  { value: 'Нові знайомства', key: 'meetPeople' }, // i18n-ignore
  { value: 'Бізнес-партнери', key: 'businessPartners' }, // i18n-ignore
  { value: OTHER_VALUE, key: 'other' },
];

export default function EditProfilePage() {
  const router = useRouter();
  const { t, locale } = useI18n();
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
  
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    const initFromLocal = () => {
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setAvatarPreview(userData.avatarUrl || '');
        } catch {}
      }
      if (storedToken) setToken(storedToken);
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          loadProfile(userData.id, storedToken ?? undefined);
        } catch {}
      }
    };

    if (!storedUser || !storedToken) {
      (async () => {
        try {
          const res = await fetch('/api/auth/me', { credentials: 'include' });
          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              setUser(data.user);
              setAvatarPreview(data.user.avatarUrl || '');
              loadProfile(data.user.id, storedToken ?? undefined);
              return;
            }
          }
        } catch (e) {
          console.error('Auth check failed in EditProfilePage:', e);
        }

        if (storedUser || storedToken) {
          initFromLocal();
        } else {
          router.push('/auth/login');
        }
      })();
    } else {
      initFromLocal();
    }
  }, [router]);

  // Бізнес-акаунти редагують профіль на окремій сторінці (компанія, логотип, банер)
  useEffect(() => {
    if (String(user?.accountType || '').startsWith('business')) {
      router.replace('/profile/edit-business');
    }
  }, [user, router]);

  const loadProfile = async (userId: number, authToken?: string) => {
    try {
      const response = await fetch(`/api/profile/${userId}`);
      const data = await response.json();
      
      if (data.user) {
        const u = data.user;
        const csvToArray = (val: any) => {
          if (!val) return [] as string[];
          if (Array.isArray(val)) return val;
          if (typeof val === 'string') {
            return val.split(',').map((s) => s.trim()).filter(Boolean);
          }
          return [] as string[];
        };

        const mapOther = (arr: string[], known: string[]) => {
          const otherItems = arr.filter(a => !known.includes(a));
          const filtered = arr.filter(a => known.includes(a));
          if (otherItems.length) {
            return { values: [...filtered, OTHER_VALUE], other: otherItems.join(', ') };
          }
          return { values: filtered, other: '' };
        };

        const otherTransportKnown = OTHER_TRANSPORT_OPTIONS.map(o => o.value);
        const petsKnown = PETS_OPTIONS.map(o => o.value);
        const hobbiesKnown = HOBBIES_OPTIONS.map(o => o.value);
        const outdoorKnown = OUTDOOR_OPTIONS.map(o => o.value);
        const lifestyleKnown = LIFESTYLE_OPTIONS.map(o => o.value);
        const sportsKnown = SPORTS_OPTIONS.map(o => o.value);

        const ot = mapOther(csvToArray(u.otherTransport), otherTransportKnown);
        const pets = mapOther(csvToArray(u.petsInfo), petsKnown);
        const hobbies = mapOther(csvToArray(u.hobbies), hobbiesKnown);
        const outdoor = mapOther(csvToArray(u.outdoorActivities), outdoorKnown);
        const lifestyle = mapOther(csvToArray(u.lifestyle), lifestyleKnown);
        const sports = mapOther(csvToArray(u.sports), sportsKnown);

        setFormData({
          firstName: u.firstName || '',
          middleName: u.middleName || '',
          lastName: u.lastName || '',
          phone: u.phone || '',
          age: u.age ? String(u.age) : '',
          gender: u.gender || '',
          maritalStatus: u.maritalStatus || '',
          familyComposition: u.familyComposition || '',
          childrenCount: u.childrenCount ? String(u.childrenCount) : '',
          
          city: u.city || '',
          region: u.region || '',
          housingType: u.housingType || '',
          livingSituation: u.livingSituation || '',
          
          hasCar: typeof u.hasCar === 'boolean' ? (u.hasCar ? 'yes' : 'no') : '',
          carInfo: u.carInfo || '',
          otherTransport: ot.values,
          otherTransportOther: ot.other,
          
          profession: u.profession || '',
          employmentStatus: u.employmentStatus || '',
          workplace: u.workplace || '',
          education: u.educationLevel || u.educationDetails || '',
          businessInfo: u.privateBusinessInfo || '',
          jobSeeking: u.jobSeeking || '',
          
          hasPets: typeof u.hasPets === 'boolean' ? (u.hasPets ? 'yes' : 'no') : '',
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
          bio: u.bio || '',
          
          instagram: u.socialLinks?.instagram || '',
          facebook: u.socialLinks?.facebook || '',
          telegram: u.socialLinks?.telegram || '',
          tiktok: u.socialLinks?.tiktok || '',
          siteUsageGoal: csvToArray(u.siteUsageGoal),
          siteUsageGoalOther: '',
        });
        
        setUser(u);
      }
    } catch (err) {
      console.error('Помилка завантаження профілю:', err);
      setError(t('profileEdit.errors.loadProfile'));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (name: string, value: string) => {
    const current = (formData as any)[name];
    if (!Array.isArray(current)) return;
    const exists = current.includes(value);
    const updated = exists ? current.filter((v: string) => v !== value) : [...current, value];
    setFormData({ ...formData, [name]: updated });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError(t('profileEdit.errors.fileTooLarge'));
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setError(t('profileEdit.errors.notImage'));
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
      const uploadHeaders: any = {};
      if (token) uploadHeaders['Authorization'] = `Bearer ${token}`;

      const response = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        headers: uploadHeaders,
        body: uploadFormData,
      });

      const data = await response.json();
      
      if (response.ok && data.url) {
        const urlWithTimestamp = `${data.url}?t=${Date.now()}`;
        return urlWithTimestamp;
      }
      
      throw new Error(data.error || t('profileEdit.errors.uploadPhoto'));
    } catch (err: any) {
      console.error('[Upload Avatar] Помилка завантаження:', err);
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
          avatarUrl: avatarUrl || null,
          
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
                .map((v: string) => (v === OTHER_VALUE && formData.otherTransportOther ? formData.otherTransportOther : v))
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
                .map((v: string) => (v === OTHER_VALUE && formData.petsInfoOther ? formData.petsInfoOther : v))
                .filter(Boolean)
                .join(', ') || null)
            : formData.petsInfo || null,

          hobbies: Array.isArray(formData.hobbies)
            ? (formData.hobbies
                .map((v: string) => (v === OTHER_VALUE && formData.hobbiesOther ? formData.hobbiesOther : v))
                .filter(Boolean)
                .join(', ') || null)
            : formData.hobbies || null,

          outdoorActivities: Array.isArray(formData.outdoorActivities)
            ? (formData.outdoorActivities
                .map((v: string) => (v === OTHER_VALUE && formData.outdoorActivitiesOther ? formData.outdoorActivitiesOther : v))
                .filter(Boolean)
                .join(', ') || null)
            : formData.outdoorActivities || null,

          lifestyle: Array.isArray(formData.lifestyle)
            ? (formData.lifestyle
                .map((v: string) => (v === OTHER_VALUE && formData.lifestyleOther ? formData.lifestyleOther : v))
                .filter(Boolean)
                .join(', ') || null)
            : formData.lifestyle || null,

          sports: Array.isArray(formData.sports)
            ? (formData.sports
                .map((v: string) => (v === OTHER_VALUE && formData.sportsOther ? formData.sportsOther : v))
                .filter(Boolean)
                .join(', ') || null)
            : formData.sports || null,
          bio: formData.bio || null,
          
          socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : null,
          siteUsageGoal: Array.isArray(formData.siteUsageGoal)
            ? (formData.siteUsageGoal
                .map((v: string) => (v === OTHER_VALUE && formData.siteUsageGoalOther ? formData.siteUsageGoalOther : v))
                .filter(Boolean)
                .join(', ') || null)
            : formData.siteUsageGoal || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('profileEdit.errors.save'));
      }

      localStorage.setItem('user', JSON.stringify(data.user));
      
      setSuccess(t('profileEdit.success.updated'));
      setTimeout(() => {
        router.push(`/profile/${user.id}`);
      }, 1500);
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

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <User className="w-5 h-5 text-primary-600" />
        {t('profileEdit.basic.title')}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('profileEdit.basic.firstName')}
          </label>
          <input
            type="text"
            name="firstName"
            required
            value={formData.firstName}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('profileEdit.basic.lastName')}
          </label>
          <input
            type="text"
            name="lastName"
            required
            value={formData.lastName}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('profileEdit.basic.middleName')}
          </label>
          <input
            type="text"
            name="middleName"
            value={formData.middleName}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('profileEdit.basic.phone')}
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('profileEdit.basic.age')}
          </label>
          <input
            type="number"
            name="age"
            min="18"
            max="120"
            value={formData.age}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('profileEdit.basic.gender')}
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">{t('profileEdit.common.notSpecified')}</option>
            <option value="male">{t('profileEdit.options.gender.male')}</option>
            <option value="female">{t('profileEdit.options.gender.female')}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('profileEdit.basic.maritalStatus')}
          </label>
          <select
            name="maritalStatus"
            value={formData.maritalStatus}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">{t('profileEdit.common.notSpecified')}</option>
            <option value="single">{t('profileEdit.options.maritalStatus.single')}</option>
            <option value="married">{t('profileEdit.options.maritalStatus.married')}</option>
            <option value="relationship">{t('profileEdit.options.maritalStatus.relationship')}</option>
            <option value="divorced">{t('profileEdit.options.maritalStatus.divorced')}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('profileEdit.basic.childrenCount')}
          </label>
          <input
            type="number"
            name="childrenCount"
            min="0"
            max="20"
            value={formData.childrenCount}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('profileEdit.basic.familyComposition')}
          </label>
          <textarea
            name="familyComposition"
            rows={2}
            value={formData.familyComposition}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
        </div>
      </div>
    </div>
  );

  const renderLocation = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-primary-600" />
        {t('profileEdit.location.title')}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('profileEdit.location.city')}
          </label>
          <select
            name="city"
            required
            value={formData.city}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">{t('profileEdit.location.selectCity')}</option>
            {cities.map(city => (
              <option key={city} value={city}>{getCityName(city, locale)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('profileEdit.location.region')}
          </label>
          <input
            type="text"
            name="region"
            value={formData.region}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('profileEdit.location.housingType')}
          </label>
          <select
            name="housingType"
            value={formData.housingType}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">{t('profileEdit.common.notSpecified')}</option>
            <option value="house">{t('profileEdit.options.housingType.house')}</option>
            <option value="apartment">{t('profileEdit.options.housingType.apartment')}</option>
            <option value="other">{t('profileEdit.options.housingType.other')}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('profileEdit.location.livingSituation')}
          </label>
          <select
            name="livingSituation"
            value={formData.livingSituation}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">{t('profileEdit.common.notSpecified')}</option>
            <option value="alone">{t('profileEdit.options.livingSituation.alone')}</option>
            <option value="family">{t('profileEdit.options.livingSituation.family')}</option>
            <option value="roommates">{t('profileEdit.options.livingSituation.roommates')}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('profileEdit.location.hasCar')}
          </label>
          <select
            name="hasCar"
            value={formData.hasCar}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">{t('profileEdit.common.notSpecified')}</option>
            <option value="yes">{t('profileEdit.common.yes')}</option>
            <option value="no">{t('profileEdit.common.no')}</option>
          </select>
        </div>

        {formData.hasCar === 'yes' && (
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('profileEdit.location.carInfo')}
            </label>
            <input
              type="text"
              name="carInfo"
              value={formData.carInfo}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        )}

        <div className={formData.hasCar === 'yes' ? '' : 'md:col-span-2'}>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('profileEdit.location.otherTransport')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {OTHER_TRANSPORT_OPTIONS.map(opt => (
              <label key={opt.value} className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.otherTransport.includes(opt.value)}
                  onChange={() => handleCheckboxChange('otherTransport', opt.value)}
                />
                <span className="text-sm">{t(`profileEdit.options.otherTransport.${opt.key}`)}</span>
              </label>
            ))}
          </div>
          {formData.otherTransport.includes(OTHER_VALUE) && (
            <input
              type="text"
              name="otherTransportOther"
              value={formData.otherTransportOther}
              onChange={handleChange}
              className="mt-2 w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder={t('profileEdit.location.otherTransportPlaceholder')}
            />
          )}
        </div>
      </div>
    </div>
  );

  const renderProfession = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Briefcase className="w-5 h-5 text-primary-600" />
        {t('profileEdit.profession.title')}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('profileEdit.profession.profession')}
          </label>
          <input
            type="text"
            name="profession"
            value={formData.profession}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('profileEdit.profession.employmentStatus')}
          </label>
          <select
            name="employmentStatus"
            value={formData.employmentStatus}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">{t('profileEdit.common.notSpecified')}</option>
            <option value="employed">{t('profileEdit.options.employmentStatus.employed')}</option>
            <option value="unemployed">{t('profileEdit.options.employmentStatus.unemployed')}</option>
            <option value="freelance">{t('profileEdit.options.employmentStatus.freelance')}</option>
            <option value="business">{t('profileEdit.options.employmentStatus.business')}</option>
            <option value="student">{t('profileEdit.options.employmentStatus.student')}</option>
            <option value="retired">{t('profileEdit.options.employmentStatus.retired')}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('profileEdit.profession.workplace')}
          </label>
          <input
            type="text"
            name="workplace"
            value={formData.workplace}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('profileEdit.profession.education')}
          </label>
          <input
            type="text"
            name="education"
            value={formData.education}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('profileEdit.profession.businessInfo')}
          </label>
          <textarea
            name="businessInfo"
            rows={2}
            value={formData.businessInfo}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('profileEdit.profession.jobSeeking')}
          </label>
          <textarea
            name="jobSeeking"
            rows={2}
            value={formData.jobSeeking}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
        </div>
      </div>
    </div>
  );

  const renderInterests = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Heart className="w-5 h-5 text-primary-600" />
        {t('profileEdit.interests.title')}
      </h3>

      {/* Pets */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {t('profileEdit.interests.hasPets')}
        </label>
        <select
          name="hasPets"
          value={formData.hasPets}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">{t('profileEdit.common.notSpecified')}</option>
          <option value="yes">{t('profileEdit.common.yes')}</option>
          <option value="no">{t('profileEdit.common.no')}</option>
        </select>
      </div>

      {formData.hasPets === 'yes' && (
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('profileEdit.interests.petsInfo')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PETS_OPTIONS.map(opt => (
              <label key={opt.value} className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.petsInfo.includes(opt.value)}
                  onChange={() => handleCheckboxChange('petsInfo', opt.value)}
                />
                <span className="text-sm">{t(`profileEdit.options.pets.${opt.key}`)}</span>
              </label>
            ))}
          </div>
          {formData.petsInfo.includes(OTHER_VALUE) && (
            <input
              type="text"
              name="petsInfoOther"
              value={formData.petsInfoOther}
              onChange={handleChange}
              className="mt-2 w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder={t('profileEdit.interests.petsOtherPlaceholder')}
            />
          )}
        </div>
      )}

      {/* Hobbies */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {t('profileEdit.interests.hobbies')}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {HOBBIES_OPTIONS.map(opt => (
            <label key={opt.value} className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.hobbies.includes(opt.value)}
                onChange={() => handleCheckboxChange('hobbies', opt.value)}
              />
              <span className="text-sm">{t(`profileEdit.options.hobbies.${opt.key}`)}</span>
            </label>
          ))}
        </div>
        {formData.hobbies.includes(OTHER_VALUE) && (
          <input
            type="text"
            name="hobbiesOther"
            value={formData.hobbiesOther}
            onChange={handleChange}
            className="mt-2 w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('profileEdit.interests.hobbiesOtherPlaceholder')}
          />
        )}
      </div>

      {/* Outdoor activities */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {t('profileEdit.interests.outdoorActivities')}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {OUTDOOR_OPTIONS.map(opt => (
            <label key={opt.value} className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.outdoorActivities.includes(opt.value)}
                onChange={() => handleCheckboxChange('outdoorActivities', opt.value)}
              />
              <span className="text-sm">{t(`profileEdit.options.outdoorActivities.${opt.key}`)}</span>
            </label>
          ))}
        </div>
        {formData.outdoorActivities.includes(OTHER_VALUE) && (
          <input
            type="text"
            name="outdoorActivitiesOther"
            value={formData.outdoorActivitiesOther}
            onChange={handleChange}
            className="mt-2 w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('profileEdit.interests.outdoorOtherPlaceholder')}
          />
        )}
      </div>

      {/* Lifestyle */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {t('profileEdit.interests.lifestyle')}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {LIFESTYLE_OPTIONS.map(opt => (
            <label key={opt.value} className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.lifestyle.includes(opt.value)}
                onChange={() => handleCheckboxChange('lifestyle', opt.value)}
              />
              <span className="text-sm">{t(`profileEdit.options.lifestyle.${opt.key}`)}</span>
            </label>
          ))}
        </div>
        {formData.lifestyle.includes(OTHER_VALUE) && (
          <input
            type="text"
            name="lifestyleOther"
            value={formData.lifestyleOther}
            onChange={handleChange}
            className="mt-2 w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('profileEdit.interests.lifestyleOtherPlaceholder')}
          />
        )}
      </div>

      {/* Sports */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {t('profileEdit.interests.sports')}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {SPORTS_OPTIONS.map(opt => (
            <label key={opt.value} className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.sports.includes(opt.value)}
                onChange={() => handleCheckboxChange('sports', opt.value)}
              />
              <span className="text-sm">{t(`profileEdit.options.sports.${opt.key}`)}</span>
            </label>
          ))}
        </div>
        {formData.sports.includes(OTHER_VALUE) && (
          <input
            type="text"
            name="sportsOther"
            value={formData.sportsOther}
            onChange={handleChange}
            className="mt-2 w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('profileEdit.interests.sportsOtherPlaceholder')}
          />
        )}
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {t('profileEdit.interests.bio')}
        </label>
        <textarea
          name="bio"
          rows={4}
          value={formData.bio}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          placeholder={t('profileEdit.interests.bioPlaceholder')}
        />
      </div>
    </div>
  );

  const renderSocial = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Globe className="w-5 h-5 text-primary-600" />
        {t('profileEdit.social.title')}
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
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="facebook.com/username"
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

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            TikTok
          </label>
          <input
            type="text"
            name="tiktok"
            value={formData.tiktok}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="@username"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {t('profileEdit.social.usageGoal')}
        </label>
        <div className="grid grid-cols-1 gap-2">
          {SITE_USAGE_GOAL_OPTIONS.map(opt => (
            <label key={opt.value} className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.siteUsageGoal.includes(opt.value)}
                onChange={() => handleCheckboxChange('siteUsageGoal', opt.value)}
              />
              <span className="text-sm">{t(`profileEdit.options.siteUsageGoal.${opt.key}`)}</span>
            </label>
          ))}
        </div>
        {formData.siteUsageGoal.includes(OTHER_VALUE) && (
          <input
            type="text"
            name="siteUsageGoalOther"
            value={formData.siteUsageGoalOther}
            onChange={handleChange}
            className="mt-2 w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('profileEdit.social.usageGoalOtherPlaceholder')}
          />
        )}
      </div>
    </div>
  );

  const tabs = [
    { id: 'basic', name: t('profileEdit.tabs.basic'), icon: User },
    { id: 'location', name: t('profileEdit.tabs.location'), icon: MapPin },
    { id: 'profession', name: t('profileEdit.tabs.profession'), icon: Briefcase },
    { id: 'interests', name: t('profileEdit.tabs.interests'), icon: Heart },
    { id: 'social', name: t('profileEdit.tabs.social'), icon: Globe },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-500 to-accent-500 px-8 py-6">
            <h1 className="text-3xl font-bold text-white">{t('profileEdit.header.title')}</h1>
            <p className="text-primary-100 mt-2">{t('profileEdit.header.subtitle')}</p>
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
                  alt={user.firstName}
                  className="w-24 h-24 border-4 border-primary-200"
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
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">{t('profileEdit.avatar.title')}</h3>
                <p className="text-sm text-neutral-600 mt-1">
                  {t('profileEdit.avatar.hint')}
                </p>
                {avatarFile && (
                  <p className="text-sm text-primary-600 mt-1">
                    {t('profileEdit.avatar.newPhoto', { name: avatarFile.name })}
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
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}

            {activeTab === 'basic' && renderBasicInfo()}
            {activeTab === 'location' && renderLocation()}
            {activeTab === 'profession' && renderProfession()}
            {activeTab === 'interests' && renderInterests()}
            {activeTab === 'social' && renderSocial()}

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
