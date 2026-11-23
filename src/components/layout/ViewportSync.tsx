'use client';

import { useEffect } from 'react';

/**
 * Клавіатура на телефоні не повинна перекривати поле вводу, підпис і кнопку «Опублікувати».
 * Записуємо в :root розмір ВИДИМОЇ частини екрана: --vvh (висота без клавіатури), --vv-top (зсув) і --kb (висота клавіатури).
 * Повноекранні панелі (студія створення) беруть top/height із цих змінних і тому завжди закінчуються над клавіатурою.
 * Додатково: поле, яке отримало фокус, прокручується до центру видимої області.
 */
export function ViewportSync() {
  useEffect(() => {
    const vv = window.visualViewport;
    const root = document.documentElement;
    let raf = 0;
    const apply = () => {
      raf = 0;
      const h = vv ? vv.height : window.innerHeight;
      const top = vv ? vv.offsetTop : 0;
      const kb = Math.max(0, Math.round(window.innerHeight - h - top));
      root.style.setProperty('--vvh', `${Math.round(h)}px`);
      root.style.setProperty('--vv-top', `${Math.round(top)}px`);
      root.style.setProperty('--kb', `${kb}px`);
      root.dataset.keyboard = kb > 120 ? 'open' : 'closed';
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(apply); };
    apply();
    vv?.addEventListener('resize', schedule);
    vv?.addEventListener('scroll', schedule);
    window.addEventListener('orientationchange', schedule);
    const onFocus = (e: FocusEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el || !/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || (el as HTMLInputElement).type === 'file') return;
      setTimeout(() => { try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch { /* ignore */ } }, 350);
    };
    document.addEventListener('focusin', onFocus);
    return () => {
      vv?.removeEventListener('resize', schedule);
      vv?.removeEventListener('scroll', schedule);
      window.removeEventListener('orientationchange', schedule);
      document.removeEventListener('focusin', onFocus);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
