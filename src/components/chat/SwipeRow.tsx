'use client';

import { ReactNode, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';

const OPEN_PX = 88;      // ширина червоної кнопки
const HOLD_MS = 500;     // утримання для видалення
const MOVE_PX = 8;       // після цього зсуву це свайп, а не тап

/**
 * Рядок списку: тап відкриває, свайп вліво показує «Видалити», утримання (або права кнопка миші) одразу просить підтвердити видалення.
 */
export function SwipeRow({ children, onOpen, onDelete, label, className = '' }: { children: ReactNode; onOpen: () => void; onDelete: () => void; label: string; className?: string }) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const st = useRef({ x: 0, y: 0, base: 0, swiping: false, fired: false, id: -1, timer: null as ReturnType<typeof setTimeout> | null });
  const el = useRef<HTMLDivElement>(null);

  const clear = () => { if (st.current.timer) { clearTimeout(st.current.timer); st.current.timer = null; } };

  const down = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const s = st.current;
    s.x = e.clientX; s.y = e.clientY; s.base = dx; s.swiping = false; s.fired = false; s.id = e.pointerId;
    clear();
    s.timer = setTimeout(() => {
      s.timer = null;
      if (!s.swiping) { s.fired = true; if (navigator.vibrate) { try { navigator.vibrate(15); } catch { /* ignore */ } } onDelete(); }
    }, HOLD_MS);
  };
  const move = (e: React.PointerEvent) => {
    const s = st.current;
    if (s.id !== e.pointerId || s.fired) return;
    const mx = e.clientX - s.x, my = e.clientY - s.y;
    if (!s.swiping) {
      if (Math.abs(my) > MOVE_PX && Math.abs(my) > Math.abs(mx)) { clear(); s.id = -1; return; } // це прокрутка списку
      if (Math.abs(mx) < MOVE_PX) return;
      s.swiping = true; clear(); setDragging(true);
      try { el.current?.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    }
    setDx(Math.max(-OPEN_PX, Math.min(0, s.base + mx)));
  };
  const up = (e: React.PointerEvent) => {
    const s = st.current;
    if (s.id !== e.pointerId) return;
    clear(); s.id = -1;
    if (s.swiping) { setDragging(false); setDx((v) => (v < -OPEN_PX / 2 ? -OPEN_PX : 0)); }
  };
  const cancel = () => { clear(); st.current.id = -1; if (st.current.swiping) { setDragging(false); setDx((v) => (v < -OPEN_PX / 2 ? -OPEN_PX : 0)); } };

  const click = () => {
    const s = st.current;
    if (s.swiping || s.fired) { s.swiping = false; s.fired = false; return; }
    if (dx !== 0) { setDx(0); return; } // відкритий рядок: тап закриває
    onOpen();
  };

  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      <button type="button" onClick={() => { setDx(0); onDelete(); }} aria-label={label} tabIndex={dx === 0 ? -1 : 0}
        className="absolute inset-y-0 right-0 flex items-center justify-center gap-1 bg-red-600 text-white text-sm font-bold" style={{ width: OPEN_PX }}>
        <Trash2 className="w-5 h-5" />
      </button>
      <div ref={el} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel} onClick={click}
        onContextMenu={(e) => { e.preventDefault(); }}
        style={{ transform: `translateX(${dx}px)`, transition: dragging ? 'none' : 'transform 180ms ease', touchAction: 'pan-y', WebkitTouchCallout: 'none', userSelect: 'none' }}
        className="relative bg-white cursor-pointer">
        {children}
      </div>
    </div>
  );
}
