/** Міста, де таксі вже працює. Поки порожньо — усі запити стають підпискою на місто. Додайте назви малими літерами, коли запустите місто. */
export const ACTIVE_TAXI_CITIES: string[] = [];

export function isTaxiActiveIn(city: string): boolean {
  const c = city.trim().toLowerCase();
  return !!c && ACTIVE_TAXI_CITIES.includes(c);
}
