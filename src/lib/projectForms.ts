/**
 * Структурні анкети проєктів (за ТЗ замовника): набір полів + вид звернення. Заявка потрапляє в адмінку «Пропозиції»
 * (project_suggestions) у вигляді «[Назва розділу] Поле: значення | …». Грошей система не рухає.
 * Підписи: projects.f.<форма>.title, projects.fld.<поле>, projects.fopt.<поле>.<значення>, projects.fh.<заголовок>.
 * Модуль без залежностей: безпечний і на клієнті, і на сервері.
 */
export type FieldType = 'text' | 'area' | 'tel' | 'email' | 'date' | 'num' | 'sel';
export interface FieldDef { t: FieldType; opts?: string[] }
export type FormKind = 'request' | 'consult' | 'suggestion' | 'complaint' | 'specialist' | 'market';
export interface FormDef {
  kind: FormKind;
  /** Поле з «*» обов'язкове; «#назва» — заголовок підгрупи; «photos» — додавання до 3 фото */
  fields: string[];
  /** Після заголовка показати пояснення projects.fnote.<ключ> */
  note?: string;
}

const YN = ['yes', 'no'];
export const FIELDS: Record<string, FieldDef> = {
  name: { t: 'text' }, phone: { t: 'tel' }, email: { t: 'email' },
  country: { t: 'text' }, region: { t: 'text' }, city: { t: 'text' }, address: { t: 'text' },
  desc: { t: 'area' }, what: { t: 'area' }, text: { t: 'area' }, exp: { t: 'area' }, services: { t: 'area' }, character: { t: 'area' }, care: { t: 'area' }, routes: { t: 'area' }, categories: { t: 'area' }, delivery: { t: 'area' }, goal: { t: 'area' }, resources: { t: 'area' },
  date: { t: 'date' }, dateFrom: { t: 'date' }, dateTo: { t: 'date' }, back: { t: 'date' },
  title: { t: 'text' }, budget: { t: 'text' }, deadline: { t: 'text' }, term: { t: 'text' }, site: { t: 'text' }, company: { t: 'text' }, price: { t: 'text' }, schedule: { t: 'text' },
  direction: { t: 'text' }, specialty: { t: 'text' }, education: { t: 'text' }, languagePairs: { t: 'text' }, srcLang: { t: 'text' }, dstLang: { t: 'text' }, docType: { t: 'text' },
  pet: { t: 'text' }, age: { t: 'text' }, medical: { t: 'text' }, from: { t: 'text' }, to: { t: 'text' }, class: { t: 'text' }, baggage: { t: 'text' }, ages: { t: 'text' }, purpose: { t: 'text' }, countries: { t: 'text' }, hotel: { t: 'text' }, children: { t: 'text' },
  car: { t: 'text' }, jobWanted: { t: 'text' }, salary: { t: 'text' }, startWhen: { t: 'text' }, volumes: { t: 'text' }, terms: { t: 'text' }, buy: { t: 'text' }, product: { t: 'text' }, amount: { t: 'text' },
  shopName: { t: 'text' }, products: { t: 'text' }, cargo: { t: 'text' }, org: { t: 'text' }, proof: { t: 'text' }, report: { t: 'text' }, parent: { t: 'text' }, exportCountries: { t: 'text' },
  adults: { t: 'num' }, days: { t: 'num' }, count: { t: 'num' },
  location: { t: 'sel', opts: ['ua', 'abroad'] },
  activity: { t: 'sel', opts: ['producer', 'seller', 'shopOwner', 'farm', 'master', 'other'] },
  productKind: { t: 'sel', opts: ['food', 'meatDairy', 'fish', 'sweets', 'drinks', 'textile', 'souvenirs', 'other'] },
  exportDocs: { t: 'sel', opts: ['yes', 'no', 'partly'] }, exportExp: { t: 'sel', opts: YN }, hasStore: { t: 'sel', opts: YN }, sellsUa: { t: 'sel', opts: YN },
  restKind: { t: 'sel', opts: ['sea', 'family', 'romantic', 'excursion', 'active', 'mountain', 'other'] },
  need: { t: 'sel', opts: ['services', 'goods', 'suppliers', 'staff', 'export', 'purchases', 'other'] },
  freq: { t: 'sel', opts: ['once', 'regular'] },
  supplier: { t: 'sel', opts: ['local', 'abroad', 'any'] },
  export: { t: 'sel', opts: YN },
  format: { t: 'sel', opts: ['online', 'offline', 'both'] },
  official: { t: 'sel', opts: YN },
  storeKind: { t: 'sel', opts: ['store', 'warehouse'] },
  deptType: { t: 'sel', opts: ['main', 'sub'] },
  placeLevel: { t: 'sel', opts: ['country', 'region', 'city', 'breed'] },
  prodForm: { t: 'sel', opts: ['fresh', 'frozen', 'processed', 'dried', 'other'] },
  farmName: { t: 'text' }, productName: { t: 'text' }, category: { t: 'text' }, sort: { t: 'text' }, quality: { t: 'text' }, volume: { t: 'text' }, minBatch: { t: 'text' }, readyPeriod: { t: 'text' },
  marketWhere: { t: 'area' }, buyers: { t: 'area' }, transport: { t: 'text' }, temp: { t: 'text' }, payTerms: { t: 'text' }, contactPerson: { t: 'text' }, sphere: { t: 'text' }, source: { t: 'text' }, comment: { t: 'area' },
  languages: { t: 'text' }, help: { t: 'area' }, area: { t: 'text' }, season: { t: 'text' }, supply: { t: 'text' }, buyer: { t: 'text' },
  courseKind: { t: 'sel', opts: ['amateur', 'certified'] },
  district: { t: 'text' }, duration: { t: 'text' }, interests: { t: 'area' }, item: { t: 'text' },
};

