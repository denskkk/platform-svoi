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
  { slug: "antiques", icon: "🏺", color: "#92400e", nameUk: "Антикварна лавка для своїх", nameEn: "Antiques shop for your own", descriptionUk: "Антикваріат і колекційні речі від своїх.", descriptionEn: "Antiques and collectibles from your own people.", bannerUrl: null, status: 'coming_soon', sortOrder: 1 }, // i18n-ignore
  { slug: "dating", icon: "💞", color: "#be185d", nameUk: "Знайомства зі своїми", nameEn: "Dating with your own", descriptionUk: "Знайомства в колі своїх.", descriptionEn: "Meet people within your community.", bannerUrl: null, status: 'coming_soon', sortOrder: 2 }, // i18n-ignore
  { slug: "mystic", icon: "🔮", color: "#6d28d9", nameUk: "Містика для своїх", nameEn: "Mystic for your own", descriptionUk: "Містика, езотерика, практики.", descriptionEn: "Mystic, esoterica, practices.", bannerUrl: null, status: 'coming_soon', sortOrder: 3 }, // i18n-ignore
  { slug: "china", icon: "📦", color: "#b91c1c", nameUk: "Китай — закупівлі під ключ для своїх", nameEn: "China — turnkey sourcing for your own", descriptionUk: "Закупівлі з Китаю «під ключ».", descriptionEn: "Turnkey sourcing from China.", bannerUrl: null, status: 'active', sortOrder: 4 }, // i18n-ignore
  { slug: "clubs", icon: "🤝", color: "#0e7490", nameUk: "Клуби за інтересами для своїх", nameEn: "Interest clubs for your own", descriptionUk: "Риболовля, полювання, в’язання, мандрівки, спорт, творчість.", descriptionEn: "Fishing, hunting, knitting, travel, sport, creativity.", bannerUrl: null, status: 'active', sortOrder: 5 }, // i18n-ignore
  { slug: "shops", icon: "🛍️", color: "#6d28d9", nameUk: "Крамниця для своїх", nameEn: "Shop for your own", descriptionUk: "Справжня українська продукція від українських виробників.", descriptionEn: "Genuine Ukrainian products from Ukrainian producers.", bannerUrl: null, status: 'active', sortOrder: 6 }, // i18n-ignore
  { slug: "knitting", icon: "🧶", color: "#be123c", nameUk: "Клуб в’язання зі своїми", nameEn: "Knitting club with your own", descriptionUk: "Клуб в’язання.", descriptionEn: "Knitting club.", bannerUrl: null, status: 'coming_soon', sortOrder: 7 }, // i18n-ignore
  { slug: "trade", icon: "🌍", color: "#3730a3", nameUk: "Ярмарки української продукції у світі", nameEn: "Ukrainian product fairs worldwide", descriptionUk: "Ярмарки української продукції по всьому світу.", descriptionEn: "Fairs of Ukrainian products around the world.", bannerUrl: null, status: 'active', sortOrder: 8 }, // i18n-ignore
  { slug: "rebuild", icon: "🏗️", color: "#15803d", nameUk: "Відбудова України", nameEn: "Rebuilding Ukraine", descriptionUk: "Проєкти та участь у відбудові.", descriptionEn: "Projects and participation in rebuilding.", bannerUrl: null, status: 'coming_soon', sortOrder: 9 }, // i18n-ignore
  { slug: "bank", icon: "🏦", color: "#1e3a8a", nameUk: "Банк для своїх", nameEn: "Bank for your own", descriptionUk: "Фінансові сервіси для своїх.", descriptionEn: "Financial services for your own.", bannerUrl: null, status: 'coming_soon', sortOrder: 10 }, // i18n-ignore
  { slug: "cooperatives", icon: "🤲", color: "#0f766e", nameUk: "Кооперативи для своїх", nameEn: "Cooperatives for your own", descriptionUk: "Разом створюємо можливості, об’єднуємо ресурси та будуємо спільне майбутнє!", descriptionEn: "Together we create opportunities, pool resources and build a shared future!", bannerUrl: null, status: 'coming_soon', sortOrder: 11 }, // i18n-ignore
  { slug: "grants", icon: "🎓", color: "#a16207", nameUk: "Гранти для своїх", nameEn: "Grants for your own", descriptionUk: "Гранти та програми підтримки.", descriptionEn: "Grants and support programs.", bannerUrl: null, status: 'coming_soon', sortOrder: 12 }, // i18n-ignore
  { slug: "taxi", icon: "🚕", color: "#eab308", nameUk: "Таксі для своїх", nameEn: "Taxi for your own", descriptionUk: "Замовити таксі, стати водієм, заробляти зі своїми.", descriptionEn: "Order a taxi, become a driver, earn with your own people.", bannerUrl: null, status: 'active', sortOrder: 13 }, // i18n-ignore
  { slug: "real-estate", icon: "🏠", color: "#12705f", nameUk: "Агентство нерухомості для своїх", nameEn: "Real estate agency for your own", descriptionUk: "Купити, продати, орендувати, здати нерухомість.", descriptionEn: "Buy, sell, rent and let property.", bannerUrl: null, status: 'active', sortOrder: 14 }, // i18n-ignore
  { slug: "turnkey", icon: "🔑", color: "#0a3d62", nameUk: "Бізнес під ключ для своїх", nameEn: "Turnkey business for your own", descriptionUk: "Готові бізнеси та запуск під ключ.", descriptionEn: "Ready businesses and turnkey launch.", bannerUrl: null, status: 'coming_soon', sortOrder: 15 }, // i18n-ignore
  { slug: "jobs", icon: "💼", color: "#a16207", nameUk: "Робота для своїх", nameEn: "Jobs for your own", descriptionUk: "Вакансії та пошук роботи.", descriptionEn: "Vacancies and job search.", bannerUrl: null, status: 'active', sortOrder: 16 }, // i18n-ignore
  { slug: "consumer-platform", icon: "🧾", color: "#334155", nameUk: "Платформа споживача та підприємця", nameEn: "Consumer & entrepreneur platform", descriptionUk: "Платформа для споживачів і підприємців.", descriptionEn: "A platform for consumers and entrepreneurs.", bannerUrl: null, status: 'coming_soon', sortOrder: 17 }, // i18n-ignore
  { slug: "apps", icon: "📱", color: "#1d4ed8", nameUk: "Застосунки для своїх", nameEn: "Apps for your own", descriptionUk: "Застосунки від своїх.", descriptionEn: "Apps from your own people.", bannerUrl: null, status: 'coming_soon', sortOrder: 18 }, // i18n-ignore
  { slug: "translator", icon: "🌐", color: "#0e7490", nameUk: "Перекладач для своїх", nameEn: "Translator for your own", descriptionUk: "Переклади та перекладачі.", descriptionEn: "Translations and translators.", bannerUrl: null, status: 'coming_soon', sortOrder: 19 }, // i18n-ignore
  { slug: "health", icon: "🩺", color: "#1b6fb3", nameUk: "Здоров’я", nameEn: "Health", descriptionUk: "Лікарі, дієтологи, тренери.", descriptionEn: "Doctors, dietitians, trainers.", bannerUrl: null, status: 'active', sortOrder: 20 }, // i18n-ignore
  { slug: "invest", icon: "📈", color: "#166534", nameUk: "Дошка оголошень інвестиційних проєктів та пошуку інвесторів", nameEn: "Investment projects & investor board", descriptionUk: "Інвестиційні проєкти та пошук інвесторів.", descriptionEn: "Investment projects and investor search.", bannerUrl: null, status: 'coming_soon', sortOrder: 21 }, // i18n-ignore
  { slug: "lawyers", icon: "⚖️", color: "#1e3a8a", nameUk: "Адвокатське об’єднання «Свій»", nameEn: "Law association “Svii”", descriptionUk: "Адвокати та консультації.", descriptionEn: "Lawyers and consultations.", bannerUrl: null, status: 'active', sortOrder: 22 }, // i18n-ignore
  { slug: "travel", icon: "✈️", color: "#0369a1", nameUk: "Турагенція для своїх", nameEn: "Travel agency for your own", descriptionUk: "Тури та подорожі.", descriptionEn: "Tours and travel.", bannerUrl: null, status: 'coming_soon', sortOrder: 23 }, // i18n-ignore
  { slug: "cars", icon: "🚗", color: "#1e4fa8", nameUk: "Автосалон онлайн для своїх", nameEn: "Online car dealership for your own", descriptionUk: "Купити авто, автосалони, «шукаю».", descriptionEn: "Buy a car, dealerships, “looking for”.", bannerUrl: null, status: 'active', sortOrder: 24 }, // i18n-ignore
  { slug: "pets", icon: "🐾", color: "#b45309", nameUk: "Онлайн зоомагазин", nameEn: "Online pet shop", descriptionUk: "Товари для тварин.", descriptionEn: "Pet supplies.", bannerUrl: null, status: 'coming_soon', sortOrder: 25 } // i18n-ignore
];

function normalize(status: string): ProjectStatus {
  return (PROJECT_STATUSES as string[]).includes(status) ? (status as ProjectStatus) : 'coming_soon';
}

export async function listProjects(options: { includeHidden?: boolean } = {}): Promise<ProjectDTO[]> {
  let rows: ProjectDTO[] = [];
  try {
    const found = await prisma.project.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] });
    rows = found.map((p: any) => ({
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
