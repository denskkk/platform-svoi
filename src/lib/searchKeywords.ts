/**
 * Система пошуку з синонімами та пов'язаними термінами
 * Дозволяє знаходити послуги не тільки за прямим збігом, але й за спорідненими категоріями.
 * Дані (синоніми та ключові слова) — це не UI-текст: вони використовуються для пошуку
 * по українських назвах у БД, тому українські рядки не локалізуються.
 * Англійські запити підтримуються через EN_SEARCH_SYNONYMS / CATEGORY_KEYWORDS_EN.
 */

// Мапа синонімів та пов'язаних термінів
export const SEARCH_SYNONYMS: Record<string, string[]> = {
  // Будівництво і ремонт
  'сантехнік': ['прораб', 'будівельник', 'ремонт', 'майстер', 'монтаж', 'труби', 'каналізація', 'водопровід', 'опалення', 'спеціаліст', 'фахівець'], // i18n-ignore
  'електрик': ['прораб', 'будівельник', 'електромонтаж', 'проводка', 'ремонт', 'освітлення', 'майстер', 'спеціаліст', 'фахівець'], // i18n-ignore
  'прораб': ['будівельник', 'ремонт', 'будівництво', 'майстер', 'сантехнік', 'електрик', 'оздоблення', 'спеціаліст', 'відновлення'], // i18n-ignore
  'будівельник': ['прораб', 'ремонт', 'будівництво', 'майстер', 'сантехнік', 'електрик', 'цегла', 'бетон', 'спеціаліст'], // i18n-ignore
  'оздоблення': ['ремонт', 'прораб', 'майстер', 'будівництво', 'шпалери', 'фарба', 'плитка'], // i18n-ignore
  
  // Авто
  'автомеханік': ['сто', 'ремонт авто', 'діагностика', 'техобслуговування', 'автосервіс', 'механік'], // i18n-ignore
  'сто': ['автомеханік', 'ремонт авто', 'діагностика', 'автосервіс', 'шиномонтаж'], // i18n-ignore
  'шиномонтаж': ['сто', 'автосервіс', 'колеса', 'шини', 'балансування'], // i18n-ignore
  
  // Краса
  'перукар': ['стиліст', 'салон краси', 'зачіска', 'стрижка', 'барбер', 'краса'], // i18n-ignore
  'манікюр': ['нігті', 'педикюр', 'салон краси', 'краса', 'майстер манікюру'], // i18n-ignore
  'барбер': ['перукар', 'стиліст', 'стрижка', 'борода', 'чоловіча стрижка'], // i18n-ignore
  'косметолог': ['салон краси', 'краса', 'догляд за шкірою', 'косметологія'], // i18n-ignore
  
  // Здоров'я
  'масаж': ['масажист', 'спа', 'релакс', 'оздоровлення', 'терапія'], // i18n-ignore
  'лікар': ['медицина', 'консультація', 'діагностика', 'здоров\'я', 'клініка'], // i18n-ignore
  'стоматолог': ['зуби', 'стоматологія', 'лікування', 'протезування'], // i18n-ignore
  
  // Освіта
  'репетитор': ['навчання', 'освіта', 'викладач', 'уроки', 'курси', 'вчитель'], // i18n-ignore
  'вчитель': ['репетитор', 'освіта', 'навчання', 'викладач', 'педагог'], // i18n-ignore
  'курси': ['навчання', 'освіта', 'тренінг', 'репетитор', 'викладач'], // i18n-ignore
  
  // IT
  'програміст': ['розробник', 'веб', 'сайт', 'додаток', 'it', 'код', 'софт'], // i18n-ignore
  'веб': ['сайт', 'програміст', 'розробник', 'дизайн', 'it', 'інтернет'], // i18n-ignore
  'дизайнер': ['веб', 'графіка', 'логотип', 'брендинг', 'креатив', 'макет'], // i18n-ignore
  
  // Юридичні
  'юрист': ['адвокат', 'право', 'консультація', 'договір', 'суд', 'юридичні'], // i18n-ignore
  'бухгалтер': ['бухгалтерія', 'податки', 'звітність', 'фінанси', 'облік'], // i18n-ignore
  
  // Побутові послуги
  'прибирання': ['клінінг', 'чистка', 'прибирач', 'чисто', 'порядок', 'миття', 'прибиральниця'], // i18n-ignore
  'клінінг': ['прибирання', 'чистка', 'миття', 'прибиральниця', 'порядок'], // i18n-ignore
  'кур\'єр': ['доставка', 'перевезення', 'логістика', 'транспорт', 'посилка'], // i18n-ignore
  'доставка': ['кур\'єр', 'перевезення', 'логістика', 'транспорт', 'посилка'], // i18n-ignore
  'вантажники': ['переїзд', 'вантаж', 'перевезення', 'транспорт', 'піднімання', 'переноска'], // i18n-ignore
  'переїзд': ['вантажники', 'перевезення', 'транспорт', 'пакування', 'піднімання'], // i18n-ignore
  
  // Тварини
  'ветеринар': ['ветклініка', 'тварини', 'лікування', 'собаки', 'коти', 'здоров\'я тварин', 'вет'], // i18n-ignore
  'грумер': ['стрижка тварин', 'собаки', 'коти', 'догляд', 'тварини', 'грумінг'], // i18n-ignore
  
  // Фото/відео
  'фотограф': ['фотозйомка', 'фото', 'весілля', 'портрет', 'студія', 'камера', 'фотосесія'], // i18n-ignore
  'відеограф': ['відео', 'відеозйомка', 'монтаж', 'весілля', 'зйомка', 'відеооператор'], // i18n-ignore
  
  // Їжа
  'кухар': ['кейтеринг', 'приготування', 'їжа', 'банкет', 'готування', 'меню', 'шеф'], // i18n-ignore
  'кондитер': ['торти', 'випічка', 'солодощі', 'десерт', 'кейк', 'тістечка'], // i18n-ignore
  
  // Додаткові загальні терміни
  'послуга': ['сервіс', 'майстер', 'виконавець', 'спеціаліст', 'робота'], // i18n-ignore
  'майстер': ['спеціаліст', 'виконавець', 'професіонал', 'фахівець', 'експерт'], // i18n-ignore
  'ремонт': ['відновлення', 'налагодження', 'полагодження', 'майстер', 'сервіс'], // i18n-ignore
}

