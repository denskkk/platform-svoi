'use client';

import Image from 'next/image';
import { useState } from 'react';

interface UserAvatarProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallbackName?: string;
}

export function UserAvatar({ src, alt, className = '', fallbackName }: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);

  // Функція для отримання ініціалів з імені
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Якщо немає аватара або помилка завантаження - показуємо fallback
  if (!src || imageError) {
    return (
      <div className={`bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold ${className}`}>
        {fallbackName ? getInitials(fallbackName) : alt.substring(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        console.error('Failed to load avatar:', src);
        setImageError(true);
      }}
    />
  );
}
