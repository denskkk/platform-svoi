'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, MapPin, Star, MessageCircle, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { UserOrCompanyAvatar } from '@/components/ui/UserOrCompanyAvatar';
import { useToast } from '@/components/ui/Toast';

interface FavoriteItem {
  id: number;
  targetUser: {
    id: number;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    city: string | null;
    profession: string | null;
    avgRating: number | string | null;
    totalReviews: number;
    isVerified: boolean;
    businessInfo: { companyName: string | null; logoUrl: string | null } | null;
  };
}

function authHeaders(): Record<string, string> {
  try {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export default function FavoritesPage() {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isViewer, setIsViewer] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/favorites', { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.push('/auth/login?returnUrl=/favorites');
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Не вдалося завантажити обране');
      setItems(data.favorites || []);
    } catch (e: any) {
      setError(e.message || 'Не вдалося завантажити обране');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    let hasUser = false;
    try {
      const stored = localStorage.getItem('user');
      hasUser = !!stored;
      setIsViewer(!!stored && JSON.parse(stored).accountType === 'viewer');
    } catch {}
    if (!hasUser) {
      router.push('/auth/login?returnUrl=/favorites');
      return;
    }
    load();
  }, [load, router]);

  const remove = async (targetUserId: number) => {
    const previous = items;
    setItems((list) => list.filter((f) => f.targetUser.id !== targetUserId));
    try {
      const res = await fetch(`/api/favorites?targetUserId=${targetUserId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      toast.success('Видалено з обраного');
    } catch {
      setItems(previous);
      toast.error('Не вдалося видалити з обраного');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
            <Heart className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Обране</h1>
            <p className="text-neutral-600">Профілі, які ви зберегли</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-neutral-600">Завантаження...</div>
        ) : error ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center">
            <p className="text-neutral-700 mb-4">{error}</p>
            <button onClick={load} className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium">
              Спробувати знову
            </button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Обраного поки немає"
            description="Натисніть на сердечко в профілі фахівця, щоб зберегти його тут і швидко повертатися пізніше."
            actionLabel="Знайти фахівців"
            actionHref="/catalog"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map(({ id, targetUser: u }) => {
              const name = u.businessInfo?.companyName || `${u.firstName} ${u.lastName}`;
              const rating = Number(u.avgRating);
              return (
                <div key={id} className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow p-5">
                  <div className="flex items-start gap-4">
                    <Link href={`/profile/${u.id}`} className="shrink-0">
                      <UserOrCompanyAvatar user={u} className="w-16 h-16 rounded-full object-cover" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/profile/${u.id}`} className="font-semibold text-lg text-neutral-900 hover:text-primary-600 flex items-center gap-1.5 flex-wrap">
                        <span className="truncate">{name}</span>
                        {u.isVerified && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">Перевірений</span>
                        )}
                      </Link>
                      {u.profession && <p className="text-sm text-neutral-600 truncate">{u.profession}</p>}
                      <div className="mt-1 flex items-center gap-3 text-sm text-neutral-500 flex-wrap">
                        {u.city && (
                          <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{u.city}</span>
                        )}
                        {u.totalReviews > 0 && !Number.isNaN(rating) && (
                          <span className="inline-flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />{rating.toFixed(1)} ({u.totalReviews})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    {!isViewer && (
                      <Link
                        href={`/chat?with=${u.id}`}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Написати
                      </Link>
                    )}
                    <Link
                      href={`/profile/${u.id}`}
                      className={`${isViewer ? 'flex-1 text-center ' : ''}px-4 py-2 border border-neutral-300 hover:bg-neutral-50 text-neutral-700 rounded-lg font-medium`}
                    >
                      Профіль
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(u.id)}
                      className="px-3 py-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg"
                      aria-label="Видалити з обраного"
                      title="Видалити з обраного"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
