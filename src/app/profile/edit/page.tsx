'use client';

import { useState, useEffect } from 'react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useRouter } from 'next/navigation';
import { User, MapPin, Briefcase, Heart, Camera, Globe } from 'lucide-react';
import { cities } from '@/lib/constants';

export default function EditProfilePage() {
  const router = useRouter();
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
            return { values: [...filtered, 'Інше'], other: otherItems.join(', ') };
          }
          return { values: filtered, other: '' };
        };

        const otherTransportKnown = ['Велосипед','Самокат','Мотоцикл','Скейт','Гірський велосипед','Інше'];
        const petsKnown = ['Собака', 'Кіт', 'Птахи', 'Риби', 'Інше'];
        const hobbiesKnown = ['Читання', 'Музика', 'Кіно', 'Подорожі', 'Кулінарія', 'Інше'];
        const outdoorKnown = ['Похід', 'Пікнік', 'Пляж', 'Парки', 'Інше'];
        const lifestyleKnown = ['Еко', 'Мінімалізм', 'Здоровий спосіб життя', 'Вегетаріанство', 'Інше'];
        const sportsKnown = ['Футбол', 'Біг', 'Тренажерний зал', 'Йога', 'Інше'];

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
      setError('Помилка завантаження даних профілю');
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
      
      throw new Error(data.error || 'Помилка завантаження фото');
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
                .map((v: string) => (v === 'Інше' && formData.otherTransportOther ? formData.otherTransportOther : v))
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
                .map((v: string) => (v === 'Інше' && formData.petsInfoOther ? formData.petsInfoOther : v))
                .filter(Boolean)
                .join(', ') || null)
            : formData.petsInfo || null,

          hobbies: Array.isArray(formData.hobbies)
            ? (formData.hobbies
                .map((v: string) => (v === 'Інше' && formData.hobbiesOther ? formData.hobbiesOther : v))
                .filter(Boolean)
                .join(', ') || null)
            : formData.hobbies || null,

          outdoorActivities: Array.isArray(formData.outdoorActivities)
            ? (formData.outdoorActivities
                .map((v: string) => (v === 'Інше' && formData.outdoorActivitiesOther ? formData.outdoorActivitiesOther : v))
                .filter(Boolean)
                .join(', ') || null)
            : formData.outdoorActivities || null,

          lifestyle: Array.isArray(formData.lifestyle)
            ? (formData.lifestyle
                .map((v: string) => (v === 'Інше' && formData.lifestyleOther ? formData.lifestyleOther : v))
                .filter(Boolean)
                .join(', ') || null)
            : formData.lifestyle || null,

          sports: Array.isArray(formData.sports)
            ? (formData.sports
                .map((v: string) => (v === 'Інше' && formData.sportsOther ? formData.sportsOther : v))
                .filter(Boolean)
                .join(', ') || null)
            : formData.sports || null,
          bio: formData.bio || null,
          
          socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : null,
          siteUsageGoal: Array.isArray(formData.siteUsageGoal)
            ? (formData.siteUsageGoal
                .map((v: string) => (v === 'Інше' && formData.siteUsageGoalOther ? formData.siteUsageGoalOther : v))
                .filter(Boolean)
                .join(', ') || null)
            : formData.siteUsageGoal || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Помилка збереження');
      }

      localStorage.setItem('user', JSON.stringify(data.user));
      
      setSuccess('Профіль успішно оновлено!');
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
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
        <div className="text-neutral-600">Завантаження...</div>
      </div>
    );
  }

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <User className="w-5 h-5 text-primary-600" />
        Основна інформація
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Телефон
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
            Вік
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
            Стать
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Не вказано</option>
            <option value="male">Чоловіча</option>
            <option value="female">Жіноча</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Сімейний стан
          </label>
          <select
            name="maritalStatus"
            value={formData.maritalStatus}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Не вказано</option>
            <option value="single">Неодружений/неодружена</option>
            <option value="married">Одружений/одружена</option>
            <option value="relationship">У стосунках</option>
            <option value="divorced">Розлучений/розлучена</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Кількість дітей
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
            Склад сім'ї
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
        Місце проживання & Транспорт
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Місто *
          </label>
          <select
            name="city"
            required
            value={formData.city}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Оберіть місто</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Область
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
            Тип житла
          </label>
          <select
            name="housingType"
            value={formData.housingType}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Не вказано</option>
            <option value="house">Будинок</option>
            <option value="apartment">Квартира</option>
            <option value="other">Інше</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Проживання
          </label>
          <select
            name="livingSituation"
            value={formData.livingSituation}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Не вказано</option>
            <option value="alone">Самостійно</option>
            <option value="family">З родиною</option>
            <option value="roommates">З співмешканцями</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Чи є автомобіль?
          </label>
          <select
            name="hasCar"
            value={formData.hasCar}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Не вказано</option>
            <option value="yes">Так</option>
            <option value="no">Ні</option>
          </select>
        </div>

        {formData.hasCar === 'yes' && (
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Марка та модель авто
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
            Інший транспорт
          </label>
          <div className="grid grid-cols-2 gap-2">
            {['Велосипед','Самокат','Мотоцикл','Скейт','Гірський велосипед','Інше'].map(opt => (
              <label key={opt} className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.otherTransport.includes(opt)}
                  onChange={() => handleCheckboxChange('otherTransport', opt)}
                />
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </div>
          {formData.otherTransport.includes('Інше') && (
            <input
              type="text"
              name="otherTransportOther"
              value={formData.otherTransportOther}
              onChange={handleChange}
              className="mt-2 w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Опишіть інший транспорт"
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
        Професійна діяльність
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Професія / Спеціальність
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
            Статус зайнятості
          </label>
          <select
            name="employmentStatus"
            value={formData.employmentStatus}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Не вказано</option>
            <option value="employed">Працевлаштований</option>
            <option value="unemployed">Не працевлаштований</option>
            <option value="freelance">Фріланс</option>
            <option value="business">Власний бізнес</option>
            <option value="student">Студент</option>
            <option value="retired">Пенсіонер</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Місце роботи
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
            Освіта
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
            Приватна бізнес-інформація
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
            Пошук роботи
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
        Інтереси та хобі
      </h3>

      {/* Pets */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Чи є домашні тварини?
        </label>
        <select
          name="hasPets"
          value={formData.hasPets}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">Не вказано</option>
          <option value="yes">Так</option>
          <option value="no">Ні</option>
        </select>
      </div>

      {formData.hasPets === 'yes' && (
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Які тварини?
          </label>
          <div className="grid grid-cols-2 gap-2">
            {['Собака', 'Кіт', 'Птахи', 'Риби', 'Інше'].map(opt => (
              <label key={opt} className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.petsInfo.includes(opt)}
                  onChange={() => handleCheckboxChange('petsInfo', opt)}
                />
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </div>
          {formData.petsInfo.includes('Інше') && (
            <input
              type="text"
              name="petsInfoOther"
              value={formData.petsInfoOther}
              onChange={handleChange}
              className="mt-2 w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Опишіть інших тварин"
            />
          )}
        </div>
      )}

      {/* Hobbies */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Хобі
        </label>
        <div className="grid grid-cols-2 gap-2">
          {['Читання', 'Музика', 'Кіно', 'Подорожі', 'Кулінарія', 'Інше'].map(opt => (
            <label key={opt} className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.hobbies.includes(opt)}
                onChange={() => handleCheckboxChange('hobbies', opt)}
              />
              <span className="text-sm">{opt}</span>
            </label>
          ))}
        </div>
        {formData.hobbies.includes('Інше') && (
          <input
            type="text"
            name="hobbiesOther"
            value={formData.hobbiesOther}
            onChange={handleChange}
            className="mt-2 w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Опишіть інші хобі"
          />
        )}
      </div>

      {/* Outdoor activities */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Активний відпочинок
        </label>
        <div className="grid grid-cols-2 gap-2">
          {['Похід', 'Пікнік', 'Пляж', 'Парки', 'Інше'].map(opt => (
            <label key={opt} className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.outdoorActivities.includes(opt)}
                onChange={() => handleCheckboxChange('outdoorActivities', opt)}
              />
              <span className="text-sm">{opt}</span>
            </label>
          ))}
        </div>
        {formData.outdoorActivities.includes('Інше') && (
          <input
            type="text"
            name="outdoorActivitiesOther"
            value={formData.outdoorActivitiesOther}
            onChange={handleChange}
            className="mt-2 w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Опишіть інші активності"
          />
        )}
      </div>

      {/* Lifestyle */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Спосіб життя
        </label>
        <div className="grid grid-cols-2 gap-2">
          {['Еко', 'Мінімалізм', 'Здоровий спосіб життя', 'Вегетаріанство', 'Інше'].map(opt => (
            <label key={opt} className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.lifestyle.includes(opt)}
                onChange={() => handleCheckboxChange('lifestyle', opt)}
              />
              <span className="text-sm">{opt}</span>
            </label>
          ))}
        </div>
        {formData.lifestyle.includes('Інше') && (
          <input
            type="text"
            name="lifestyleOther"
            value={formData.lifestyleOther}
            onChange={handleChange}
            className="mt-2 w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Опишіть інший спосіб життя"
          />
        )}
      </div>

      {/* Sports */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Спорт
        </label>
        <div className="grid grid-cols-2 gap-2">
          {['Футбол', 'Біг', 'Тренажерний зал', 'Йога', 'Інше'].map(opt => (
            <label key={opt} className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.sports.includes(opt)}
                onChange={() => handleCheckboxChange('sports', opt)}
              />
              <span className="text-sm">{opt}</span>
            </label>
          ))}
        </div>
        {formData.sports.includes('Інше') && (
          <input
            type="text"
            name="sportsOther"
            value={formData.sportsOther}
            onChange={handleChange}
            className="mt-2 w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Опишіть інші види спорту"
          />
        )}
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Про себе
        </label>
        <textarea
          name="bio"
          rows={4}
          value={formData.bio}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          placeholder="Розкажіть про себе..."
        />
      </div>
    </div>
  );

  const renderSocial = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Globe className="w-5 h-5 text-primary-600" />
        Соцмережі та мета
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
          Мета використання платформи
        </label>
        <div className="grid grid-cols-1 gap-2">
          {['Пошук послуг', 'Пропонування послуг', 'Нові знайомства', 'Бізнес-партнери', 'Інше'].map(opt => (
            <label key={opt} className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.siteUsageGoal.includes(opt)}
                onChange={() => handleCheckboxChange('siteUsageGoal', opt)}
              />
              <span className="text-sm">{opt}</span>
            </label>
          ))}
        </div>
        {formData.siteUsageGoal.includes('Інше') && (
          <input
            type="text"
            name="siteUsageGoalOther"
            value={formData.siteUsageGoalOther}
            onChange={handleChange}
            className="mt-2 w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Опишіть іншу мету"
          />
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-500 to-accent-500 px-8 py-6">
            <h1 className="text-3xl font-bold text-white">Редагувати профіль</h1>
            <p className="text-primary-100 mt-2">Оновіть вашу інформацію</p>
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
                <h3 className="font-semibold text-neutral-900">Фото профілю</h3>
                <p className="text-sm text-neutral-600 mt-1">
                  PNG, JPG або HEIC. Макс 10MB
                </p>
                {avatarFile && (
                  <p className="text-sm text-primary-600 mt-1">
                    ✓ Нове фото: {avatarFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-neutral-200">
            <div className="px-8 flex space-x-8 overflow-x-auto">
              {[
                { id: 'basic', name: 'Основне', icon: User },
                { id: 'location', name: 'Місце & Транспорт', icon: MapPin },
                { id: 'profession', name: 'Професія', icon: Briefcase },
                { id: 'interests', name: 'Інтереси', icon: Heart },
                { id: 'social', name: 'Соцмережі', icon: Globe },
              ].map((tab) => {
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