// Англійські запити -> англійські та українські терміни (дані в БД переважно українською)
export const EN_SEARCH_SYNONYMS: Record<string, string[]> = {
  // Construction & repair
  'plumber': ['plumbing', 'pipes', 'sanitary', 'сантехнік', 'труби', 'водопровід', 'каналізація', 'опалення'], // i18n-ignore
  'plumbing': ['plumber', 'pipes', 'сантехнік', 'труби', 'водопровід', 'каналізація'], // i18n-ignore
  'electrician': ['electrical', 'wiring', 'електрик', 'електромонтаж', 'проводка', 'освітлення'], // i18n-ignore
  'electrical': ['electrician', 'wiring', 'електрик', 'електромонтаж', 'проводка'], // i18n-ignore
  'builder': ['contractor', 'construction', 'foreman', 'будівельник', 'прораб', 'будівництво', 'ремонт'], // i18n-ignore
  'contractor': ['builder', 'construction', 'foreman', 'прораб', 'будівельник', 'будівництво'], // i18n-ignore
  'construction': ['builder', 'contractor', 'будівництво', 'будівельник', 'прораб', 'ремонт'], // i18n-ignore
  'renovation': ['repair', 'finishing', 'remodeling', 'ремонт', 'оздоблення', 'відновлення'], // i18n-ignore
  'finishing': ['renovation', 'tiles', 'paint', 'оздоблення', 'плитка', 'шпалери', 'фарба'], // i18n-ignore
  'tiler': ['tiles', 'tiling', 'плитка', 'оздоблення'], // i18n-ignore
  'handyman': ['repair', 'master', 'odd jobs', 'майстер', 'ремонт', 'спеціаліст'], // i18n-ignore
  'repair': ['fix', 'handyman', 'service', 'ремонт', 'відновлення', 'полагодження', 'майстер', 'сервіс'], // i18n-ignore
  'welder': ['welding', 'metalwork', 'зварювальник', 'зварювання'], // i18n-ignore
  'carpenter': ['joiner', 'woodwork', 'furniture', 'столяр', 'меблі'], // i18n-ignore
  'roofer': ['roofing', 'roof', 'покрівля', 'дах'], // i18n-ignore
  'painter': ['painting', 'paint', 'маляр', 'фарба', 'фарбування'], // i18n-ignore
  'locksmith': ['lock', 'keys', 'слюсар', 'замки'], // i18n-ignore
  'appliance repair': ['repair', 'washing machine', 'fridge', 'ремонт техніки', 'ремонт', 'побутова техніка'], // i18n-ignore

  // Auto
  'car repair': ['auto repair', 'car service', 'mechanic', 'ремонт авто', 'автосервіс', 'автомеханік', 'сто'], // i18n-ignore
  'auto repair': ['car repair', 'car service', 'mechanic', 'ремонт авто', 'автосервіс', 'автомеханік', 'сто'], // i18n-ignore
  'car service': ['car repair', 'auto service', 'mechanic', 'автосервіс', 'сто', 'ремонт авто'], // i18n-ignore
  'auto service': ['car service', 'car repair', 'автосервіс', 'сто', 'ремонт авто'], // i18n-ignore
  'mechanic': ['car repair', 'auto mechanic', 'автомеханік', 'механік', 'автосервіс', 'сто'], // i18n-ignore
  'car wash': ['washing', 'detailing', 'мийка', 'автомийка', 'полірування'], // i18n-ignore
  'tire': ['tyre', 'wheels', 'tire fitting', 'шиномонтаж', 'шини', 'колеса', 'балансування'], // i18n-ignore
  'tyre': ['tire', 'wheels', 'шиномонтаж', 'шини', 'колеса'], // i18n-ignore
  'tire fitting': ['tire', 'tyre', 'wheels', 'шиномонтаж', 'шини', 'колеса'], // i18n-ignore
  'car': ['auto', 'vehicle', 'авто', 'машина', 'автосервіс'], // i18n-ignore
  'towing': ['tow truck', 'evacuator', 'евакуатор', 'буксирування'], // i18n-ignore

  // Beauty
  'hairdresser': ['hair stylist', 'barber', 'haircut', 'stylist', 'перукар', 'стиліст', 'стрижка', 'зачіска', 'салон краси'], // i18n-ignore
  'hair stylist': ['hairdresser', 'stylist', 'haircut', 'перукар', 'стиліст', 'стрижка'], // i18n-ignore
  'haircut': ['hairdresser', 'barber', 'стрижка', 'перукар', 'барбер'], // i18n-ignore
  'barber': ['barbershop', 'haircut', 'beard', 'барбер', 'перукар', 'стрижка', 'борода'], // i18n-ignore
  'manicure': ['nails', 'nail technician', 'pedicure', 'манікюр', 'нігті', 'педикюр', 'майстер манікюру'], // i18n-ignore
  'pedicure': ['manicure', 'nails', 'педикюр', 'манікюр', 'нігті'], // i18n-ignore
  'nails': ['manicure', 'pedicure', 'нігті', 'манікюр', 'педикюр'], // i18n-ignore
  'cosmetologist': ['beautician', 'skincare', 'косметолог', 'косметологія', 'догляд за шкірою', 'салон краси'], // i18n-ignore
  'beautician': ['cosmetologist', 'beauty salon', 'косметолог', 'салон краси', 'краса'], // i18n-ignore
  'beauty': ['beauty salon', 'salon', 'краса', 'салон краси'], // i18n-ignore
  'makeup': ['make-up', 'visagiste', 'візажист', 'макіяж', 'краса'], // i18n-ignore
  'lashes': ['eyelashes', 'brows', 'вії', 'брови', 'краса'], // i18n-ignore

  // Health
  'massage': ['masseur', 'masseuse', 'spa', 'relax', 'масаж', 'масажист', 'спа', 'релакс'], // i18n-ignore
  'masseur': ['massage', 'масажист', 'масаж'], // i18n-ignore
  'doctor': ['physician', 'medical', 'clinic', 'лікар', 'медицина', 'клініка', 'консультація'], // i18n-ignore
  'dentist': ['dental', 'teeth', 'стоматолог', 'стоматологія', 'зуби', 'лікування'], // i18n-ignore
  'dental': ['dentist', 'teeth', 'стоматолог', 'стоматологія', 'зуби'], // i18n-ignore
  'psychologist': ['therapist', 'counselor', 'психолог', 'консультація'], // i18n-ignore
  'therapist': ['therapy', 'psychologist', 'терапія', 'психолог'], // i18n-ignore
  'nurse': ['nursing', 'medical', 'медсестра', 'медицина'], // i18n-ignore

  // Education
  'tutor': ['teacher', 'lessons', 'tutoring', 'репетитор', 'вчитель', 'викладач', 'уроки', 'навчання'], // i18n-ignore
  'tutoring': ['tutor', 'lessons', 'репетитор', 'уроки', 'навчання'], // i18n-ignore
  'teacher': ['tutor', 'lecturer', 'вчитель', 'репетитор', 'викладач', 'педагог'], // i18n-ignore
  'lessons': ['tutor', 'teacher', 'courses', 'уроки', 'репетитор', 'курси', 'навчання'], // i18n-ignore
  'courses': ['course', 'training', 'education', 'курси', 'навчання', 'освіта', 'тренінг'], // i18n-ignore
  'course': ['courses', 'training', 'курси', 'навчання', 'тренінг'], // i18n-ignore
  'training': ['courses', 'coaching', 'тренінг', 'навчання', 'курси'], // i18n-ignore
  'education': ['learning', 'courses', 'освіта', 'навчання', 'курси'], // i18n-ignore
  'language lessons': ['tutor', 'english', 'foreign language', 'іноземна мова', 'репетитор', 'уроки', 'курси'], // i18n-ignore
  'english lessons': ['tutor', 'language lessons', 'англійська', 'репетитор', 'уроки'], // i18n-ignore

  // IT
  'programmer': ['developer', 'coder', 'software engineer', 'програміст', 'розробник', 'код', 'it'], // i18n-ignore
  'developer': ['programmer', 'web developer', 'розробник', 'програміст', 'розробка', 'it'], // i18n-ignore
  'web developer': ['developer', 'website', 'веб', 'сайт', 'розробник', 'програміст'], // i18n-ignore
  'website': ['web', 'site', 'web development', 'сайт', 'веб', 'розробка', 'програміст'], // i18n-ignore
  'web design': ['website', 'designer', 'веб', 'дизайн', 'сайт', 'дизайнер'], // i18n-ignore
  'designer': ['graphic design', 'logo', 'branding', 'дизайнер', 'дизайн', 'графіка', 'логотип', 'брендинг'], // i18n-ignore
  'design': ['designer', 'graphic design', 'дизайн', 'дизайнер', 'графіка'], // i18n-ignore
  'software': ['app', 'programming', 'софт', 'додаток', 'програміст'], // i18n-ignore
  'mobile app': ['app development', 'developer', 'додаток', 'розробник', 'програміст'], // i18n-ignore
  'seo': ['marketing', 'promotion', 'website', 'маркетинг', 'просування', 'сайт'], // i18n-ignore
  'computer repair': ['pc repair', 'laptop', 'ремонт комп\'ютерів', 'комп\'ютер', 'ремонт'], // i18n-ignore

  // Business & legal
  'lawyer': ['attorney', 'legal', 'law', 'юрист', 'адвокат', 'право', 'юридичні', 'консультація'], // i18n-ignore
  'attorney': ['lawyer', 'legal', 'адвокат', 'юрист', 'право'], // i18n-ignore
  'legal': ['lawyer', 'law', 'юридичні', 'юрист', 'право', 'договір'], // i18n-ignore
  'notary': ['notarial', 'нотаріус'], // i18n-ignore
  'accountant': ['accounting', 'bookkeeper', 'tax', 'бухгалтер', 'бухгалтерія', 'податки', 'звітність', 'облік'], // i18n-ignore
  'accounting': ['accountant', 'bookkeeping', 'бухгалтерія', 'бухгалтер', 'облік'], // i18n-ignore
  'bookkeeper': ['accountant', 'accounting', 'бухгалтер', 'облік'], // i18n-ignore
  'tax': ['accountant', 'taxes', 'податки', 'бухгалтер', 'звітність'], // i18n-ignore
  'consultant': ['consulting', 'advisor', 'консультант', 'консультація', 'консалтинг'], // i18n-ignore
  'consulting': ['consultant', 'advisor', 'консалтинг', 'консультант', 'консультація'], // i18n-ignore
  'marketing': ['advertising', 'smm', 'promotion', 'маркетинг', 'реклама', 'смм'], // i18n-ignore
  'advertising': ['marketing', 'ads', 'реклама', 'маркетинг'], // i18n-ignore
  'smm': ['social media', 'marketing', 'смм', 'маркетинг', 'реклама'], // i18n-ignore
  'translator': ['translation', 'interpreter', 'перекладач', 'переклад'], // i18n-ignore

  // Household services
  'cleaning': ['cleaner', 'maid', 'housekeeping', 'прибирання', 'клінінг', 'чистка', 'прибиральниця', 'миття'], // i18n-ignore
  'cleaner': ['cleaning', 'maid', 'прибирання', 'клінінг', 'прибиральниця', 'прибирач'], // i18n-ignore
  'maid': ['cleaning', 'housekeeping', 'прибиральниця', 'прибирання'], // i18n-ignore
  'housekeeping': ['cleaning', 'maid', 'прибирання', 'прибиральниця'], // i18n-ignore
  'courier': ['delivery', 'parcel', 'кур\'єр', 'доставка', 'посилка', 'перевезення'], // i18n-ignore
  'delivery': ['courier', 'shipping', 'доставка', 'кур\'єр', 'перевезення', 'посилка'], // i18n-ignore
  'movers': ['moving', 'relocation', 'removal', 'вантажники', 'переїзд', 'перевезення', 'вантаж'], // i18n-ignore
  'moving': ['movers', 'relocation', 'переїзд', 'вантажники', 'перевезення', 'пакування'], // i18n-ignore
  'laundry': ['dry cleaning', 'washing', 'пральня', 'хімчистка'], // i18n-ignore
  'dry cleaning': ['laundry', 'хімчистка', 'пральня'], // i18n-ignore

  // Pets
  'vet': ['veterinarian', 'veterinary', 'pets', 'ветеринар', 'ветклініка', 'тварини', 'вет'], // i18n-ignore
  'veterinarian': ['vet', 'veterinary', 'pets', 'ветеринар', 'ветклініка', 'тварини'], // i18n-ignore
  'groomer': ['grooming', 'pets', 'dog', 'грумер', 'грумінг', 'тварини', 'стрижка тварин'], // i18n-ignore
  'grooming': ['groomer', 'pets', 'грумінг', 'грумер', 'тварини'], // i18n-ignore
  'dog': ['pets', 'puppy', 'собаки', 'тварини'], // i18n-ignore
  'pet': ['pets', 'animals', 'тварини', 'домашні тварини'], // i18n-ignore

  // Photo / video / creative
  'photographer': ['photography', 'photo', 'photoshoot', 'wedding', 'фотограф', 'фотозйомка', 'фото', 'фотосесія', 'весілля'], // i18n-ignore
  'photography': ['photographer', 'photo', 'фотограф', 'фотозйомка', 'фото'], // i18n-ignore
  'photo': ['photographer', 'photoshoot', 'фото', 'фотограф', 'фотозйомка'], // i18n-ignore
  'videographer': ['video', 'filming', 'videography', 'відеограф', 'відео', 'відеозйомка', 'відеооператор'], // i18n-ignore
  'video': ['videographer', 'filming', 'відео', 'відеограф', 'відеозйомка'], // i18n-ignore
  'wedding': ['photographer', 'videographer', 'весілля', 'фотограф', 'відеограф'], // i18n-ignore
  'artist': ['painter', 'creative', 'художник', 'креатив'], // i18n-ignore
  'musician': ['music', 'band', 'музикант', 'музика'], // i18n-ignore

  // Food
  'chef': ['cook', 'catering', 'кухар', 'шеф', 'кейтеринг', 'приготування'], // i18n-ignore
  'cook': ['chef', 'catering', 'кухар', 'кейтеринг', 'приготування'], // i18n-ignore
  'catering': ['chef', 'banquet', 'кейтеринг', 'кухар', 'банкет'], // i18n-ignore
  'baker': ['pastry', 'cakes', 'confectioner', 'кондитер', 'торти', 'випічка'], // i18n-ignore
  'confectioner': ['baker', 'cakes', 'кондитер', 'торти', 'солодощі'], // i18n-ignore
  'cakes': ['baker', 'confectioner', 'dessert', 'торти', 'кондитер', 'десерт'], // i18n-ignore

  // Generic
  'master':  ['specialist', 'professional', 'expert', 'майстер', 'спеціаліст', 'професіонал', 'експерт'], // i18n-ignore
  'specialist': ['master', 'professional', 'expert', 'спеціаліст', 'фахівець', 'професіонал'], // i18n-ignore
}

