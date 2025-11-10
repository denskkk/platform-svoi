'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

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
    if (src && !src.startsWith('data:')) {
      const cacheBuster = src.includes('?') ? '&' : '?';
      setImageSrc(`${src}${cacheBuster}t=${Date.now()}`);
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

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={(e) => {
        console.error('Failed to load avatar:', src);
        // Пробуємо завантажити без cache-buster
        if (!retried && src && !src.startsWith('data:')) {
          setRetried(true);
          setImageSrc(src);
        } else {
          setImageError(true);
        }
      }}
    />
  );
}
