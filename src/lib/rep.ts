/** Представництва: рівні дерева, види заявок та допоміжні функції (спільні для сервера й клієнта, без залежностей). */
export const REP_LEVELS = ['country', 'region', 'district', 'community'] as const;
export type RepLevel = (typeof REP_LEVELS)[number];
export const REP_KINDS = ['lawyer', 'join', 'open', 'consult'] as const;
export type RepKind = (typeof REP_KINDS)[number];
export const REP_MODES = ['online', 'offline', 'both'] as const;

/** Який рівень лежить під даним (null — глибше нічого немає). parent = null → країни. */
export function childLevel(level: RepLevel | null): RepLevel | null {
  if (!level) return 'country';
  const i = REP_LEVELS.indexOf(level);
  return i >= 0 && i < REP_LEVELS.length - 1 ? REP_LEVELS[i + 1] : null;
}

export interface RepPerson { id: number; name: string; avatarUrl: string | null }

export function personOf(u: { id: number; firstName: string; lastName: string; avatarUrl: string | null } | null | undefined): RepPerson | null {
  return u ? { id: u.id, name: `${u.firstName} ${u.lastName}`.trim(), avatarUrl: u.avatarUrl } : null;
}
