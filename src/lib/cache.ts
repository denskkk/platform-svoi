/**
 * In-memory кеш для API відповідей
 * Для production краще використовувати Redis
 */

interface CacheEntry {
  data: any;
  expiresAt: number;
}

class ApiCache {
  private cache: Map<string, CacheEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Очищення прострочених записів кожні 5 хвилин
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Зберегти дані в кеш
   */
  set(key: string, data: any, ttlSeconds: number = 300): void {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { data, expiresAt });
  }

  /**
   * Отримати дані з кешу
   */
  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Перевірити чи не прострочений запис
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Видалити з кешу
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Очистити весь кеш
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Очистити прострочені записи
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`[Cache] Cleaned up ${keysToDelete.length} expired entries`);
    }
  }

  /**
   * Отримати статистику кешу
   */
  getStats() {
    const entries: string[] = [];
    this.cache.forEach((_, key) => {
      entries.push(key);
    });
    
    return {
      size: this.cache.size,
      entries
    };
  }
}

// Singleton instance
export const apiCache = new ApiCache();

/**
 * Middleware для кешування GET запитів
 */
export function withCache(
  handler: (request: Request) => Promise<Response>,
  options: { ttl?: number; keyPrefix?: string } = {}
) {
  return async (request: Request): Promise<Response> => {
    // Кешуємо тільки GET запити
    if (request.method !== 'GET') {
      return handler(request);
    }

    const { ttl = 300, keyPrefix = '' } = options;
    
    // Створити ключ кешу на основі URL
    const url = new URL(request.url);
    const cacheKey = `${keyPrefix}${url.pathname}${url.search}`;

    // Спробувати отримати з кешу
    const cached = apiCache.get(cacheKey);
    if (cached) {
      console.log(`[Cache HIT] ${cacheKey}`);
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'HIT'
        }
      });
    }

    console.log(`[Cache MISS] ${cacheKey}`);

    // Викликати handler
    const response = await handler(request);

    // Кешувати тільки успішні відповіді
    if (response.ok) {
      const data = await response.json();
      apiCache.set(cacheKey, data, ttl);
      
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'MISS'
        }
      });
    }

    return response;
  };
}

/**
 * Інвалідувати кеш за патерном
 */
export function invalidateCache(pattern: string): void {
  const stats = apiCache.getStats();
  const keysToDelete = stats.entries.filter(key => key.includes(pattern));
  
  keysToDelete.forEach(key => apiCache.delete(key));
  
  console.log(`[Cache] Invalidated ${keysToDelete.length} entries matching "${pattern}"`);
}