const P = ['phone*'];
const base = (kind: FormKind, ...fields: string[]): FormDef => ({ kind, fields });
const ORG = ['name*', 'country*', 'region', 'city*', 'exp', 'resources', 'site', 'phone*'];

export const FORMS: Record<string, FormDef> = {
  // Загальні
  consult: base('consult', 'name', 'country', 'city', 'desc*', ...P),
  join: base('request', 'name*', 'country*', 'region', 'city*', 'exp*', 'desc', ...P),
  service: base('request', 'desc*', 'country*', 'city*', 'date', ...P),
  training: base('request', 'desc*', 'country', 'city', 'format', ...P),
  newDirection: base('suggestion', 'title*', 'desc*', 'country', 'phone'),
  partnerApply: base('request', 'name*', 'company', 'country*', 'region', 'city', 'desc*', 'site', 'photos', ...P),
  shopApply: base('request', 'shopName*', 'country*', 'region', 'categories', 'desc*', 'site', 'delivery', 'photos', ...P),
  carrierAdd: base('request', 'name*', 'country*', 'city*', 'routes*', 'cargo', 'schedule', 'price', 'photos', ...P),
  becomeSpecialist: base('specialist', 'name*', 'country*', 'city*', 'specialty*', 'exp*', 'services', 'price', 'site', 'photos', ...P),
  addSection: base('suggestion', 'title*', 'deptType*', 'parent', 'desc*', 'categories', 'country', 'city', 'photos', ...P),
  addDept: base('suggestion', 'title*', 'deptType*', 'parent', 'desc*', 'categories', 'country', 'city', 'photos', ...P),
  addPlace: base('request', 'placeLevel*', 'title*', 'desc', 'phone'),
  serviceRequest: base('request', 'country*', 'city', 'company', 'desc*', 'freq', 'deadline', ...P),
  bizHelp: base('request', 'company*', 'country*', 'city*', 'need*', 'desc*', ...P),
  // Помічник на годину
  masterApply: base('specialist', 'name*', 'country*', 'region', 'city*', 'direction*', 'services', 'exp', 'photos', ...P),
  orderWork: base('request', 'what*', 'country', 'city*', 'address', 'date', 'budget', 'photos', ...P),
  offerWork: base('request', 'desc*', 'price', 'schedule', ...P),
  rentRequest: base('request', 'title*', 'date', 'term', ...P),
  // Робота
  jobSeeker: base('request', 'name*', 'phone*', 'country*', 'region*', 'city', 'jobWanted*', 'salary', 'schedule', 'exp*', 'startWhen', 'desc'),
  // Автосалон
  carPick: base('request', 'country*', 'region', 'car*', 'budget*', 'desc', ...P),
  carRentRequest: base('request', 'country*', 'region', 'car*', 'date', 'term', 'budget', 'desc', ...P),
  // Крамниця
  partnerStore: base('request', 'storeKind*', 'name*', 'country*', 'region', 'city*', 'address', 'desc*', 'products*', 'photos', ...P),
  // Бізнес під ключ
  partnerSearch: base('request', 'country*', 'city', 'company*', 'buy*', 'desc*', 'volumes', 'freq', 'supplier', ...P),
  marketSearch: base('market', 'product*', 'volumes', 'countries*', 'export', 'terms', 'desc', ...P),
  // Інвестиції
  investApply: base('request', 'name*', 'country', 'amount*', 'desc*', ...P),
  projectContact: base('consult', 'desc*', ...P),
  // Перекладач
  translateRequest: base('request', 'srcLang*', 'dstLang*', 'docType', 'desc*', 'deadline', ...P),
  translateOfficial: { kind: 'request', fields: ['srcLang*', 'dstLang*', 'docType*', 'country', 'text*', 'deadline', ...P], note: 'privacy' },
  translateDocs: { kind: 'request', fields: ['srcLang*', 'dstLang*', 'docType*', 'text*', 'deadline', ...P], note: 'privacy' },
  translateText: { kind: 'request', fields: ['srcLang*', 'dstLang*', 'text*', 'deadline', ...P], note: 'privacy' },
  newLanguage: base('suggestion', 'title*', 'desc', 'phone'),
  becomeTranslator: base('specialist', 'name*', 'country*', 'city', 'languagePairs*', 'education', 'exp*', 'direction', 'format', 'price', 'official', 'photos', ...P),
  // Турагентство
  tourRequest: base('request', 'country*', 'from*', 'date*', 'adults*', 'children', 'budget', 'desc', ...P),
  seatRequest: base('request', 'adults*', 'from', 'desc', ...P),
  askOrganizer: base('consult', 'desc*', 'phone'),
  bookTour: base('request', 'date', 'adults', 'from', 'desc', ...P),
  checkSeats: base('consult', 'date', 'desc*', ...P),
  pickRest: base('request', 'countries*', 'from*', 'dateFrom*', 'days', 'adults*', 'children', 'budget*', 'restKind', 'hotel', 'desc', ...P),
  ticketRequest: base('request', 'from*', 'to*', 'date*', 'back', 'adults*', 'class', 'baggage', ...P),
  insuranceRequest: base('request', 'country*', 'dateFrom*', 'dateTo*', 'count*', 'ages*', 'purpose', 'desc', ...P),
  becomeAgent: base('specialist', 'name*', 'country*', 'city', 'exp*', 'direction*', 'desc', ...P),
  becomeOrganizer: base('request', 'name*', 'country*', 'city*', 'exp*', 'desc*', ...P),
  // Зоомагазин
  lesson: base('request', 'pet*', 'desc*', 'city', 'format', ...P),
  appointment: base('request', 'pet*', 'desc*', 'date', 'city', ...P),
  groomRequest: base('request', 'pet*', 'country*', 'city*', 'date', 'desc', ...P),
  sittingRequest: base('request', 'pet*', 'age', 'country*', 'city*', 'dateFrom*', 'dateTo*', 'character', 'care', 'medical', ...P),
  walkRequest: base('request', 'pet*', 'country*', 'city*', 'schedule*', 'desc', ...P),
  bookPlace: base('request', 'pet*', 'dateFrom*', 'dateTo*', 'desc', ...P),
  petTransport: base('request', 'from*', 'to*', 'pet*', 'date', 'desc', ...P),
  volunteer: base('request', 'desc*', 'country', 'city', ...P),
  charityPropose: base('suggestion', 'org*', 'goal*', 'country', 'city', 'proof', 'report', ...P),
  // Антикварна лавка
  appraisalRequest: base('request', 'item*', 'country*', 'city', 'desc*', 'format', 'photos', ...P),
  // Клуби за інтересами
  joinClub: base('request', 'name*', 'country*', 'region', 'city*', 'district', 'interests', 'photos', ...P),
  becomeBlogger: base('specialist', 'name*', 'country', 'city', 'site*', 'desc*', 'photos', ...P),
  offerCourse: base('request', 'title*', 'courseKind*', 'format', 'duration', 'price', 'terms', 'site', 'desc*', 'photos', ...P),
  newClub: base('suggestion', 'title*', 'desc*', 'country', 'city', 'phone'),
  // Український експортний альянс
  farmApply: base('request', 'farmName*', 'country*', 'region', 'city', 'direction', 'area', 'products*', 'volume', 'season', 'delivery', 'site', 'photos', ...P),
  supplierApply: base('request', 'company*', 'country*', 'city', 'categories*', 'desc*', 'delivery', 'site', 'photos', ...P),
  marketRequest: { kind: 'request', fields: ['#product', 'productName*', 'category', 'sort', 'quality', 'desc', '#volume', 'volume*', 'minBatch', 'readyPeriod', '#form', 'prodForm*', '#place', 'country*', 'region', 'city', '#market', 'marketWhere*', 'buyers', '#terms', 'transport', 'temp', 'price', 'payTerms', 'delivery', '#contacts', 'company', 'contactPerson*', 'phone*', 'email', 'photos'], note: 'marketNoGuarantee' },
  helpBuyer: base('request', 'desc*', 'country', 'phone*'),
  addCompany: base('request', 'company*', 'country*', 'city*', 'address', 'sphere', 'buy', 'site', 'source', 'comment', 'photos', ...P),
  becomeRepresentative: base('specialist', 'name*', 'country*', 'region', 'city*', 'languages', 'exp*', 'categories', 'countries', 'help', 'email', ...P),
  commercialOffer: base('request', 'buyer*', 'product*', 'volumes', 'price', 'terms', 'delivery', 'desc', 'photos', ...P),
  routeCalc: base('request', 'from*', 'to*', 'cargo*', 'volumes*', 'transport', 'temp', ...P),
  shareStory: base('suggestion', 'title*', 'desc*', 'phone'),
  // Ярмарки
  tradeProducer: { kind: 'request', fields: ['#where', 'location*', 'activity*', 'productKind*', '#ifUa', 'exportDocs', 'exportExp', 'exportCountries', '#ifAbroad', 'country', 'region', 'city', 'hasStore', 'sellsUa', '#contacts', 'name*', 'phone*', 'email', 'site', 'photos'], note: 'tradeNoGuarantee' },
  organizerSelf: base('request', ...ORG),
  organizerMember: base('request', ...ORG),
  organizerVenue: base('request', ...ORG),
};

export const parseField = (spec: string): { key: string; required: boolean; heading: boolean } => {
  const heading = spec.charAt(0) === '#';
  const required = spec.charAt(spec.length - 1) === '*';
  return { key: spec.replace(/^#|\*$/g, ''), required, heading };
};

/** Статуси заявок (project_suggestions.status) */
export const REQUEST_STATUSES = ['new', 'review', 'offers', 'clarify', 'done', 'rejected', 'closed'] as const;
