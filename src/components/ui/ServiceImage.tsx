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
      const ts = Date.now();
      const addTs = (u: string) => `${u}${u.includes("?") ? "&" : "?"}t=${ts}`;
      // Якщо маємо webp → генеруємо jpeg fallback
      if (src.endsWith('.webp')) {
        const jpegBase = src.replace(/\.webp$/i, '.jpg');
        setWebpSrc(addTs(src));
        setJpegSrc(addTs(jpegBase));
      } else if (src.endsWith('.jpg') || src.endsWith('.jpeg') || src.endsWith('.png')) {
        setWebpSrc(addTs(src));
        setJpegSrc(addTs(src));
      } else {
        setWebpSrc(addTs(src));
        // Спробуємо універсальний jpeg варіант
        const jpegGuess = src + '.jpg';
        setJpegSrc(addTs(jpegGuess));
      }
    } else {
      setWebpSrc(null);
      setJpegSrc(null);
    }
  }, [src]);

  if (!webpSrc || failed) {
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
      {/* Джерело WebP */}
      <source srcSet={webpSrc} type="image/webp" />
      {/* Fallback JPEG/PNG */}
      <img
        src={jpegSrc || webpSrc}
        alt={alt}
        className={className}
        onError={() => {
          // Якщо помилка на jpeg → пробуємо оригінал без cache-buster один раз
          if (!retriedRef.current && src) {
            retriedRef.current = true;
            // Спроба без параметра (WebP)
            if (webpSrc && webpSrc.includes('?t=')) {
              setWebpSrc(src.endsWith('.webp') ? src : src + (src.includes('?') ? '&' : '?') + 'orig=1');
            }
          } else if (!triedJpegRef.current && jpegSrc) {
            triedJpegRef.current = true;
            // Спробуємо ще раз jpeg без cache-buster
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