// Категорії з ключовими словами
export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'remont': ['ремонт', 'будівництво', 'прораб', 'майстер', 'сантехнік', 'електрик', 'оздоблення', 'плитка', 'шпалери', 'фарба'], // i18n-ignore
  'auto': ['авто', 'машина', 'сто', 'механік', 'діагностика', 'шиномонтаж', 'мийка', 'полірування'], // i18n-ignore
  'krasa': ['краса', 'перукар', 'манікюр', 'педикюр', 'косметолог', 'барбер', 'стиліст', 'салон'], // i18n-ignore
  'medytsyna': ['здоров\'я', 'лікар', 'медицина', 'масаж', 'терапія', 'стоматолог', 'клініка'], // i18n-ignore
  'osvita': ['освіта', 'навчання', 'репетитор', 'курси', 'вчитель', 'викладач', 'тренінг'], // i18n-ignore
  'it': ['програміст', 'сайт', 'веб', 'розробка', 'дизайн', 'it', 'комп\'ютер', 'софт'], // i18n-ignore
  'biznes': ['юрист', 'бухгалтер', 'консультант', 'аудит', 'маркетинг', 'реклама', 'смм'], // i18n-ignore
  'pobut': ['прибирання', 'клінінг', 'кур\'єр', 'доставка', 'вантажники', 'переїзд', 'побут'], // i18n-ignore
  'tvorchist': ['фото', 'відео', 'дизайн', 'художник', 'креатив', 'декор', 'handmade'], // i18n-ignore
}

