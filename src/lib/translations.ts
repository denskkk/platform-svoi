/**
 * Централізована система перекладів для платформи "СВІЙ ДЛЯ СВОЇХ"
 * Всі переклади enum значень, категорій, статусів тощо
 */

// Стать
export const translateGender = (gender: string | null | undefined): string => {
  if (!gender) return '';
  const translations: Record<string, string> = {
    'male': 'Чоловік',
    'female': 'Жінка',
    'other': 'Інше'
  };
  return translations[gender] || gender;
};

// Сімейний стан
export const translateMaritalStatus = (status: string | null | undefined): string => {
  if (!status) return '';
  const translations: Record<string, string> = {
    'single': 'Неодружений/Незаміжня',
    'married': 'Одружений/Заміжня',
    'divorced': 'Розлучений/Розлучена',
    'widowed': 'Вдівець/Вдова',
    'in_relationship': 'У стосунках',
    'relationship': 'У стосунках',
    'engaged': 'Заручений/Заручена',
    'civil': 'У цивільному шлюбі'
  };
  return translations[status] || status;
};

// Освіта
export const translateEducation = (education: string | null | undefined): string => {
  if (!education) return '';
  const translations: Record<string, string> = {
    'secondary': 'Середня освіта',
    'vocational': 'Професійно-технічна',
    'incomplete_higher': 'Неповна вища',
    'bachelor': 'Бакалавр',
    'master': 'Магістр',
    'phd': 'Кандидат наук',
    'doctorate': 'Доктор наук',
    'college': 'Коледж'
  };
  return translations[education] || education;
};

// Статус зайнятості
export const translateEmploymentStatus = (status: string | null | undefined): string => {
  if (!status) return '';
  const translations: Record<string, string> = {
    'employed': 'Працевлаштований',
    'self_employed': 'Самозайнятий',
    'unemployed': 'Безробітний',
    'student': 'Студент',
    'retired': 'Пенсіонер',
    'looking_for_work': 'Шукаю роботу',
    'business_owner': 'Власник бізнесу',
    'freelancer': 'Фрілансер',
    'freelance': 'Фріланс',
    'business': 'Власний бізнес'
  };
  return translations[status] || status;
};

// Тип акаунту
export const translateAccountType = (type: string | null | undefined): string => {
  if (!type) return '';
  const translations: Record<string, string> = {
    'viewer': 'Глядач',
    'basic': 'Базовий',
    'business': 'Бізнес',
    'user': 'Звичайний'
  };
  return translations[type] || type;
};

// Категорії бізнесу/послуг
export const translateCategory = (category: string | null | undefined): string => {
  if (!category) return '';
  const translations: Record<string, string> = {
    'auto_service': 'Автосервіс',
    'beauty': 'Краса та здоров\'я',
    'food': 'Їжа та харчування',
    'education': 'Освіта',
    'health': 'Здоров\'я',
    'sport': 'Спорт та фітнес',
    'entertainment': 'Розваги',
    'repair': 'Ремонт',
    'construction': 'Будівництво',
    'cleaning': 'Прибирання',
    'transport': 'Транспорт',
    'finance': 'Фінанси',
    'law': 'Юридичні послуги',
    'it': 'IT та технології',
    'marketing': 'Маркетинг',
    'real_estate': 'Нерухомість',
    'retail': 'Роздрібна торгівля',
    'wholesale': 'Оптова торгівля',
    'manufacturing': 'Виробництво',
    'agriculture': 'Сільське господарство',
    'tourism': 'Туризм',
    'hospitality': 'Готельний бізнес',
    'logistics': 'Логістика',
    'consulting': 'Консалтинг',
    'design': 'Дизайн',
    'photo_video': 'Фото/Відео',
    'events': 'Організація подій',
    'products': 'Продукти харчування',
    'advertising': 'Реклама та маркетинг',
    'online_sales': 'Інтернет-продажі',
    'offline_sales': 'Офлайн-торгівля',
    'other': 'Інше'
  };
  return translations[category] || category;
};

// Тип пропозиції
export const translateOfferType = (offerType: string | null | undefined): string => {
  if (!offerType) return '';
  const translations: Record<string, string> = {
    'service': 'Послуга',
    'product': 'Товар',
    'both': 'Послуги та товари'
  };
  return translations[offerType] || offerType;
};

