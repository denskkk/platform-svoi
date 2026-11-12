/**
 * Напрямки («Проєкти»). Джерело правди — таблиця `projects` (редагується в адмін-панелі).
 * Якщо таблиця ще порожня або недоступна, використовується стартовий список нижче,
 * тож розділ працює навіть до виконання міграції.
 */

import { prisma } from '@/lib/prisma';

export type ProjectStatus = 'active' | 'coming_soon' | 'hidden';
export const PROJECT_STATUSES: ProjectStatus[] = ['active', 'coming_soon', 'hidden'];

export interface ProjectDTO {
  slug: string;
  icon: string | null;
  color: string | null;
  bannerUrl: string | null;
  nameUk: string;
  nameEn: string;
  descriptionUk: string | null;
  descriptionEn: string | null;
  status: ProjectStatus;
  sortOrder: number;
}

// i18n-ignore: стартові дані каталогу (контент, а не інтерфейс)
export const DEFAULT_PROJECTS: ProjectDTO[] = [
  { slug: 'cars', icon: '🚗', color: '#2563eb', nameUk: "Автомобілі", nameEn: "Cars", descriptionUk: "Купівля та продаж авто, автосалони, сервіс.", descriptionEn: "Buy and sell cars, dealerships, service.", bannerUrl: null, status: 'coming_soon', sortOrder: 10 }, // i18n-ignore
  { slug: 'real-estate', icon: '🏠', color: '#0d9488', nameUk: "Нерухомість", nameEn: "Real estate", descriptionUk: "Квартири, будинки, комерційна нерухомість, оренда та продаж.", descriptionEn: "Apartments, houses, commercial property, rent and sale.", bannerUrl: null, status: 'coming_soon', sortOrder: 20 }, // i18n-ignore
  { slug: 'health', icon: '🩺', color: '#dc2626', nameUk: "Здоров’я", nameEn: "Health", descriptionUk: "Лікарі, клініки, онлайн-консультації, реабілітація.", descriptionEn: "Doctors, clinics, online consultations, rehabilitation.", bannerUrl: null, status: 'coming_soon', sortOrder: 30 }, // i18n-ignore
  { slug: 'sport', icon: '🏋️', color: '#ea580c', nameUk: "Спорт і тренери", nameEn: "Sports & coaches", descriptionUk: "Тренери, секції, фітнес, онлайн-тренування.", descriptionEn: "Coaches, classes, fitness, online training.", bannerUrl: null, status: 'coming_soon', sortOrder: 40 }, // i18n-ignore
  { slug: 'shops', icon: '🛍️', color: '#9333ea', nameUk: "Інтернет-магазини", nameEn: "Online stores", descriptionUk: "Вітрини магазинів і перехід на їхні сайти.", descriptionEn: "Store showcases that lead to the stores' own websites.", bannerUrl: null, status: 'coming_soon', sortOrder: 50 }, // i18n-ignore
  { slug: 'events', icon: '🎟️', color: '#db2777', nameUk: "Події", nameEn: "Events", descriptionUk: "Заходи, конференції, виставки, зустрічі, навчання.", descriptionEn: "Events, conferences, exhibitions, meetups, training.", bannerUrl: null, status: 'coming_soon', sortOrder: 60 }, // i18n-ignore
  { slug: 'clubs', icon: '🤝', color: '#0891b2', nameUk: "Клуби та спільноти", nameEn: "Clubs & communities", descriptionUk: "Клуби за інтересами та професійні спільноти.", descriptionEn: "Interest clubs and professional communities.", bannerUrl: null, status: 'coming_soon', sortOrder: 70 }, // i18n-ignore
  { slug: 'trade', icon: '🌍', color: '#4f46e5', nameUk: "Міжнародна торгівля", nameEn: "International trade", descriptionUk: "Виробники, постачальники, імпорт та експорт.", descriptionEn: "Manufacturers, suppliers, import and export.", bannerUrl: null, status: 'coming_soon', sortOrder: 80 }, // i18n-ignore
  { slug: 'china', icon: '📦', color: '#b91c1c', nameUk: "Китай і постачання", nameEn: "China & supply", descriptionUk: "Товари з Китаю, виробники, логістика, оптові пропозиції.", descriptionEn: "Goods from China, manufacturers, logistics, wholesale offers.", bannerUrl: null, status: 'coming_soon', sortOrder: 90 }, // i18n-ignore
  { slug: 'services', icon: '🛠️', color: '#16a34a', nameUk: "Послуги", nameEn: "Services", descriptionUk: "Спеціалісти та компанії, які надають послуги.", descriptionEn: "Specialists and companies offering services.", bannerUrl: null, status: 'coming_soon', sortOrder: 100 }, // i18n-ignore
  { slug: 'jobs', icon: '💼', color: '#ca8a04', nameUk: "Робота і співпраця", nameEn: "Jobs & cooperation", descriptionUk: "Вакансії, пошук партнерів і співпраця.", descriptionEn: "Vacancies, partner search and cooperation.", bannerUrl: null, status: 'coming_soon', sortOrder: 110 }, // i18n-ignore
  { slug: 'other', icon: '✨', color: '#64748b', nameUk: "Інші напрямки", nameEn: "Other", descriptionUk: "Нові напрямки з’являтимуться тут.", descriptionEn: "New directions will appear here.", bannerUrl: null, status: 'coming_soon', sortOrder: 120 } // i18n-ignore
];

function normalize(status: string): ProjectStatus {
  return (PROJECT_STATUSES as string[]).includes(status) ? (status as ProjectStatus) : 'coming_soon';
}

export async function listProjects(options: { includeHidden?: boolean } = {}): Promise<ProjectDTO[]> {
  let rows: ProjectDTO[] = [];
  try {
    const found = await prisma.project.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] });
    rows = found.map((p) => ({
      slug: p.slug, icon: p.icon, color: p.color, bannerUrl: p.bannerUrl,
      nameUk: p.nameUk, nameEn: p.nameEn, descriptionUk: p.descriptionUk, descriptionEn: p.descriptionEn,
      status: normalize(p.status), sortOrder: p.sortOrder,
    }));
  } catch (error) {
    console.error('List projects failed, using defaults:', error);
  }
  if (rows.length === 0) rows = DEFAULT_PROJECTS;
  return options.includeHidden ? rows : rows.filter((p) => p.status !== 'hidden');
}

export async function getProject(slug: string): Promise<ProjectDTO | null> {
  const all = await listProjects();
  return all.find((p) => p.slug === slug) ?? null;
}
