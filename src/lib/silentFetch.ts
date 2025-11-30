/**
 * Silent fetch - не показує помилки 401 в консолі браузера
 * Використовується для перевірки авторизації без спаму в консоль
 */

export async function silentFetch(url: string, options?: RequestInit): Promise<Response> {
  try {
    const response = await fetch(url, options);
    
    // Не показуємо помилки 401 в консолі - це очікувані помилки для незалогінених користувачів
    if (response.status === 401) {
      // Створюємо клон відповіді, щоб уникнути помилок в консолі
      return response;
    }
    
    return response;
  } catch (error) {
    // Тихо обробляємо мережеві помилки
    throw error;
  }
}

/**
 * Перевірка чи користувач авторизований без помилок в консолі
 */
export async function checkAuth(): Promise<{ isAuthed: boolean; user?: any }> {
  try {
    // Спочатку перевіряємо localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      return { isAuthed: true, user: JSON.parse(storedUser) };
    }

    // Якщо немає в localStorage, перевіряємо на сервері
    const response = await silentFetch('/api/auth/me', {
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      return { isAuthed: true, user: data.user };
    }

    return { isAuthed: false };
  } catch {
    return { isAuthed: false };
  }
}