// Англійські ключові слова для тих самих slug-ів категорій
export const CATEGORY_KEYWORDS_EN: Record<string, string[]> = {
  'remont': [
    'repair', 'repairs', 'renovation', 'construction', 'builder', 'contractor', 'foreman', 'handyman',
    'plumber', 'plumbing', 'electrician', 'electrical', 'wiring', 'finishing', 'tiles', 'tiler', 'tiling',
    'wallpaper', 'painter', 'welder', 'carpenter', 'roofer', 'locksmith', 'appliance repair', 'furniture repair',
    'computer repair', 'phone repair',
  ],
  'auto': [
    'auto', 'car', 'cars', 'car repair', 'auto repair', 'car service', 'auto service', 'autoservice', 'mechanic',
    'car mechanic', 'car wash', 'tire', 'tyre', 'tire fitting', 'wheels', 'vehicle', 'car diagnostics',
    'polishing', 'detailing', 'towing', 'tow truck',
  ],
  'krasa': [
    'beauty', 'hairdresser', 'hair stylist', 'hair salon', 'hairstyle', 'haircut', 'barber', 'barbershop',
    'manicure', 'pedicure', 'nails', 'nail technician', 'cosmetologist', 'beautician', 'makeup', 'make-up',
    'salon', 'beauty salon', 'stylist', 'lashes', 'eyelashes', 'brows', 'eyebrows', 'skincare',
  ],
  'medytsyna': [
    'health', 'doctor', 'medical', 'medicine', 'massage', 'masseur', 'therapy', 'therapist', 'dentist', 'dental',
    'clinic', 'physician', 'nurse', 'psychologist', 'healthcare',
  ],
  'osvita': [
    'education', 'tutor', 'tutoring', 'teacher', 'course', 'courses', 'lesson', 'lessons', 'training', 'lecturer',
    'school', 'language lessons', 'english lessons', 'coaching',
  ],
  'it': [
    'it', 'programmer', 'developer', 'web', 'website', 'web development', 'web design', 'web developer', 'designer',
    'design', 'graphic design', 'logo', 'software', 'app development', 'mobile app', 'computer', 'coding',
    'programming', 'seo',
  ],
  'biznes': [
    'lawyer', 'attorney', 'legal', 'law', 'notary', 'accountant', 'accounting', 'bookkeeper', 'bookkeeping', 'tax',
    'consultant', 'consulting', 'audit', 'marketing', 'advertising', 'smm', 'translator', 'business',
  ],
  'pobut': [
    'cleaning', 'cleaner', 'maid', 'housekeeping', 'courier', 'delivery', 'movers', 'moving', 'relocation',
    'removal', 'laundry', 'dry cleaning', 'household',
  ],
  'tvorchist': [
    'photographer', 'photography', 'photo', 'photoshoot', 'video', 'videographer', 'videography', 'artist',
    'creative', 'decor', 'handmade', 'musician', 'wedding photographer',
  ],
}

