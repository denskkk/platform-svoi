'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Zap, X } from 'lucide-react';

export function UpgradeBanner() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = localStorage.getItem('user');
        if (!user) {
          setIsLoading(false);
          return;
        }
        
        setIsAuthed(true);
        
        // Проверяем не был ли баннер закрыт в этой сессии
        const bannerClosed = sessionStorage.getItem('upgradeBannerClosed');
        if (bannerClosed) {
          setIsVisible(false);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem('upgradeBannerClosed', 'true');
  };

  if (isLoading || !isAuthed || !isVisible) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white py-3 px-4 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <Zap className="w-6 h-6 flex-shrink-0 animate-pulse" />
          <div className="flex-1">
            <p className="font-semibold text-sm md:text-base">
              ⚡ Покращіть свій профіль та отримайте більше можливостей!
            </p>
            <p className="text-xs md:text-sm text-yellow-50 hidden sm:block">
              Змініть тип акаунту або купіть доступ до платних функцій
            </p>
          </div>
        </div>
        
        <Link
          href="/upgrade"
          className="bg-white text-orange-600 font-bold px-4 py-2 rounded-lg hover:bg-yellow-50 transition-all shadow-lg hover:shadow-xl whitespace-nowrap text-sm md:text-base"
        >
          Переглянути
        </Link>
        
        <button
          onClick={handleClose}
          className="text-white hover:text-yellow-100 transition-colors ml-2"
          aria-label="Закрити"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
