/**
 * «Папки» всередині проєкту: людина заходить у проєкт і йде по папках (лікарі → кардіологи, купити / орендувати / шукаю тощо).
 * Папка = готовий набір фільтрів каталогу (ключі фільтрів `f_<поле>` з listingFields.ts). Нові папки додаються тут, без нових таблиць.
 */
export interface ProjectFolder {
  key: string;
  icon: string;
  /** Ключ перекладу назви папки */
  labelKey: string;
  filters: Record<string, string>;
  children?: ProjectFolder[];
}

const opt = (field: string, value: string, icon: string, filters?: Record<string, string>, children?: ProjectFolder[]): ProjectFolder => ({
  key: value, icon, labelKey: `listings.options.${field}.${value}`, filters: filters ?? { [`f_${field}`]: value }, children,
});
const own = (slug: string, key: string, icon: string, filters: Record<string, string>): ProjectFolder => ({
  key, icon, labelKey: `cabinet.folders.${slug}.${key}`, filters,
});

export const PROJECT_FOLDERS: Record<string, ProjectFolder[]> = {
  cars: [
    own('cars', 'all', '🚗', {}),
    own('cars', 'dealers', '🏢', { f_sellerType: 'dealer' }),
    own('cars', 'private', '🤝', { f_sellerType: 'private' }),
    own('cars', 'wanted', '🔎', { f_adKind: 'request' }),
  ],
  'real-estate': [
    own('real-estate', 'buy', '🏠', { f_dealType: 'sale' }),
    own('real-estate', 'rent', '🔑', { f_dealType: 'rent' }),
    opt('propertyType', 'apartment', '🏢'),
    opt('propertyType', 'house', '🏡'),
    opt('propertyType', 'commercial', '🏬'),
    opt('propertyType', 'land', '🌳'),
    own('real-estate', 'wanted', '🔎', { f_adKind: 'request' }),
  ],
  health: [
    opt('healthKind', 'doctor', '🩺', undefined, [
      own('health', 'allDoctors', '🩺', { f_healthKind: 'doctor' }),
      opt('medSpecialty', 'gynecologist', '👩‍⚕️', { f_healthKind: 'doctor', f_medSpecialty: 'gynecologist' }),
      opt('medSpecialty', 'cardiologist', '❤️', { f_healthKind: 'doctor', f_medSpecialty: 'cardiologist' }),
      opt('medSpecialty', 'dentist', '🦷', { f_healthKind: 'doctor', f_medSpecialty: 'dentist' }),
      opt('medSpecialty', 'therapist', '🧑‍⚕️', { f_healthKind: 'doctor', f_medSpecialty: 'therapist' }),
      opt('medSpecialty', 'surgeon', '🔪', { f_healthKind: 'doctor', f_medSpecialty: 'surgeon' }),
      opt('medSpecialty', 'other_med', '➕', { f_healthKind: 'doctor', f_medSpecialty: 'other_med' }),
    ]),
    opt('healthKind', 'clinic', '🏥'),
    opt('healthKind', 'medical_center', '🏨'),
    opt('healthKind', 'online', '💻'),
    opt('healthKind', 'dietitian', '🥗'),
    opt('healthKind', 'nutrition', '🍎'),
    opt('healthKind', 'rehab', '🦽'),
    own('health', 'wanted', '🔎', { f_adKind: 'request' }),
  ],
  sport: [
    opt('sportKind', 'fitness', '🏋️'),
    opt('sportKind', 'dance', '💃'),
    opt('sportKind', 'martial_arts', '🥋'),
    opt('sportKind', 'yoga', '🧘'),
    opt('sportKind', 'swimming', '🏊'),
    opt('sportKind', 'team_sports', '⚽'),
    opt('sportKind', 'personal', '🎯'),
    opt('sportKind', 'online_training', '💻'),
    own('sport', 'wanted', '🔎', { f_adKind: 'request' }),
  ],
};

export function foldersFor(slug: string): ProjectFolder[] {
  return PROJECT_FOLDERS[slug] ?? [];
}

/** Знаходить папку за шляхом `a` або `a.b` (батьківська.дочірня). */
export function findFolder(slug: string, path: string | null): { folder: ProjectFolder; parent?: ProjectFolder } | null {
  if (!path) return null;
  const [a, b] = path.split('.');
  const top = foldersFor(slug).find((f) => f.key === a);
  if (!top) return null;
  if (!b) return { folder: top };
  const child = top.children?.find((c) => c.key === b);
  return child ? { folder: child, parent: top } : null;
}
