'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const THRESHOLD = 70;
const MAX_PULL = 110;

/**
 * Pull-to-refresh на touch-подіях: працює однаково в браузері та в Capacitor WebView
 * (нативного pull-to-refresh у WebView немає). Спрацьовує лише коли сторінка прокручена до верху.
 */
export function usePullToRefresh(onRefresh: () => Promise<void> | void, enabled = true) {
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const distanceRef = useRef(0);
  const busy = useRef(false);
  const refreshRef = useRef(onRefresh);
  refreshRef.current = onRefresh;

  const setDist = useCallback((value: number) => {
    distanceRef.current = value;
    setDistance(value);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const onStart = (e: TouchEvent) => {
      if (busy.current || window.scrollY > 0 || e.touches.length !== 1) {
        startY.current = null;
        return;
      }
      startY.current = e.touches[0].clientY;
    };

    const onMove = (e: TouchEvent) => {
      if (startY.current === null || busy.current) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0 || window.scrollY > 0) {
        if (distanceRef.current !== 0) setDist(0);
        return;
      }
      setDist(Math.min(MAX_PULL, dy * 0.5));
    };

    const onEnd = async () => {
      const reached = distanceRef.current >= THRESHOLD;
      startY.current = null;
      if (!reached || busy.current) {
        setDist(0);
        return;
      }
      busy.current = true;
      setRefreshing(true);
      setDist(THRESHOLD * 0.7);
      try {
        await refreshRef.current();
      } finally {
        busy.current = false;
        setRefreshing(false);
        setDist(0);
      }
    };

    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
  }, [enabled, setDist]);

  return { distance, refreshing, ready: distance >= THRESHOLD, threshold: THRESHOLD };
}
