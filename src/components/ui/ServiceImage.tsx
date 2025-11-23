"use client";

import React, { useEffect, useRef, useState } from "react";

interface ServiceImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackLetter?: string; // optional fallback initial
}

export function ServiceImage({ src, alt, className = "", fallbackLetter }: ServiceImageProps) {
  const [webpSrc, setWebpSrc] = useState<string | null>(null);
  const [jpegSrc, setJpegSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const retriedRef = useRef(false);
  const triedJpegRef = useRef(false);

  useEffect(() => {
    retriedRef.current = false;
    triedJpegRef.current = false;
    setFailed(false);
    if (src) {
      // Функція для додавання timestamp тільки якщо його ще немає
      const addTs = (u: string) => {
        // Якщо URL вже містить timestamp, використовуємо як є
        if (u.includes('?t=') || u.includes('&t=')) {
          return u;
        }
        const ts = Date.now();
        return `${u}${u.includes("?") ? "&" : "?"}t=${ts}`;
      };
      
      // Якщо URL має розширення .webp — підготуємо webp джерело і jpeg fallback
      if (src.toLowerCase().endsWith('.webp')) {
        const jpegBase = src.replace(/\.webp$/i, '.jpg');
        setWebpSrc(addTs(src));
        setJpegSrc(addTs(jpegBase));
      } else {
        // Для jpg/png або будь-якого іншого URL — не ставимо <source type="image/webp">,
        // а використовуємо безпосередньо основний src як jpeg/png (з cache-buster).
        setWebpSrc(null);
        setJpegSrc(addTs(src));
      }
    } else {
      setWebpSrc(null);
      setJpegSrc(null);
    }
  }, [src]);

  if ((!webpSrc && !jpegSrc) || failed) {
    const letter = (fallbackLetter || alt || 'S').slice(0, 1).toUpperCase();
    return (
      <div className={`relative ${className}`} aria-label={alt} role="img">
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-200 to-accent-200">
          <span className="text-4xl font-bold text-neutral-700">{letter}</span>
        </div>
      </div>
    );
  }

  return (
    <picture>
      {/* Якщо є webpSrc — додамо webp-джерело, інакше просто рендеримо <img> з jpegSrc */}
      {webpSrc && <source srcSet={webpSrc} type="image/webp" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={jpegSrc || webpSrc || ''}
        alt={alt}
        className={className}
        onError={() => {
          if (!retriedRef.current && src) {
            retriedRef.current = true;
            // Спроба підчистити cache-buster
            if (jpegSrc && jpegSrc.includes('?t=')) {
              setJpegSrc(jpegSrc.split('?')[0]);
            }
          } else if (!triedJpegRef.current && jpegSrc) {
            triedJpegRef.current = true;
            const cleanJpeg = jpegSrc.split('?')[0];
            setJpegSrc(cleanJpeg);
          } else {
            setFailed(true);
          }
        }}
      />
    </picture>
  );
}