// Тип зайнятості
export const translateEmploymentType = (type: string | null | undefined): string => {
  if (!type) return '';
  const translations: Record<string, string> = {
    'full-time': 'Повна зайнятість',
    'full_time': 'Повна зайнятість',
    'part-time': 'Часткова зайнятість',
    'part_time': 'Часткова зайнятість',
    'contract': 'Контракт',
    'freelance': 'Фріланс',
    'internship': 'Стажування',
    'remote': 'Віддалена робота'
  };
  return translations[type] || type;
};

// Тип компанії
export const translateCompanyType = (type: string | null | undefined): string => {
  if (!type) return '';
  const translations: Record<string, string> = {
    'fop': 'ФОП',
    'tov': 'ТОВ',
    'pat': 'ПАТ',
    'other': 'Інше',
    'individual': 'Фізична особа',
    'llc': 'ТОВ',
    'jsc': 'ПАТ'
  };
  return translations[type] || type;
};

// Так/Ні
export const translateBoolean = (value: boolean | null | undefined, yesText = 'Так', noText = 'Ні'): string => {
  if (value === null || value === undefined) return '';
  return value ? yesText : noText;
};

// Тип житла
export const translateHousingType = (type: string | null | undefined): string => {
  if (!type) return '';
  const translations: Record<string, string> = {
    'house': 'Будинок',
    'apartment': 'Квартира',
    'room': 'Кімната',
    'other': 'Інше'
  };
  return translations[type] || type;
};

// Проживання
export const translateLivingSituation = (situation: string | null | undefined): string => {
  if (!situation) return '';
  const translations: Record<string, string> = {
    'alone': 'Самостійно',
    'family': 'З родиною',
    'roommates': 'З співмешканцями',
    'parents': 'З батьками'
  };
  return translations[situation] || situation;
};

// Статус транзакції
export const translateTransactionStatus = (status: string | null | undefined): string => {
  if (!status) return '';
  const translations: Record<string, string> = {
    'pending': 'Очікує',
    'completed': 'Завершено',
    'failed': 'Помилка',
    'cancelled': 'Скасовано'
  };
  return translations[status] || status;
};

// Тип транзакції
export const translateTransactionType = (type: string | null | undefined): string => {
  if (!type) return '';
  const translations: Record<string, string> = {
    'referral_bonus': 'Бонус за реферала',
    'referral_invitee': 'Бонус за реєстрацію',
    'service_payment': 'Оплата послуги',
    'service_received': 'Отримано за послугу',
    'transfer_sent': 'Переказ відправлено',
    'transfer_received': 'Переказ отримано',
    'admin_adjustment': 'Коригування адміністратора',
    'reward': 'Нагорода',
    'penalty': 'Штраф'
  };
  return translations[type] || type;
};

// Роль користувача
export const translateRole = (role: string | null | undefined): string => {
  if (!role) return '';
  const translations: Record<string, string> = {
    'user': 'Користувач',
    'business': 'Бізнес',
    'admin': 'Адміністратор',
    'moderator': 'Модератор'
  };
  return translations[role] || role;
};

// Дозволи
export const translatePermission = (permission: string | null | undefined): string => {
  if (!permission) return '';
  const translations: Record<string, string> = {
    'view_services': 'Перегляд послуг',
    'create_service': 'Створення послуг',
    'edit_service': 'Редагування послуг',
    'delete_service': 'Видалення послуг',
    'view_users': 'Перегляд користувачів',
    'manage_users': 'Управління користувачами',
    'send_messages': 'Надсилання повідомлень',
    'leave_reviews': 'Залишати відгуки',
    'earn_ucm': 'Заробляти УЦМ'
  };
  return translations[permission] || permission;
};

// Список як рядок
export const formatList = (items: any[] | string | null | undefined, separator = ', '): string => {
  if (!items) return '';
  if (typeof items === 'string') {
    return items;
  }
  if (Array.isArray(items)) {
    return items.filter(Boolean).join(separator);
  }
  return String(items);
};

// Форматування дати
export const formatDate = (date: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions): string => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  };
  return d.toLocaleDateString('uk-UA', defaultOptions);
};

// Форматування дати та часу
export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('uk-UA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Форматування валюти (УЦМ)
export const formatUCM = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return '0';
  return `${amount.toLocaleString('uk-UA')} УЦМ`;
};

// Форматування гривень
export const formatUAH = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return '0 ₴';
  return `${amount.toLocaleString('uk-UA')} ₴`;
};
