'use client';

import { useMemo } from 'react';
import { qrSvg } from '@/lib/qr';

/** QR-код у вигляді SVG (генерується локально, без зовнішніх сервісів). */
export function QrCode({ value, size = 256, className }: { value: string; size?: number; className?: string }) {
  const svg = useMemo(() => { try { return qrSvg(value, size); } catch { return ''; } }, [value, size]);
  if (!svg) return null;
  return <div className={className} aria-hidden dangerouslySetInnerHTML={{ __html: svg }} />;
}

/** Завантажує SVG цього QR-коду файлом. */
export function downloadQrSvg(value: string, filename: string) {
  const blob = new Blob([qrSvg(value, 1024)], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
