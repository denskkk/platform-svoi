'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * Компонент для редіректу адміністраторів
 * Адмін із головної сторінки переходить в адмінку; інші сторінки відкриваються як звичайно
 */
export default function AdminRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Перевірити чи користувач адмін
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;

    try {
      const user = JSON.parse(storedUser);
      
      // Адмін потрапляє в адмінку лише з головної сторінки; решта розділів (стрічка, відео, проєкти...) лишаються доступними
      if (user.isAdmin && pathname === '/') {
        router.replace('/admin');
      }
    } catch (error) {
      console.error('Помилка перевірки користувача:', error); // i18n-ignore
    }
  }, [pathname, router]);

  return null;
}
