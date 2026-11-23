/**
 * Визначення нативної оболонки (Capacitor) і її покоління. Покоління приходить у User-Agent: «SviyApp/<n>»
 * (див. capacitor.config.ts). Старі збірки магазину маркера не мають — для них рівень 0.
 */
export type NativePlatform = 'ios' | 'android' | 'web';

export function nativePlatform(): NativePlatform {
  try {
    const p = (window as any).Capacitor?.getPlatform?.();
    return p === 'ios' || p === 'android' ? p : 'web';
  } catch { return 'web'; }
}

export function shellLevel(): number {
  try { return Number(/SviyApp\/(\d+)/.exec(navigator.userAgent)?.[1] || 0); } catch { return 0; }
}

/** Мінімальне покоління оболонки, у якому камера/мікрофон/галерея мають описи дозволів і працюють без вильоту. */
export const MIN_SHELL_FOR_CAMERA = 2;

/** true — це старий застосунок із магазину без дозволів камери: системні кнопки «зняти камерою» там вбивають застосунок. */
export function shellOutdated(): boolean {
  return nativePlatform() !== 'web' && shellLevel() < MIN_SHELL_FOR_CAMERA;
}

/** iPhone: iOS відкриває налаштування застосунку за схемою app-settings:. На Android безпечного способу без плагіна немає — лише інструкція. */
export function openAppSettings(): void {
  try { window.location.href = 'app-settings:'; } catch { /* ignore */ }
}
