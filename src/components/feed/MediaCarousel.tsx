'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { FeedMedia } from '@/lib/feedClient';
import { FeedVideo } from '@/components/feed/FeedVideo';

/**
 * Карусель допису, як в Instagram: фото й відео в одній стрічці зі свайпом, лічильник «2/5» і крапки.
 * Відео саме стартує без звуку, коли його слайд на екрані, і зупиняється, коли ви гортаєте далі (див. FeedVideo).
 */
export function MediaCarousel({ media, onOpenImage }: { media: FeedMedia[]; onOpenImage: (url: string) => void }) {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const onScroll = useCallback(() => {
    const el = ref.current;
    if (!el || el.clientWidth === 0) return;
    setIndex(Math.max(0, Math.min(media.length - 1, Math.round(el.scrollLeft / el.clientWidth))));
  }, [media.length]);

  useEffect(() => { onScroll(); }, [onScroll]);

  const go = (to: number) => {
    const el = ref.current;
    if (!el) return;
    const i = Math.max(0, Math.min(media.length - 1, to));
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <div className="relative mt-3 bg-neutral-950 select-none" role="group" aria-roledescription="carousel">
      <div
        ref={ref}
        onScroll={onScroll}
        className="flex overflow-x-auto snap-x snap-mandatory overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden aspect-[4/5] max-h-[75vh]"
      >
        {media.map((m, i) => (
          <div key={`${m.type}-${m.id}`} className="relative w-full h-full shrink-0 snap-center snap-always flex items-center justify-center" aria-label={t('feed.post.carousel.slide', { n: i + 1, total: media.length })}>
            {m.type === 'video' ? (
              <FeedVideo src={m.url} poster={m.posterUrl} className="h-full w-full object-contain" />
            ) : (
              <button type="button" onClick={() => onOpenImage(m.url)} aria-label={t('feed.post.openPhoto')} className="h-full w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.url} alt="" loading={i === 0 ? 'eager' : 'lazy'} decoding="async" draggable={false} className="h-full w-full object-contain" />
              </button>
            )}
          </div>
        ))}
      </div>

      <span className="pointer-events-none absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
        {media[index]?.type === 'video' && <Play className="w-3 h-3 fill-white" aria-hidden />}
        {index + 1}/{media.length}
      </span>

      {index > 0 && (
        <button type="button" onClick={() => go(index - 1)} aria-label={t('feed.post.carousel.prev')}
          className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 items-center justify-center rounded-full bg-white/85 text-neutral-900 shadow hover:bg-white">
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {index < media.length - 1 && (
        <button type="button" onClick={() => go(index + 1)} aria-label={t('feed.post.carousel.next')}
          className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 items-center justify-center rounded-full bg-white/85 text-neutral-900 shadow hover:bg-white">
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      <div className="pointer-events-none absolute bottom-2.5 inset-x-0 flex justify-center gap-1.5">
        {media.map((m, i) => (
          <span key={`${m.type}-${m.id}`} className={cn('h-1.5 rounded-full transition-all', i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/55')} />
        ))}
      </div>
    </div>
  );
}
