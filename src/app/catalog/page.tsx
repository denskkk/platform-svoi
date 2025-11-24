/**
 * Публічна сторінка каталогу людей (користувачів) з пошуком та фільтрами
 */
import Link from 'next/link';
import { headers } from 'next/headers';
import { Search, MapPin, Star, Users } from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { translateAccountType } from '@/lib/translations';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getBaseUrl() {
  // Always compute from incoming request headers to avoid TLS mismatches
  const h = headers();
  const proto = h.get('x-forwarded-proto') || 'http';
  const host = h.get('host') || 'localhost:3000';
  return `${proto}://${host}`;
}

async function fetchUsers(q?: string, city?: string) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (city) params.set('city', city);
  const query = params.toString();
  const base = getBaseUrl();
  const url = `${base}/api/users${query ? `?${query}` : ''}`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      console.error('[catalog] /api/users responded with', res.status);
      return [];
    }
    const data = await res.json();
    return data.users || [];
  } catch (e) {
    console.error('[catalog] fetch failed for', url, e);
    return [];
  }
}

// Catalog of users (discovery)
export default async function CatalogUsersPage({ searchParams }: { searchParams?: { q?: string; city?: string } }) {
  const q = searchParams?.q;
  const city = searchParams?.city;
  const users = await fetchUsers(q, city);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-3 flex items-center gap-3"><Users className="w-10 h-10" />Каталог людей</h1>
          <p className="text-indigo-100 text-lg mb-6">Знайдіть учасників спільноти за професією, містом або ім'ям.</p>
          <form action="/catalog" method="GET" className="bg-white rounded-lg p-4 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input name="q" defaultValue={q} placeholder="Пошук (ім'я, професія)..." className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900" />
            </div>
            <input name="city" defaultValue={city} placeholder="Місто" className="md:w-48 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900" />
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-semibold">Шукати</button>
          </form>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Знайдено: {users.length}</h2>
        {users.length === 0 ? (
          <div className="bg-white p-10 rounded-lg shadow text-center text-gray-600">Нічого не знайдено.</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((u: any) => {
              // Для бізнес користувачів показуємо логотип компанії, якщо він є
              const displayImage = u.businessInfo?.logoUrl || u.avatarUrl;
              const displayName = u.businessInfo?.companyName || `${u.firstName} ${u.lastName}`;
              const isBusiness = u.role === 'business' || u.accountType?.includes('business');
              
              return (
                <Link key={u.id} href={`/profile/${u.id}`} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition group">
                  <div className="flex items-center gap-4 mb-4">
                    <UserAvatar 
                      src={displayImage}
                      alt={displayName}
                      className="w-14 h-14 rounded-full object-cover"
                      fallbackName={displayName}
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-lg">
                        {displayName}
                        {u.isVerified && <span className="text-blue-600 ml-1" title="Верифікований">✓</span>}
                      </p>
                      {isBusiness && !u.businessInfo?.companyName && (
                        <p className="text-xs text-gray-500">{u.firstName} {u.lastName}</p>
                      )}
                      {u.city && <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{u.city}</p>}
                    </div>
                  </div>
                  {u.profession && <p className="text-sm text-gray-700 mb-3 line-clamp-2">{u.profession}</p>}
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span className="font-medium">{translateAccountType(u.accountType)}</span>
                    {u.totalReviews > 0 && (
                      <span className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-400 fill-current" />{u.avgRating.toFixed(1)}</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
