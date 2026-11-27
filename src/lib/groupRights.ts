/** Спільноти (клуби з дошкою оголошень) може створити будь-який зареєстрований користувач, крім глядачів. Для клієнтського коду — без залежностей. */
export function canCreateGroups(user: { accountType?: string | null; role?: string | null }): boolean {
  return !!user && user.accountType !== 'viewer';
}

/** Груповий чат може створити будь-який зареєстрований користувач (крім глядачів без профілю): це звичайна функція месенджера. */
export function canCreateGroupChats(user: { accountType?: string | null; role?: string | null }): boolean {
  return !!user && user.accountType !== 'viewer';
}
