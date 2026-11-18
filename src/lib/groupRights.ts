/** Спільноти й групові чати створюють лише бізнес-акаунти (тренери, лікарі, керівники напрямків) та адміністратори. Для клієнтського коду — без залежностей. */
export function canCreateGroups(user: { accountType?: string | null; role?: string | null }): boolean {
  return user.accountType === 'business' || user.role === 'business' || user.role === 'admin';
}
