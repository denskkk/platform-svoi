import type { CSSProperties } from 'react';

/** Фон-«шпалери» для кожного проєкту: космічний синій + тематичний візерунок і акцент (жовтий, золото тощо). */
interface Theme { from: string; to: string; glyph: string; accent: string }

const THEMES: Record<string, Theme> = {
  taxi: { from: '#f5b800', to: '#1c1c1c', glyph: '🚕', accent: '#ffd21f' },
  cars: { from: '#0b2a6b', to: '#1e4fa8', glyph: '🚗', accent: '#ffca00' },
  'real-estate': { from: '#0a3d62', to: '#12705f', glyph: '🏠', accent: '#ffca00' },
  health: { from: '#0a2a5e', to: '#1b6fb3', glyph: '🩺', accent: '#7ee0ff' },
  sport: { from: '#10204a', to: '#c2410c', glyph: '🏋️', accent: '#ffca00' },
  shops: { from: '#1b1a5e', to: '#6d28d9', glyph: '🛍️', accent: '#ffca00' },
  events: { from: '#0a1f44', to: '#9d174d', glyph: '🎟️', accent: '#ffca00' },
  clubs: { from: '#0a2a5e', to: '#0e7490', glyph: '🤝', accent: '#ffca00' },
  trade: { from: '#0a1f44', to: '#3730a3', glyph: '🌍', accent: '#ffca00' },
  china: { from: '#7f1d1d', to: '#0a1f44', glyph: '📦', accent: '#ffca00' },
  services: { from: '#0a2a5e', to: '#15803d', glyph: '🛠️', accent: '#ffca00' },
  jobs: { from: '#0a1f44', to: '#a16207', glyph: '💼', accent: '#ffca00' },
  lawyers: { from: '#0a1f44', to: '#1e3a8a', glyph: '⚖️', accent: '#e8c15a' },
  antiques: { from: '#451a03', to: '#0a1f44', glyph: '🏺', accent: '#ffca00' },
  dating: { from: '#0a1f44', to: '#be185d', glyph: '💞', accent: '#ffca00' },
  mystic: { from: '#1e1b4b', to: '#6d28d9', glyph: '🔮', accent: '#e8c15a' },
  knitting: { from: '#0a1f44', to: '#be123c', glyph: '🧶', accent: '#ffca00' },
  rebuild: { from: '#0a2a5e', to: '#15803d', glyph: '🏗️', accent: '#ffca00' },
  bank: { from: '#0a1f44', to: '#1e3a8a', glyph: '🏦', accent: '#ffca00' },
  cooperatives: { from: '#0a2a5e', to: '#0f766e', glyph: '🤲', accent: '#ffca00' },
  grants: { from: '#0a1f44', to: '#a16207', glyph: '🎓', accent: '#ffca00' },
  turnkey: { from: '#0a1f44', to: '#0a3d62', glyph: '🔑', accent: '#ffca00' },
  'consumer-platform': { from: '#0a1f44', to: '#334155', glyph: '🧾', accent: '#ffca00' },
  apps: { from: '#0a1f44', to: '#1d4ed8', glyph: '📱', accent: '#7ee0ff' },
  translator: { from: '#0a2a5e', to: '#0e7490', glyph: '🌐', accent: '#ffca00' },
  invest: { from: '#0a1f44', to: '#166534', glyph: '📈', accent: '#ffca00' },
  travel: { from: '#0a2a5e', to: '#0369a1', glyph: '✈️', accent: '#ffca00' },
  pets: { from: '#0a1f44', to: '#b45309', glyph: '🐾', accent: '#ffca00' },
  other: { from: '#0a1f44', to: '#334155', glyph: '✨', accent: '#ffca00' },
};
const DEFAULT: Theme = { from: '#0a1f44', to: '#1f4fb5', glyph: '✨', accent: '#ffca00' };

export function projectTheme(slug: string): Theme {
  return THEMES[slug] ?? DEFAULT;
}

/** SVG-візерунок з емодзі (прозорий), підставляється як CSS-фон без жодних файлів. */
function pattern(glyph: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><text x='12' y='52' font-size='34' opacity='0.16'>${glyph}</text><text x='82' y='112' font-size='26' opacity='0.1'>${glyph}</text></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** Стиль «шпалер» проєкту (градієнт + візерунок). */
export function projectWallpaper(slug: string): CSSProperties {
  const t = projectTheme(slug);
  return {
    backgroundImage: `${pattern(t.glyph)}, radial-gradient(circle at 85% 8%, rgba(255,255,255,0.18), transparent 45%), linear-gradient(160deg, ${t.from}, ${t.to})`,
    backgroundSize: '140px 140px, auto, auto',
  };
}
