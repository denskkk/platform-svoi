"use client";

import React, { useEffect, useRef, useState } from "react";

interface ServiceImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackLetter?: string; // optional fallback initial
}

export function ServiceImage({ src, alt, className = "" , fallbackLetter}: ServiceImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const retriedRef = useRef(false);

  useEffect(() => {
    retriedRef.current = false;
    setFailed(false);
    if (src) {
      const cacheBuster = src.includes("?") ? "&" : "?";
      setImageSrc(`${src}${cacheBuster}t=${Date.now()}`);
    } else {
      setImageSrc(null);
    }
  }, [src]);

  if (!imageSrc || failed) {
    const letter = (fallbackLetter || alt || "S").slice(0,1).toUpperCase();
    return (
      <div className={`relative ${className}`} aria-label={alt} role="img">
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-200 to-accent-200">
          <span className="text-4xl font-bold text-neutral-700">{letter}</span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (!retriedRef.current && src) {
          retriedRef.current = true;
          setImageSrc(src); // retry without cache-buster
        } else {
          setFailed(true);
        }
      }}
    />
  );
}