const CYRILLIC_RE = /[\u0400-\u04FF]/
const LATIN_RE = /[a-z]/

const tokenize = (lowerQuery: string): string[] => lowerQuery.split(/[^a-z0-9'-]+/).filter(Boolean)

// Простий англійський стемінг: множина та прикінцеве "s"
const singular = (word: string): string => (word.length > 3 && word.endsWith('s') ? word.slice(0, -1) : word)

/**
 * Збіг англійського ключового слова із запитом: фраза — за входженням у запит,
 * слово — за точним збігом (з урахуванням множини) або за префіксом від 5 літер ("plumb" -> "plumber").
 */
function matchesEnglishKey(key: string, lowerQuery: string, tokens: string[]): boolean {
  if (key.includes(' ')) return lowerQuery.includes(key)
  return tokens.some((token) => {
    const base = singular(token)
    return token === key || base === key || singular(key) === base || (token.length >= 5 && key.startsWith(token))
  })
}

/**
 * Розширити пошуковий запит синонімами та спорідненими термінами
 */
export function expandSearchQuery(query: string): string[] {
  const lowerQuery = query.toLowerCase().trim()
  const expanded = new Set<string>([lowerQuery])
  
  // Додаємо пряме слово
  const words = lowerQuery.split(/\s+/)
  words.forEach(word => expanded.add(word))
  
  // Шукаємо синоніми для кожного слова
  words.forEach(word => {
    Object.entries(SEARCH_SYNONYMS).forEach(([key, synonyms]) => {
      if (key.includes(word) || word.includes(key)) {
        synonyms.forEach(syn => expanded.add(syn))
        expanded.add(key)
      }
    })
  })

  // Англійські запити: додаємо англійські та українські терміни для пошуку по українських даних
  if (LATIN_RE.test(lowerQuery)) {
    const tokens = tokenize(lowerQuery)
    Object.entries(EN_SEARCH_SYNONYMS).forEach(([key, synonyms]) => {
      if (matchesEnglishKey(key, lowerQuery, tokens)) {
        synonyms.forEach(syn => expanded.add(syn))
        expanded.add(key)
      }
    })
  }
  
  return Array.from(expanded)
}

/**
 * Отримати slug категорії за ключовими словами
 */
export function detectCategoryFromQuery(query: string): string | null {
  const lowerQuery = query.toLowerCase()

  // Англійський запит: перемагає найдовше (найконкретніше) ключове слово, напр. "car repair" -> auto, а не remont
  if (LATIN_RE.test(lowerQuery) && !CYRILLIC_RE.test(lowerQuery)) {
    const tokens = tokenize(lowerQuery)
    let best: { slug: string; length: number } | null = null
    for (const [categorySlug, keywords] of Object.entries(CATEGORY_KEYWORDS_EN)) {
      for (const keyword of keywords) {
        if (matchesEnglishKey(keyword, lowerQuery, tokens) && (!best || keyword.length > best.length)) {
          best = { slug: categorySlug, length: keyword.length }
        }
      }
    }
    if (best) return best.slug
  }
  
  for (const [categorySlug, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (keyword.length <= 2 ? tokenize(lowerQuery).includes(keyword) : lowerQuery.includes(keyword)) {
        return categorySlug
      }
    }
  }
  
  return null
}

/**
 * Перевірити чи запит релевантний для послуги/користувача
 */
export function calculateRelevance(query: string, text: string): number {
  const expandedTerms = expandSearchQuery(query)
  const lowerText = text.toLowerCase()
  
  let score = 0
  expandedTerms.forEach(term => {
    if (lowerText.includes(term)) {
      // Пряме входження оригінального запиту дає більше балів
      score += term === query.toLowerCase() ? 3 : 1
    }
  })
  
  return score
}
