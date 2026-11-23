'use client';

import { useEffect, useRef } from 'react';

const EVENT = 'svoi:video-playing';

/**
 * Відео в стрічці як у соцмережі: стартує без звуку, коли ролик на екрані (≥60%), і САМО зупиняється, коли ви
 * прокрутили далі, перейшли на іншу вкладку або запустили інше відео. Якщо зупинили вручну — до виходу з екрана не вмикається.
 */
export function FeedVideo({ src, poster, className }: { src: string; poster?: string | null; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    let manualPause = false;
    let auto = false; // пауза/старт зробили ми, а не користувач
    const stop = () => { auto = true; v.pause(); setTimeout(() => { auto = false; }, 0); };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && e.intersectionRatio >= 0.6) {
        if (!manualPause && v.paused) { v.play().catch(() => undefined); }
      } else if (!e.isIntersecting || e.intersectionRatio < 0.3) {
        manualPause = false;
        if (!v.paused) stop();
      }
    }, { threshold: [0, 0.3, 0.6, 1] });
    io.observe(v);
    const onPlay = () => { window.dispatchEvent(new CustomEvent(EVENT, { detail: v })); };
    const onPause = () => { if (!auto && !v.ended) manualPause = true; };
    const onOther = (e: Event) => { if ((e as CustomEvent).detail !== v && !v.paused) stop(); };
    const onHidden = () => { if (document.hidden && !v.paused) stop(); };
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    window.addEventListener(EVENT, onOther);
    document.addEventListener('visibilitychange', onHidden);
    return () => {
      io.disconnect();
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      window.removeEventListener(EVENT, onOther);
      document.removeEventListener('visibilitychange', onHidden);
    };
  }, [src]);

  return <video ref={ref} src={src} poster={poster || undefined} controls muted loop playsInline preload="metadata" className={className || 'w-full aspect-[4/5] max-h-[80vh] object-contain bg-black'} />;
}
