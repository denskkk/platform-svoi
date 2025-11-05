/**
 * Система прав доступу для різних типів акаунтів
 */

export type AccountType = 'guest' | 'basic' | 'extended' | 'business' | 'business_premium';

export const PERMISSIONS = {
  // Базові можливості
  VIEW_CATALOG: ['guest', 'basic', 'extended', 'business', 'business_premium'] as AccountType[],
  VIEW_PROFILE: ['basic', 'extended', 'business', 'business_premium'] as AccountType[],
  EDIT_PROFILE: ['basic', 'extended', 'business', 'business_premium'] as AccountType[],
  
  // Обране
  ADD_TO_FAVORITES: ['basic', 'extended', 'business', 'business_premium'] as AccountType[],
  VIEW_FAVORITES: ['basic', 'extended', 'business', 'business_premium'] as AccountType[],
  
  // Послуги
  CREATE_SERVICE: ['business', 'business_premium'] as AccountType[],
  EDIT_SERVICE: ['business', 'business_premium'] as AccountType[],
  DELETE_SERVICE: ['business', 'business_premium'] as AccountType[],
  
  // Заявки (requests)
  CREATE_REQUEST: ['extended', 'business', 'business_premium'] as AccountType[],
  VIEW_REQUESTS: ['extended', 'business', 'business_premium'] as AccountType[],
  RESPOND_TO_REQUEST: ['business', 'business_premium'] as AccountType[],
  
  // Повідомлення
  SEND_MESSAGE: ['extended', 'business', 'business_premium'] as AccountType[],
  VIEW_MESSAGES: ['extended', 'business', 'business_premium'] as AccountType[],
  
  // Відгуки
  LEAVE_REVIEW: ['basic', 'extended', 'business', 'business_premium'] as AccountType[],
  
  // Бізнес функції
  VIEW_BUSINESS_PROFILE: ['business', 'business_premium'] as AccountType[],
  EDIT_BUSINESS_PROFILE: ['business', 'business_premium'] as AccountType[],
  SEARCH_PARTNERS: ['business', 'business_premium'] as AccountType[],
  SEARCH_INVESTORS: ['business', 'business_premium'] as AccountType[],
  SEARCH_CUSTOMERS: ['business', 'business_premium'] as AccountType[],
  
  // Преміум функції
  AUTO_PROPOSALS: ['business_premium'] as AccountType[],
  UCM_ANALYSIS: ['business_premium'] as AccountType[],
  PRIORITY_SEARCH: ['business_premium'] as AccountType[],
  ADVANCED_ANALYTICS: ['business_premium'] as AccountType[],
};

/**
 * Перевірити чи має користувач право на дію
 */
export function hasPermission(accountType: AccountType | null | undefined, permission: keyof typeof PERMISSIONS): boolean {
  if (!accountType) return false;
  return PERMISSIONS[permission].includes(accountType);
}

/**
 * Отримати мінімальний тип акаунту для дії
 */
export function getMinimumAccountType(permission: keyof typeof PERMISSIONS): AccountType {
  const allowed = PERMISSIONS[permission];
  if (allowed.includes('guest')) return 'guest';
  if (allowed.includes('basic')) return 'basic';
  if (allowed.includes('extended')) return 'extended';
  if (allowed.includes('business')) return 'business';
  return 'business_premium';
}

/**
 * Отримати назву типу акаунту українською
 */
export function getAccountTypeName(accountType: AccountType): string {
  const names: Record<AccountType, string> = {
    guest: 'Гість',
    basic: 'Базовий',
    extended: 'Розширений',
    business: 'Бізнес',
    business_premium: 'Бізнес Преміум'
  };
  return names[accountType];
}

/**
 * Отримати опис обмеження для користувача
 */
export function getPermissionError(permission: keyof typeof PERMISSIONS): string {
  const minType = getMinimumAccountType(permission);
  const minTypeName = getAccountTypeName(minType);
  
  const messages: Partial<Record<keyof typeof PERMISSIONS, string>> = {
    CREATE_SERVICE: `Створення послуг доступне тільки для бізнес акаунтів. Оновіть свій акаунт до "${minTypeName}".`,
    CREATE_REQUEST: `Створення заявок доступне з акаунту "${minTypeName}". Оновіть свій план.`,
    SEND_MESSAGE: `Надсилання повідомлень доступне з акаунту "${minTypeName}". Оновіть свій план.`,
    AUTO_PROPOSALS: 'Автоматичні пропозиції доступні тільки для Бізнес Преміум акаунтів.',
    UCM_ANALYSIS: 'UCM аналіз доступний тільки для Бізнес Преміум акаунтів.',
  };
  
  return messages[permission] || `Ця функція доступна з акаунту "${minTypeName}". Оновіть свій план.`;
}
