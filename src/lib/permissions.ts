/**
 * Система прав доступу для різних типів акаунтів
 */

export type AccountType = 'viewer' | 'basic' | 'business';

export const PERMISSIONS = {
  // Базові можливості
  VIEW_CATALOG: ['viewer', 'basic', 'business'] as AccountType[],
  VIEW_PROFILE: ['basic', 'business'] as AccountType[],
  EDIT_PROFILE: ['basic', 'business'] as AccountType[],
  
  // Обране
  ADD_TO_FAVORITES: ['basic', 'business'] as AccountType[],
  VIEW_FAVORITES: ['basic', 'business'] as AccountType[],
  
  // Послуги
  CREATE_SERVICE: ['basic', 'business'] as AccountType[],
  EDIT_SERVICE: ['basic', 'business'] as AccountType[],
  DELETE_SERVICE: ['basic', 'business'] as AccountType[],
  
  // Заявки (requests)
  CREATE_REQUEST: ['basic', 'business'] as AccountType[],
  VIEW_REQUESTS: ['basic', 'business'] as AccountType[],
  RESPOND_TO_REQUEST: ['basic', 'business'] as AccountType[],
  
  // Повідомлення
  SEND_MESSAGE: ['basic', 'business'] as AccountType[],
  VIEW_MESSAGES: ['basic', 'business'] as AccountType[],
  
  // Відгуки
  LEAVE_REVIEW: ['basic', 'business'] as AccountType[],
  
  // Бізнес функції
  VIEW_BUSINESS_PROFILE: ['business'] as AccountType[],
  EDIT_BUSINESS_PROFILE: ['business'] as AccountType[],
  SEARCH_PARTNERS: ['business'] as AccountType[],
  SEARCH_INVESTORS: ['business'] as AccountType[],
  SEARCH_CUSTOMERS: ['business'] as AccountType[],
  
  // Додаткові функції (доступні через платні опції в профілі)
  AUTO_PROPOSALS: ['business'] as AccountType[],
  UCM_ANALYSIS: ['business'] as AccountType[],
  PRIORITY_SEARCH: ['business'] as AccountType[],
  ADVANCED_ANALYTICS: ['business'] as AccountType[],
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
  if (allowed.includes('viewer')) return 'viewer';
  if (allowed.includes('basic')) return 'basic';
  return 'business';
}

/**
 * Отримати назву типу акаунту українською
 */
export function getAccountTypeName(accountType: AccountType): string {
  const names: Record<AccountType, string> = {
    viewer: 'Глядач',
    basic: 'Базовий',
    business: 'Бізнес'
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
    CREATE_SERVICE: `Створення послуг доступне з акаунту "${minTypeName}". Зареєструйтесь.`,
    CREATE_REQUEST: `Створення заявок доступне з акаунту "${minTypeName}". Зареєструйтесь.`,
    SEND_MESSAGE: `Надсилання повідомлень доступне з акаунту "${minTypeName}". Зареєструйтесь.`,
    AUTO_PROPOSALS: 'Автоматичні пропозиції - це платна опція. Активуйте в профілі.',
    UCM_ANALYSIS: 'Аналіз спільноти - це платна опція. Активуйте в профілі.',
  };
  
  return messages[permission] || `Ця функція доступна з акаунту "${minTypeName}". Зареєструйтесь.`;
}
