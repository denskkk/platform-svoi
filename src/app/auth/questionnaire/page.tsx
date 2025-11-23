'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, MapPin, Briefcase, Heart, Car, Globe, Target } from 'lucide-react';

export default function QuestionnairePage() {
  const router = useRouter();
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
    (async () => {
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
            return { values: [...filtered, 'Інше'], other: otherItems.join(', ') };
          }
          return { values: filtered, other: '' };
        };

        const otherTransportKnown = ['Автомобіль', 'Громадський транспорт', 'Велосипед', 'Пішки', 'Таксі', 'Інше'];
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
                .map((v: string) => (v === 'Інше' && (formData as any).siteUsageGoalOther ? (formData as any).siteUsageGoalOther : v))
                .filter(Boolean)
                .join(', ') || null)
            : formData.siteUsageGoal || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Помилка збереження');
      }

      // Обновить данные пользователя в localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Перейти на главную
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Помилка збереження');
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
        <div className="text-neutral-600">Завантаження...</div>
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
          🧍‍♂️ Основна інформація
        </h2>
        <p className="text-neutral-600">
          Розкажіть про себе
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Ім&apos;я *
          </label>
          <input
            type="text"
            name="firstName"
            required
            value={formData.firstName}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Введіть ім'я"
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
            placeholder="Введіть прізвище"
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
            placeholder="Введіть по батькові"
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
            placeholder="+380 XX XXX XX XX"
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
            placeholder="Введіть вік"
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
            placeholder="0"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Склад сім&apos;ї
        </label>
        <textarea
          name="familyComposition"
          rows={2}
          value={formData.familyComposition}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          placeholder="Наприклад: дружина, двоє дітей, батьки..."
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
          📍 Місце проживання & 🚗 Транспорт
        </h2>
        <p className="text-neutral-600">
          Де ви живете та як пересуваєтесь
        </p>
      </div>

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
            placeholder="Введіть область"
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
              Марка та модель авто <span className="text-neutral-400 font-normal">(без держномера)</span>
            </label>
            <input
              type="text"
              name="carInfo"
              value={formData.carInfo}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Наприклад: Toyota Camry 2020"
            />
            <p className="mt-1 text-xs text-neutral-500">Не вказуйте державний номер авто з міркувань конфіденційності.</p>
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
                  name="otherTransport"
                  checked={Array.isArray(formData.otherTransport) && formData.otherTransport.includes(opt)}
                  onChange={() => handleCheckboxChange('otherTransport', opt)}
                />
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </div>
          {Array.isArray(formData.otherTransport) && formData.otherTransport.includes('Інше') && (
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

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
          <Briefcase className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          💼 Професійна діяльність
        </h2>
        <p className="text-neutral-600">
          Чим ви займаєтесь
        </p>
      </div>

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
            placeholder="Наприклад: Водій, Електрик, Програміст..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Поточний статус
          </label>
          <select
            name="employmentStatus"
            value={formData.employmentStatus}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Не вказано</option>
            <option value="employed">Працюю</option>
            <option value="unemployed">Тимчасово не працюю</option>
            <option value="looking">У пошуку роботи</option>
            <option value="student">Студент</option>
            <option value="retired">Пенсіонер</option>
            <option value="business">Приватний бізнес</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Місце роботи / Вид діяльності
          </label>
          <input
            type="text"
            name="workplace"
            value={formData.workplace}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Де працюєте або чим займаєтесь..."
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Освіта
        </label>
        <textarea
          name="education"
          rows={2}
          value={formData.education}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          placeholder="Спеціальність, навчальний заклад..."
        />
      </div>

      {formData.employmentStatus === 'business' && (
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Інформація про приватний бізнес
          </label>
          <textarea
            name="businessInfo"
            rows={2}
            value={formData.businessInfo}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            placeholder="Опис напрямку, посилання на сторінку або соцмережі..."
          />
        </div>
      )}

      {(formData.employmentStatus === 'looking' || formData.employmentStatus === 'unemployed') && (
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            У якій сфері шукаєте роботу?
          </label>
          <textarea
            name="jobSeeking"
            rows={2}
            value={formData.jobSeeking}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            placeholder="Опишіть, яку роботу шукаєте..."
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
          🎯 Інтереси та стиль життя
        </h2>
        <p className="text-neutral-600">
          Про ваші захоплення
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <label className="block text-sm font-medium text-neutral-700 mb-2">Які тварини?</label>
            <div className="grid grid-cols-2 gap-2">
              {['Кіт','Собака','Птахи','Рибки','Гризуни','Немає','Інше'].map(opt => (
                <label key={opt} className="inline-flex items-center gap-2">
                  <input type="checkbox" name="petsInfo" checked={Array.isArray(formData.petsInfo) && formData.petsInfo.includes(opt)} onChange={() => handleCheckboxChange('petsInfo', opt)} />
                  <span className="text-sm">{opt}</span>
                </label>
              ))}
            </div>
            {Array.isArray(formData.petsInfo) && formData.petsInfo.includes('Інше') && (
              <input type="text" name="petsInfoOther" value={formData.petsInfoOther} onChange={handleChange} className="mt-2 w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="Опишіть інших тварин" />
            )}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">Хобі / Захоплення</label>
        <div className="grid grid-cols-2 gap-2">
          {['Музика','Кіно','Читання','Подорожі','Фотографія','Малювання','Рукоділля','Кулінарія','Інше'].map(opt => (
            <label key={opt} className="inline-flex items-center gap-2">
              <input type="checkbox" name="hobbies" checked={Array.isArray(formData.hobbies) && formData.hobbies.includes(opt)} onChange={() => handleCheckboxChange('hobbies', opt)} />
              <span className="text-sm">{opt}</span>
            </label>
          ))}
        </div>
        {Array.isArray(formData.hobbies) && formData.hobbies.includes('Інше') && (
          <input type="text" name="hobbiesOther" value={formData.hobbiesOther} onChange={handleChange} className="mt-2 w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="Вкажіть інше хобі" />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">Активності на свіжому повітрі</label>
        <div className="grid grid-cols-2 gap-2">
          {['Прогулянки','Пікніки','Походи','Риболовля','Поїздки на природу','Покатушки на велосипеді','Інше'].map(opt => (
            <label key={opt} className="inline-flex items-center gap-2">
              <input type="checkbox" name="outdoorActivities" checked={Array.isArray(formData.outdoorActivities) && formData.outdoorActivities.includes(opt)} onChange={() => handleCheckboxChange('outdoorActivities', opt)} />
              <span className="text-sm">{opt}</span>
            </label>
          ))}
        </div>
        {Array.isArray(formData.outdoorActivities) && formData.outdoorActivities.includes('Інше') && (
          <input type="text" name="outdoorActivitiesOther" value={formData.outdoorActivitiesOther} onChange={handleChange} className="mt-2 w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="Опишіть інше" />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">Спорт</label>
        <div className="grid grid-cols-2 gap-2">
          {['Футбол','Баскетбол','Плавання','Біг','Тренажерний зал','Йога','Велоспорт','Інше'].map(opt => (
            <label key={opt} className="inline-flex items-center gap-2">
              <input type="checkbox" name="sports" checked={Array.isArray(formData.sports) && formData.sports.includes(opt)} onChange={() => handleCheckboxChange('sports', opt)} />
              <span className="text-sm">{opt}</span>
            </label>
          ))}
        </div>
        {Array.isArray(formData.sports) && formData.sports.includes('Інше') && (
          <input type="text" name="sportsOther" value={formData.sportsOther} onChange={handleChange} className="mt-2 w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="Опишіть інше" />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">Стиль життя</label>
        <div className="grid grid-cols-2 gap-2">
          {['Активний','Спокійний','Сімейний','Соціальний','Творчий','Кар\'єрний','Інше'].map(opt => (
            <label key={opt} className="inline-flex items-center gap-2">
              <input type="checkbox" name="lifestyle" checked={Array.isArray(formData.lifestyle) && formData.lifestyle.includes(opt)} onChange={() => handleCheckboxChange('lifestyle', opt)} />
              <span className="text-sm">{opt}</span>
            </label>
          ))}
        </div>
        {Array.isArray(formData.lifestyle) && formData.lifestyle.includes('Інше') && (
          <input type="text" name="lifestyleOther" value={formData.lifestyleOther} onChange={handleChange} className="mt-2 w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="Опишіть інше" />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Про себе
        </label>
        <textarea
          name="bio"
          rows={3}
          value={formData.bio}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          placeholder="Розкажіть трохи про себе..."
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
          🌐 Соцмережі
        </h2>
        <p className="text-neutral-600">
          Додайте посилання на ваші профілі
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
            placeholder="@username або https://t.me/username"
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
          💡 <strong>Порада:</strong> Додайте посилання на соцмережі, щоб інші користувачі могли краще вас пізнати
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
          🎯 Мета використання сайту
        </h2>
        <p className="text-neutral-600">Навіщо ви користуєтесь платформою?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {['Знайти клієнтів','Знайти підрядників/послуги','Пошук роботи','Спілкування/мережування','Інше'].map(opt => (
          <label key={opt} className="inline-flex items-center gap-2">
            <input type="checkbox" name="siteUsageGoal" checked={Array.isArray(formData.siteUsageGoal) && formData.siteUsageGoal.includes(opt)} onChange={() => handleCheckboxChange('siteUsageGoal', opt)} />
            <span className="text-sm">{opt}</span>
          </label>
        ))}
      </div>

      {Array.isArray(formData.siteUsageGoal) && formData.siteUsageGoal.includes('Інше') && (
        <input type="text" name="siteUsageGoalOther" value={formData.siteUsageGoalOther || ''} onChange={handleChange} className="mt-2 w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="Опишіть інше" />
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
                Крок {currentStep} з 6
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
                    ← Назад
                  </button>
                )}

                {currentStep < 5 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={loading}
                    className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    Далі →
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Зберігаємо...' : '✓ Завершити'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={loading}
                  className="px-6 py-3 border border-neutral-300 rounded-lg font-medium text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-50"
                >
                  Пропустити
                </button>
              </div>
            </form>

            <div className="mt-6 text-center text-sm text-neutral-500">
              <p>Ви зможете змінити ці дані пізніше в налаштуваннях профілю</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
