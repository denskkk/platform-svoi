/**
 * Система прав доступу для різних типів акаунтів
 */

import { createTranslator, Translator } from '@/i18n/translate';
import { getMessages } from '@/i18n/messages';

export type AccountType = 'viewer' | 'basic' | 'business';

// Without an explicit translator (e.g. client hooks) the default locale is used.
const defaultTranslator = (): Translator => createTranslator('uk', getMessages('uk'), getMessages('en'));

export const PERMISSIONS = {
  // Базові можливості
  VIEW_CATALOG: ['viewer', 'basic', 'business'] as AccountType[],
  VIEW_PROFILE: ['viewer', 'basic', 'business'] as AccountType[],
  EDIT_PROFILE: ['viewer', 'basic', 'business'] as AccountType[],
  
  // Обране
  ADD_TO_FAVORITES: ['viewer', 'basic', 'business'] as AccountType[],
  VIEW_FAVORITES: ['viewer', 'basic', 'business'] as AccountType[],
  
  // Послуги
  CREATE_SERVICE: ['basic', 'business'] as AccountType[],
  EDIT_SERVICE: ['basic', 'business'] as AccountType[],
  DELETE_SERVICE: ['basic', 'business'] as AccountType[],
  
  // Заявки (requests)
  CREATE_REQUEST: ['basic', 'business'] as AccountType[],
  VIEW_REQUESTS: ['basic', 'business'] as AccountType[],
  RESPOND_TO_REQUEST: ['basic', 'business'] as AccountType[],
  
  // Стрічка
  VIEW_FEED: ['viewer', 'basic', 'business'] as AccountType[],
  CREATE_POST: ['basic', 'business'] as AccountType[],
  INTERACT_POST: ['basic', 'business'] as AccountType[],
  FOLLOW_USER: ['viewer', 'basic', 'business'] as AccountType[],

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
export function getAccountTypeName(accountType: AccountType, t: Translator = defaultTranslator()): string {
  return t(`api.permissions.accountTypes.${accountType}`);
}

/**
 * Отримати опис обмеження для користувача
 */
export function getPermissionError(permission: keyof typeof PERMISSIONS, t: Translator = defaultTranslator()): string {
  const minType = getMinimumAccountType(permission);
  const type = getAccountTypeName(minType, t);
  
  const keys: Partial<Record<keyof typeof PERMISSIONS, string>> = {
    CREATE_SERVICE: 'api.permissions.createService',
    CREATE_REQUEST: 'api.permissions.createRequest',
    SEND_MESSAGE: 'api.permissions.sendMessage',
    CREATE_POST: 'api.permissions.createPost',
    INTERACT_POST: 'api.permissions.interactPost',
    AUTO_PROPOSALS: 'api.permissions.autoProposals',
  };
  
  return t(keys[permission] ?? 'api.permissions.default', { type });
}
