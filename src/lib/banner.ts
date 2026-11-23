/** Градієнт-заглушка для банера, коли у компанії ще немає власного зображення. Стабільний для кожного id. */
const PALETTES: [string, string][] = [
  ['#2563eb', '#7c3aed'], ['#0ea5e9', '#10b981'], ['#f59e0b', '#ef4444'],
  ['#14b8a6', '#3b82f6'], ['#8b5cf6', '#ec4899'], ['#16a34a', '#0ea5e9'],
];

export function bannerFallbackStyle(id: number): { backgroundImage: string } {
  const [a, b] = PALETTES[Math.abs(Number(id) || 0) % PALETTES.length];
  return { backgroundImage: `linear-gradient(135deg, ${a}, ${b})` };
}
