'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * Компонент для редіректу адміністраторів
 * Якщо користувач - адмін, він не може відкривати звичайні сторінки
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
      
      // Якщо користувач адмін і не на адмін-сторінці
      if (user.isAdmin && !pathname.startsWith('/admin') && !pathname.startsWith('/auth')) {
        router.replace('/admin');
      }
    } catch (error) {
      console.error('Помилка перевірки користувача:', error);
    }
  }, [pathname, router]);

  return null;
}
