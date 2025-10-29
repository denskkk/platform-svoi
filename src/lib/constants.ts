// Категорії послуг
export const categories = [
  { id: 'home', name: 'Побут', emoji: '🏠', slug: 'pobut' },
  { id: 'auto', name: 'Авто', emoji: '🚗', slug: 'auto' },
  { id: 'beauty', name: 'Краса', emoji: '💇', slug: 'krasa' },
  { id: 'education', name: 'Освіта', emoji: '🎓', slug: 'osvita' },
  { id: 'repair', name: 'Ремонт', emoji: '🧰', slug: 'remont' },
  { id: 'business', name: 'Бізнес', emoji: '💼', slug: 'biznes' },
  { id: 'it', name: 'IT', emoji: '💻', slug: 'it' },
  { id: 'health', name: 'Медицина', emoji: '⚕️', slug: 'medytsyna' },
  { id: 'creative', name: 'Творчість', emoji: '🎨', slug: 'tvorchist' },
] as const

// Типи акаунтів
export const accountTypes = [
  {
    id: 'individual',
    title: 'Звичайний профіль',
    icon: '👤',
    description: 'Я хочу пропонувати свої послуги',
  },
  {
    id: 'business',
    title: 'Бізнес-профіль',
    icon: '🏢',
    description: 'Маю власну справу чи компанію',
  },
  {
    id: 'viewer',
    title: 'Глядач',
    icon: '👀',
    description: 'Просто хочу переглядати',
  },
] as const

// Міста України
export const cities = [
  'Київ',
  'Харків',
  'Одеса',
  'Дніпро',
  'Донецьк',
  'Запоріжжя',
  'Львів',
  'Кривий Ріг',
  'Миколаїв',
  'Маріуполь',
  'Луганськ',
  'Вінниця',
  'Херсон',
  'Полтава',
  'Чернігів',
  'Черкаси',
  'Суми',
  'Житомир',
  'Хмельницький',
  'Рівне',
  'Чернівці',
  'Тернопіль',
  'Івано-Франківськ',
  'Луцьк',
  'Ужгород',
] as const

// Типи користувачів
export type UserType = 'individual' | 'business' | 'viewer'
export type CategoryId = typeof categories[number]['id']
