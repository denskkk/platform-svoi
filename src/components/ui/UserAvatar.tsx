'use client';

import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';

interface UserAvatarProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallbackName?: string;
}

export function UserAvatar({ src, alt, className = '', fallbackName }: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [retried, setRetried] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // Helper: add cache-busting param
  const withCacheBuster = (url: string | null | undefined) => {
    if (!url || url.startsWith('data:')) return url || null;
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}t=${Date.now()}`;
  };

  // Derive JPG fallback from provided src (when it ends with .webp)
  const jpgFallback = useMemo(() => {
    if (!src) return null;
    if (src.startsWith('data:')) return null;
    // Preserve any existing query string when replacing extension
    const [base, query] = src.split('?');
    if (base.toLowerCase().endsWith('.webp')) {
      const jpgBase = base.replace(/\.webp$/i, '.jpg');
      return query ? `${jpgBase}?${query}` : jpgBase;
    }
    // If not webp, no special fallback
    return src;
  }, [src]);

  // Функція для отримання ініціалів з імені
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Додаємо cache-busting до URL
  useEffect(() => {
    setImageError(false);
    setRetried(false);
    if (src && !src.startsWith('data:')) {
      // Якщо URL вже містить timestamp (свіжозавантажений), використовуємо як є
      // Інакше додаємо cache-busting для старих URL
      if (src.includes('?t=') || src.includes('&t=')) {
        setImageSrc(src);
      } else {
        setImageSrc(withCacheBuster(src));
      }
    } else {
      setImageSrc(src || null);
    }
  }, [src]);

  // Якщо немає аватара або помилка завантаження - показуємо fallback
  if (!imageSrc || imageError) {
    return (
      <div className={`bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold ${className}`}>
        {fallbackName ? getInitials(fallbackName) : alt.substring(0, 2).toUpperCase()}
      </div>
    );
  }

  // Use <picture> to provide WebP and automatic JPG fallback on older devices
  return (
    <picture>
      {/* Prefer WebP when supported */}
      {imageSrc && imageSrc.toLowerCase().includes('.webp') && (
        <source srcSet={imageSrc} type="image/webp" />
      )}
      {/* Fallback <img>: try JPG (if available) or original */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={withCacheBuster(jpgFallback || imageSrc || '') || undefined}
        alt={alt}
        className={className}
        onError={() => {
          // Last resort: attempt original src without cache-buster once
          if (!retried && src && !src.startsWith('data:')) {
            setRetried(true);
            setImageSrc(src);
          } else {
            setImageError(true);
          }
        }}
      />
    </picture>
  );
}
