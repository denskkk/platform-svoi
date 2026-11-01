'use client';

import { useState, useEffect } from 'react';
// Use local image loader for uploaded files to avoid Next.js image optimizer errors
// (uploads are served from /uploads/* by nginx)
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Star, Plus, Edit, Mail, Phone, MessageCircle, Heart, Facebook, Instagram, Linkedin, Globe, Send, Gift, LogOut } from 'lucide-react';
import { formatRating } from '@/lib/format';
import { logout } from '@/lib/client-auth';
import { checkAuth, ensureToken } from '@/lib/silentFetch';
import { useToast } from '@/components/ui/Toast';
import { PermissionButton } from '@/components/ui/RequirePermission';
import { ReportButton } from '@/components/ui/ReportButton';
import { ViewerUpgradeNotice } from '@/components/ui/ViewerUpgradeNotice';
import { UpgradeAccountCTA } from '@/components/ui/UpgradeAccountCTA';
import { AccountTypeBadge } from '@/components/ui/AccountTypeBadge';
import { ServiceImage } from '@/components/ui/ServiceImage';
import { 
  translateCategory, 
  translateOfferType, 
  translateEmploymentType, 
  translateGender, 
  translateMaritalStatus, 
  translateEducation, 
  translateEmploymentStatus, 
  translateAccountType, 
  translateBoolean, 
  translateHousingType,
  translateLivingSituation,
  formatList
} from '@/lib/translations';
import { useI18n } from '@/i18n/client';
import { localizedPath } from '@/i18n/routes';

export default function ProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();
  const { t, locale, formatDate } = useI18n();
  const [profile, setProfile] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const authHeaders = (): Record<string, string> => {
    try {
      const token = localStorage.getItem('token');
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch {
      return {};
    }
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      window.dispatchEvent(new Event('auth:changed'));
      router.push(localizedPath('/', locale));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('profile.view.toasts.logoutFailed'));
      setLoggingOut(false);
    }
  };

  // Стан «в обраному» для чужого профілю
  useEffect(() => {
    if (!currentUser || String(currentUser.id) === String(params.id)) {
      setIsFavorite(false);
      return;
    }
    let cancelled = false;
    fetch(`/api/favorites?targetUserId=${params.id}`, { credentials: 'include', headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d) setIsFavorite(!!d.isFavorite); })
      .catch(() => {});
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, params.id]);

  const toggleFavorite = async () => {
    const next = !isFavorite;
    setIsFavorite(next);
    try {
      const res = next
        ? await fetch('/api/favorites', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', ...authHeaders() },
            body: JSON.stringify({ targetUserId: Number(params.id) }),
          })
        : await fetch(`/api/favorites?targetUserId=${params.id}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: authHeaders(),
          });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t('profile.view.toasts.favoriteUpdateFailed'));
      toast.success(next ? t('profile.view.toasts.favoriteAdded') : t('profile.view.toasts.favoriteRemoved'));
    } catch (e: any) {
      setIsFavorite(!next);
      toast.error(e.message || t('profile.view.toasts.favoriteUpdateFailed'));
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Токен у localStorage може бути порожнім при живій cookie-сесії — тоді відновлюємо його
      const token = await ensureToken();
      if (cancelled) return;
      if (!token) {
        router.push(`/auth/login?redirect=/profile/${params.id}`);
        return;
      }

      // Отримати поточного користувача
      let storedUser: string | null = null;
      try { storedUser = localStorage.getItem('user'); } catch {}
      if (storedUser) {
        try { setCurrentUser(JSON.parse(storedUser)); } catch {}
      } else {
        const auth = await checkAuth();
        if (cancelled) return;
        if (auth.status === 'authed') {
          setCurrentUser(auth.user);
          try { localStorage.setItem('user', JSON.stringify(auth.user)); } catch {}
        }
      }

      // Загрузить профиль
      loadProfile();
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  // Перезавантажити профіль при поверненні на сторінку
  useEffect(() => {
    const handleFocus = () => {
      loadProfile();
    };

    window.addEventListener('focus', handleFocus);
    // Перезавантажувати профіль коли інші частини апки повідомлять про оновлення користувача
    const handleUserUpdated = () => {
      loadProfile();
    };
    window.addEventListener('userUpdated', handleUserUpdated as EventListener);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('userUpdated', handleUserUpdated as EventListener);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const loadProfile = async () => {
    try {
      // Додаємо cache-busting параметр для отримання свіжих даних
      const cacheBuster = `t=${Date.now()}`;
      const response = await fetch(`/api/profile/${params.id}?${cacheBuster}`, {
        cache: 'no-store',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('profile.view.loadFailed'));
      }

      setProfile(data.user);
    } catch (err: any) {
      setError(err.message || t('profile.view.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const asList = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean).map(String);
    if (typeof val === 'object') {
      return Object.entries(val)
        .filter(([_, v]) => !!v)
        .map(([k]) => String(k));
    }
    if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
    return [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-neutral-600">{t('profile.view.loading')}</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || t('profile.view.notFound')}</p>
          <Link href={localizedPath('/', locale)} className="text-primary-600 hover:text-primary-700">
            {t('profile.view.toHome')}
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser && currentUser.id === profile.id;

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ViewerUpgradeNotice className="mb-6" />
        {/* Банер компанії (для бізнес акаунтів) */}
        {profile?.businessInfo?.bannerUrl && (
          <div className="mb-6 rounded-2xl overflow-hidden shadow-md">
            <ServiceImage
              src={`${profile.businessInfo.bannerUrl}${profile.businessInfo.bannerUrl.includes('?') ? '&' : '?'}t=${Date.now()}`}
              alt={t('profile.view.header.bannerAlt')}
              className="w-full h-48 md:h-64 object-cover"
            />
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Основна інформація */}
          <div className="lg:col-span-2 space-y-6">
            {/* Шапка профілю */}
            <div className="bg-gradient-to-br from-white via-white to-primary-50/30 rounded-2xl shadow-lg border border-neutral-100 p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Фото */}
                <div className="relative">
                  {profile?.businessInfo?.logoUrl ? (
                    <ServiceImage
                      src={`${profile.businessInfo.logoUrl}${profile.businessInfo.logoUrl.includes('?') ? '&' : '?'}t=${Date.now()}`}
                      alt={t('profile.view.header.logoAlt')}
                      className="w-32 h-32 rounded-2xl object-cover flex-shrink-0 bg-white shadow-md ring-4 ring-white"
                    />
                  ) : profile.avatarUrl ? (
                    <ServiceImage
                      src={`${profile.avatarUrl}${profile.avatarUrl.includes('?') ? '&' : '?'}t=${Date.now()}`}
                      alt={`${profile.firstName} ${profile.lastName}`}
                      className="w-32 h-32 rounded-2xl object-cover flex-shrink-0 shadow-md ring-4 ring-white"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-gradient-to-br from-primary-400 to-accent-400 rounded-2xl flex items-center justify-center text-5xl font-bold text-white flex-shrink-0 shadow-md ring-4 ring-white">
                      {profile.firstName?.[0]}{profile.lastName?.[0]}
                    </div>
                  )}
                  {profile?.businessInfo?.logoUrl && profile.avatarUrl && (
                    <ServiceImage
                      src={`${profile.avatarUrl}${profile.avatarUrl.includes('?') ? '&' : '?'}t=${Date.now()}`}
                      alt={`${profile.firstName} ${profile.lastName}`}
                      className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full object-cover shadow-md ring-2 ring-white bg-white"
                    />
                  )}
                  {profile.isVerified && (
                    <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white" title={t('profile.view.header.verifiedTitle')}>
                      <span className="text-white text-xl">✓</span>
                    </div>
                  )}
                </div>

                {/* Інфо */}
                <div className="flex-grow">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h1 className="text-3xl md:text-4xl font-bold text-neutral-900">
                          {profile.firstName} {profile.middleName ? `${profile.middleName} ` : ''}{profile.lastName}
                        </h1>
                        <AccountTypeBadge accountType={profile.accountType || 'basic'} size="sm" />
                        {profile.isVerified && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold rounded-full shadow-md">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            {t('profile.view.header.verified')}
                          </span>
                        )}
                      </div>
                      
                      {profile.profession && (
                        <p className="text-lg text-neutral-600 mb-2">{profile.profession}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-600">
                        {(profile.city || profile.region) && (
                          <div className="flex items-center gap-1 px-3 py-1.5 bg-neutral-50 rounded-lg">
                            <MapPin className="w-4 h-4 text-primary-500" />
                            <span>{profile.city}{profile.region && `, ${profile.region}`}</span>
                          </div>
                        )}
                        {profile.age && (
                          <div className="px-3 py-1.5 bg-neutral-50 rounded-lg">
                            {t('profile.view.header.years', { count: profile.age })}
                          </div>
                        )}
                        {profile.gender && (
                          <div className="px-3 py-1.5 bg-neutral-50 rounded-lg">
                            {translateGender(profile.gender, locale)}
                          </div>
                        )}
                      </div>

                      {isOwnProfile && profile.trialStatus && profile.trialStatus !== 'none' && (
                        <div className="mt-3">
                          <span
                            className={`inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full border ${
                              profile.trialStatus === 'active'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                            }`}
                            title={profile.trialStatus === 'active' ? t('profile.view.header.trialActiveTitle') : t('profile.view.header.trialEndedTitle')}
                          >
                            {profile.trialStatus === 'active'
                              ? t('profile.view.header.trialActive', { days: profile.trialDaysLeft })
                              : t('profile.view.header.trialEnded')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Дії */}
                    <div className="flex flex-wrap items-center gap-2">
                      {isOwnProfile ? (
                        <>
                          <Link
                            href={String(profile.accountType || '').startsWith('business') ? '/profile/edit-business' : '/profile/edit'}
                            className="flex items-center px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-medium rounded-lg shadow-md transition-all duration-200 hover:shadow-lg"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            {t('profile.view.actions.edit')}
                          </Link>
                          <button
                            type="button"
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="flex items-center px-5 py-2.5 border-2 border-red-300 text-red-600 hover:bg-red-50 font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
                          >
                            <LogOut className="w-4 h-4 mr-2" />
                            {loggingOut ? t('profile.view.actions.loggingOut') : t('profile.view.actions.logout')}
                          </button>
                        </>
                      ) : (
                        <>
                          {currentUser?.accountType !== 'viewer' && (
                          <Link
                            href={`/chat?with=${profile.id}`}
                            className="flex items-center px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-medium rounded-lg shadow-md transition-all duration-200 hover:shadow-lg"
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            {t('profile.view.actions.write')}
                          </Link>
                          )}
                          <PermissionButton
                            permission="ADD_TO_FAVORITES"
                            onClick={toggleFavorite}
                            className={`p-2.5 rounded-lg border-2 transition-all duration-200 shadow-sm hover:shadow-md ${
                              isFavorite
                                ? 'border-red-500 bg-red-50 text-red-500'
                                : 'border-neutral-300 hover:border-primary-500 text-neutral-600 bg-white'
                            }`}
                          >
                            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                          </PermissionButton>
                          <ReportButton
                            reportedUserId={profile.id}
                            contentType="user"
                            label={t('profile.view.actions.report')}
                            className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm text-neutral-500 hover:text-red-600 border border-neutral-200 hover:border-red-200 rounded-lg bg-white transition-colors"
                          />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Рейтинг */}
                  {profile.totalReviews > 0 && (
                    <div className="flex items-center space-x-3 p-3 bg-amber-50 rounded-lg border border-amber-100 mt-4">
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${
                              i < Math.floor(Number(profile.avgRating))
                                ? 'text-amber-400 fill-current'
                                : 'text-amber-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-bold text-neutral-900 text-lg">{formatRating(profile.avgRating,1)}</span>
                      <span className="text-neutral-600">•</span>
                      <span className="text-neutral-600">{t('profile.view.header.reviewsCount', { count: profile.totalReviews })}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Блок компанії (для бізнес акаунтів) */}
            {String(profile.accountType || '').startsWith('business') && profile.businessInfo && (
              <div className="bg-white rounded-2xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">                {t('profile.view.company.title')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.businessInfo.companyName && (
                    <div>
                                      <div className="text-sm text-neutral-500">{t('profile.view.company.name')}</div>
                      <div className="font-medium">{profile.businessInfo.companyName}</div>
                    </div>
                  )}
                  {profile.businessInfo.companyCode && (
                    <div>
                      <div className="text-sm text-neutral-500">{t('profile.view.company.code')}</div>
                      <div className="font-medium">{profile.businessInfo.companyCode}</div>
                    </div>
                  )}
                  {profile.businessInfo.businessCategory && (
                    <div>
                      <div className="text-sm text-neutral-500">                      {t('profile.view.company.category')}</div>
                                            <div className="font-medium">{translateCategory(profile.businessInfo.businessCategory, locale)}</div>
                    </div>
                  )}
                  {profile.businessInfo.offerType && (
                    <div>
                      <div className="text-sm text-neutral-500">                      {t('profile.view.company.offers')}</div>
                                            <div className="font-medium">{translateOfferType(profile.businessInfo.offerType, locale)}</div>
                    </div>
                  )}
                  {profile.businessInfo.website && (
                    <div className="md:col-span-2">
                      <div className="text-sm text-neutral-500">{t('profile.view.company.website')}</div>
                      <a href={profile.businessInfo.website} target="_blank" className="font-medium text-primary-600 hover:underline">{profile.businessInfo.website}</a>
                    </div>
                  )}
                  {profile.businessInfo.description && (
                    <div className="md:col-span-2">
                      <div className="text-sm text-neutral-500">{t('profile.view.company.description')}</div>
                      <div className="font-medium whitespace-pre-wrap">{profile.businessInfo.description}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Вакансії */}
            {profile?.businessInfo?.seekingEmployee && Array.isArray(profile.businessInfo.employeeVacancies) && profile.businessInfo.employeeVacancies.length > 0 && (
              <div className="bg-white rounded-2xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">{t('profile.view.vacancies.title')}</h3>
                <div className="space-y-4">
                  {profile.businessInfo.employeeVacancies.map((v: any, idx: number) => (
                    <div key={idx} className="border border-neutral-200 rounded-xl p-4">
                      {v.position && <div className="text-base font-semibold mb-2">{v.position}</div>}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-neutral-700">
                        {v.salary && (
                          <div><span className="text-neutral-500">                          {t('profile.view.vacancies.salary')}</span><span className="font-medium">{v.salary}</span></div>
                        )}
                        {v.employmentType && (
                                                    <div><span className="text-neutral-500">{t('profile.view.vacancies.type')}</span><span className="font-medium">{translateEmploymentType(v.employmentType, locale)}</span></div>
                        )}
                        {v.experience && (
                                                    <div className="md:col-span-2"><span className="text-neutral-500">{t('profile.view.vacancies.experience')}</span><span className="font-medium">{v.experience}</span></div>
                        )}
                        {v.responsibilities && (
                          <div className="md:col-span-2"><span className="text-neutral-500">{t('profile.view.vacancies.responsibilities')}</span><span className="font-medium whitespace-pre-wrap">{v.responsibilities}</span></div>
                        )}
                        {v.requirements && (
                          <div className="md:col-span-2"><span className="text-neutral-500">{t('profile.view.vacancies.requirements')}</span><span className="font-medium whitespace-pre-wrap">{v.requirements}</span></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Бізнес-інформація (якщо є) */}
            {profile.businessInfo && (
              <div className="bg-gradient-to-br from-accent-50 to-primary-50 rounded-2xl shadow-md p-6 border-2 border-accent-200">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-accent-500 rounded-xl flex items-center justify-center">
                      <span className="text-white text-2xl">🏢</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-neutral-900">
                        {profile.businessInfo.companyName || t('profile.view.business.defaultTitle')}
                      </h2>
                      {profile.businessInfo.businessType && (
                        <p className="text-sm text-neutral-600">{profile.businessInfo.businessType}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Лого компанії */}
                  {profile.businessInfo.logoUrl && (
                    <ServiceImage
                      src={`${profile.businessInfo.logoUrl}${profile.businessInfo.logoUrl.includes('?') ? '&' : '?'}t=${Date.now()}`}
                      alt={t('profile.view.business.logoAlt', { name: profile.businessInfo.companyName })}
                      className="w-20 h-20 object-contain rounded-lg bg-white p-2 shadow-sm"
                    />
                  )}
                </div>

                {/* Представник */}
                {(profile.businessInfo.representativeName || profile.businessInfo.position) && (
                  <div className="mb-4 p-3 bg-white/50 rounded-lg">
                    <p className="text-sm text-neutral-600">{t('profile.view.business.representative')}</p>
                    <p className="font-semibold text-neutral-900">
                      {profile.businessInfo.representativeName}
                      {profile.businessInfo.position && ` • ${profile.businessInfo.position}`}
                    </p>
                  </div>
                )}

                {/* Короткий опис */}
                {profile.businessInfo.description && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-neutral-900 mb-2">{t('profile.view.business.about')}</h3>
                    <p className="text-neutral-700 leading-relaxed">{profile.businessInfo.description}</p>
                  </div>
                )}

                {/* Місія */}
                {profile.businessInfo.mission && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-neutral-900 mb-2">{t('profile.view.business.mission')}</h3>
                    <p className="text-neutral-700 leading-relaxed">{profile.businessInfo.mission}</p>
                  </div>
                )}

                {/* Унікальна цінність */}
                {profile.businessInfo.uniqueValue && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-neutral-900 mb-2">{t('profile.view.business.whyUs')}</h3>
                    <p className="text-neutral-700 leading-relaxed">{profile.businessInfo.uniqueValue}</p>
                  </div>
                )}

                {/* Послуги та товари */}
                {profile.businessInfo.servicesList && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-neutral-900 mb-2">{t('profile.view.business.whatWeOffer')}</h3>
                    <p className="text-neutral-700 leading-relaxed whitespace-pre-line">{profile.businessInfo.servicesList}</p>
                  </div>
                )}

                {/* Ціновий діапазон та години роботи */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {profile.businessInfo.priceRange && (
                    <div className="p-3 bg-white/50 rounded-lg">
                      <p className="text-sm text-neutral-600 mb-1">{t('profile.view.business.priceRange')}</p>
                      <p className="font-semibold text-accent-700">{profile.businessInfo.priceRange}</p>
                    </div>
                  )}
                  {profile.businessInfo.workHours && (
                    <div className="p-3 bg-white/50 rounded-lg">
                      <p className="text-sm text-neutral-600 mb-1">{t('profile.view.business.workHours')}</p>
                      <p className="font-semibold text-neutral-900">{profile.businessInfo.workHours}</p>
                    </div>
                  )}
                </div>

                {/* Команда */}
                {(profile.businessInfo.employeeCount || profile.businessInfo.keySpecialists || profile.businessInfo.teamDescription) && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-neutral-900 mb-2">{t('profile.view.business.team')}</h3>
                    {profile.businessInfo.employeeCount && (
                      <p className="text-sm text-neutral-600 mb-2">
                        {t('profile.view.business.employeeCount')}<span className="font-medium">{profile.businessInfo.employeeCount}</span>
                      </p>
                    )}
                    {profile.businessInfo.keySpecialists && (
                      <p className="text-neutral-700 mb-2">{profile.businessInfo.keySpecialists}</p>
                    )}
                    {profile.businessInfo.teamDescription && (
                      <p className="text-neutral-700 leading-relaxed whitespace-pre-line">{profile.businessInfo.teamDescription}</p>
                    )}
                  </div>
                )}

                {/* Локація */}
                {(profile.businessInfo.serviceLocation || profile.businessInfo.address) && (
                  <div className="mb-4 p-3 bg-white/50 rounded-lg">
                    {profile.businessInfo.serviceLocation && (
                      <div className="mb-2">
                        <p className="text-sm text-neutral-600">{t('profile.view.business.serviceLocation')}</p>
                        <p className="font-semibold text-neutral-900">{profile.businessInfo.serviceLocation}</p>
                      </div>
                    )}
                    {profile.businessInfo.address && (
                      <div>
                        <p className="text-sm text-neutral-600">{t('profile.view.business.address')}</p>
                        <p className="font-semibold text-neutral-900">{profile.businessInfo.address}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Сертифікати */}
                {profile.businessInfo.certificatesInfo && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-neutral-900 mb-2">{t('profile.view.business.certificates')}</h3>
                    <p className="text-neutral-700 leading-relaxed whitespace-pre-line">{profile.businessInfo.certificatesInfo}</p>
                  </div>
                )}

                {/* Партнери */}
                {profile.businessInfo.partners && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-neutral-900 mb-2">{t('profile.view.business.partners')}</h3>
                    <p className="text-neutral-700 leading-relaxed whitespace-pre-line">{profile.businessInfo.partners}</p>
                  </div>
                )}

                {/* Відгуки на інших платформах */}
                {(
                  profile.businessInfo.externalReviews?.google || 
                  profile.businessInfo.externalReviews?.facebook ||
                  (typeof profile.businessInfo.externalReviews === 'string' && profile.businessInfo.externalReviews)
                ) && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-neutral-900 mb-2">{t('profile.view.business.externalReviews')}</h3>
                    <div className="space-y-2">
                      {profile.businessInfo.externalReviews?.google && (
                        <a 
                          href={profile.businessInfo.externalReviews.google} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block text-blue-600 hover:text-blue-700 text-sm"
                        >
                          {t('profile.view.business.googleReviews')}
                        </a>
                      )}
                      {profile.businessInfo.externalReviews?.facebook && (
                        <a 
                          href={profile.businessInfo.externalReviews.facebook} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block text-blue-600 hover:text-blue-700 text-sm"
                        >
                          {t('profile.view.business.facebookReviews')}
                        </a>
                      )}
                      {typeof profile.businessInfo.externalReviews === 'string' && profile.businessInfo.externalReviews && (
                        <a 
                          href={profile.businessInfo.externalReviews} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block text-blue-600 hover:text-blue-700 text-sm"
                        >
                          {t('profile.view.business.otherReviews')}
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Відео */}
                {profile.businessInfo.videoUrl && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-neutral-900 mb-2">{t('profile.view.business.video')}</h3>
                    <div className="aspect-video rounded-lg overflow-hidden bg-neutral-100">
                      <iframe
                        src={profile.businessInfo.videoUrl}
                        className="w-full h-full"
                        allowFullScreen
                        title={t('profile.view.business.video')}
                      />
                    </div>
                  </div>
                )}

                {/* Контакти бізнесу */}
                {(profile.businessInfo.phone || profile.businessInfo.viber || profile.businessInfo.telegram || profile.businessInfo.email) && (
                  <div className="mb-4 p-3 bg-white/50 rounded-lg">
                    <h3 className="font-semibold text-neutral-900 mb-2">{t('profile.view.business.contacts')}</h3>
                    <div className="space-y-2">
                      {profile.businessInfo.phone && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Phone className="w-4 h-4 text-accent-600" />
                          <span>{profile.businessInfo.phone}</span>
                          {profile.businessInfo.viber && <span className="text-accent-600">(Viber)</span>}
                        </div>
                      )}
                      {profile.businessInfo.telegram && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Send className="w-4 h-4 text-accent-600" />
                          <span>{profile.businessInfo.telegram}</span>
                        </div>
                      )}
                      {profile.businessInfo.email && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Mail className="w-4 h-4 text-accent-600" />
                          <span>{profile.businessInfo.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Додаткова інформація */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-4 border-t border-accent-200">
                  {profile.businessInfo.yearFounded && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-accent-600">{profile.businessInfo.yearFounded}</p>
                      <p className="text-xs text-neutral-600">{t('profile.view.business.yearFounded')}</p>
                    </div>
                  )}
                  {profile.businessInfo.registrationType && (
                    <div className="text-center">
                      <p className="text-sm font-semibold text-neutral-900">{profile.businessInfo.registrationType}</p>
                      <p className="text-xs text-neutral-600">{t('profile.view.business.registrationType')}</p>
                    </div>
                  )}
                  {profile.businessInfo.hasCertificates && (
                    <div className="text-center">
                      <p className="text-2xl">✓</p>
                      <p className="text-xs text-neutral-600">{t('profile.view.business.hasCertificates')}</p>
                    </div>
                  )}
                </div>

                {/* Соціальні мережі бізнесу */}
                {profile.businessInfo.socialLinks && Object.keys(profile.businessInfo.socialLinks).length > 0 && (
                  <div className="mt-6 pt-6 border-t border-accent-200">
                    <h3 className="font-semibold text-neutral-900 mb-3">{t('profile.view.business.socialTitle')}</h3>
                    <div className="flex flex-wrap gap-3">
                      {profile.businessInfo.socialLinks.facebook && (
                        <a
                          href={profile.businessInfo.socialLinks.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors text-sm"
                        >
                          <Facebook className="w-4 h-4 mr-2" />
                          Facebook
                        </a>
                      )}
                      {profile.businessInfo.socialLinks.instagram && (
                        <a
                          href={profile.businessInfo.socialLinks.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center px-3 py-2 bg-pink-50 hover:bg-pink-100 text-pink-600 rounded-lg transition-colors text-sm"
                        >
                          <Instagram className="w-4 h-4 mr-2" />
                          Instagram
                        </a>
                      )}
                      {profile.businessInfo.socialLinks.telegram && (
                        <a
                          href={profile.businessInfo.socialLinks.telegram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-600 rounded-lg transition-colors text-sm"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Telegram
                        </a>
                      )}
                      {profile.businessInfo.socialLinks.website && (
                        <a
                          href={profile.businessInfo.socialLinks.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center px-3 py-2 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 rounded-lg transition-colors text-sm"
                        >
                          <Globe className="w-4 h-4 mr-2" />
                          {t('profile.view.business.website')}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Про мене */}
            {profile.bio && (
              <div className="bg-gradient-to-br from-white to-primary-50/20 rounded-2xl shadow-lg border border-neutral-100 p-6 md:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                    <span className="text-white text-2xl">👤</span>
                  </div>
                  <h2 className="text-2xl font-bold text-neutral-900">{t('profile.view.about.title')}</h2>
                </div>
                <div className="p-4 bg-white rounded-lg border border-neutral-100">
                  <p className="text-neutral-700 leading-relaxed whitespace-pre-line">{profile.bio}</p>
                </div>
              </div>
            )}

            {/* Соціальні мережі */}
            {profile.socialLinks && Object.keys(profile.socialLinks).length > 0 && (
              <div className="bg-gradient-to-br from-white to-accent-50/20 rounded-2xl shadow-lg border border-neutral-100 p-6 md:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center">
                    <span className="text-white text-2xl">🌐</span>
                  </div>
                  <h2 className="text-2xl font-bold text-neutral-900">{t('profile.view.about.socialTitle')}</h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  {profile.socialLinks.facebook && (
                    <a
                      href={profile.socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-5 py-3 bg-gradient-to-br from-blue-50 to-blue-100/50 hover:from-blue-100 hover:to-blue-200/50 text-blue-600 font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-blue-100"
                    >
                      <Facebook className="w-5 h-5 mr-2" />
                      Facebook
                    </a>
                  )}
                  {profile.socialLinks.instagram && (
                    <a
                      href={profile.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-5 py-3 bg-gradient-to-br from-pink-50 to-pink-100/50 hover:from-pink-100 hover:to-pink-200/50 text-pink-600 font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-pink-100"
                    >
                      <Instagram className="w-5 h-5 mr-2" />
                      Instagram
                    </a>
                  )}
                  {profile.socialLinks.linkedin && (
                    <a
                      href={profile.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-5 py-3 bg-gradient-to-br from-blue-50 to-blue-100/50 hover:from-blue-100 hover:to-blue-200/50 text-blue-700 font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-blue-100"
                    >
                      <Linkedin className="w-5 h-5 mr-2" />
                      LinkedIn
                    </a>
                  )}
                  {profile.socialLinks.telegram && (
                    <a
                      href={profile.socialLinks.telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-5 py-3 bg-gradient-to-br from-sky-50 to-sky-100/50 hover:from-sky-100 hover:to-sky-200/50 text-sky-600 font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-sky-100"
                    >
                      <Send className="w-5 h-5 mr-2" />
                      Telegram
                    </a>
                  )}
                  {profile.socialLinks.website && (
                    <a
                      href={profile.socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-5 py-3 bg-gradient-to-br from-neutral-50 to-neutral-100/50 hover:from-neutral-100 hover:to-neutral-200/50 text-neutral-700 font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-neutral-200"
                    >
                      <Globe className="w-5 h-5 mr-2" />
                      {t('profile.view.about.website')}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Послуги */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-neutral-900">
                  {t('profile.view.services.title')} {profile._count?.services > 0 && `(${profile._count.services})`}
                </h2>
                {isOwnProfile && (
                  <Link
                    href="/services/create"
                    className="flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t('profile.view.actions.add')}
                  </Link>
                )}
              </div>

              {profile.services && profile.services.length > 0 ? (
                <div className="space-y-4">
                  {profile.services.map((service: any) => (
                    <Link 
                      key={service.id} 
                      href={`/services/${service.id}`}
                      className="block border border-neutral-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 hover:border-primary-300 cursor-pointer"
                    >
                      <div className="flex flex-col sm:flex-row">
                        {/* Фото послуги */}
                        <div className="w-full sm:w-48 h-48 sm:h-auto flex-shrink-0">
                          <ServiceImage
                            src={service.imageUrl}
                            alt={service.title}
                            fallbackLetter={service.title?.slice(0,1) || 'S'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Контент */}
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-lg text-neutral-900 hover:text-primary-600 transition-colors">{service.title}</h3>
                            {service.category && (
                              <span className="text-sm font-medium text-neutral-500 flex-shrink-0 ml-2 bg-neutral-100 px-2 py-1 rounded">{translateCategory(service.category.name, locale)}</span>
                            )}
                          </div>
                          {service.description && (
                            <p className="text-neutral-600 mb-3 line-clamp-2">{service.description}</p>
                          )}
                          <div className="flex items-center justify-between">
                            {(service.priceFrom || service.priceTo) && (
                              <div className="text-primary-600 font-medium">
                                {service.priceFrom && service.priceTo ? (
                                  `${service.priceFrom} - ${service.priceTo} ${service.priceUnit || t('profile.view.services.defaultUnit')}`
                                ) : service.priceFrom ? (
                                  t('profile.view.services.priceFrom', { price: service.priceFrom, unit: service.priceUnit || t('profile.view.services.defaultUnit') })
                                ) : (
                                  t('profile.view.services.priceTo', { price: service.priceTo, unit: service.priceUnit || t('profile.view.services.defaultUnit') })
                                )}
                              </div>
                            )}
                            <div className="flex items-center text-sm text-neutral-500">
                              <MapPin className="w-4 h-4 mr-1" />
                              {service.city}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-500">
                  {isOwnProfile ? (
                    <div>
                      <p className="mb-4">{t('profile.view.services.emptyOwn')}</p>
                      <Link
                        href="/services/create"
                        className="inline-flex items-center px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        {t('profile.view.services.createFirst')}
                      </Link>
                    </div>
                  ) : (
                    <p>{t('profile.view.services.emptyOther')}</p>
                  )}
                </div>
              )}
            </div>

            {/* Відгуки */}
            {profile.reviewsReceived && profile.reviewsReceived.length > 0 && (
              <div className="bg-white rounded-2xl shadow-md p-6">
                <h2 className="text-2xl font-bold text-neutral-900 mb-6">
                  {t('profile.view.reviews.title')} ({profile.reviewsReceived.length})
                </h2>
                <div className="space-y-4">
                  {profile.reviewsReceived.map((review: any) => (
                    <div key={review.id} className="border-b border-neutral-200 last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-neutral-900">
                            {review.reviewer.firstName} {review.reviewer.lastName?.[0]}.
                          </span>
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating ? 'text-amber-400 fill-current' : 'text-neutral-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-neutral-500">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-neutral-700">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Бічна панель */}
          <div className="space-y-6 static">
            {/* Контакти */}
            <div className="bg-gradient-to-br from-white to-primary-50/30 rounded-2xl shadow-lg border border-neutral-100 p-6 static">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900">{t('profile.view.contacts.title')}</h3>
              </div>
              
              <div className="space-y-3 mb-6">
                {profile.phone && (
                  <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-neutral-100 hover:border-primary-200 transition-colors">
                    <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-4 h-4 text-primary-600" />
                    </div>
                    <span className="text-neutral-900 font-medium">{profile.phone}</span>
                  </div>
                )}
                {profile.email && !isOwnProfile && (
                  <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-neutral-100 hover:border-primary-200 transition-colors">
                    <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-primary-600" />
                    </div>
                    <span className="text-neutral-900 font-medium break-all">{profile.email}</span>
                  </div>
                )}
              </div>

              {!isOwnProfile && (
                <>
                  {currentUser?.accountType !== 'viewer' && (
                  <Link
                    href={`/chat?with=${profile.id}`}
                    className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg mb-3"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>{t('profile.view.actions.write')}</span>
                  </Link>
                  )}

                  {profile.phone && (
                    <a
                      href={`tel:${profile.phone}`}
                      className="flex items-center justify-center gap-2 w-full border-2 border-primary-500 text-primary-600 hover:bg-primary-50 font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <Phone className="w-5 h-5" />
                      <span>{t('profile.view.actions.call')}</span>
                    </a>
                  )}
                </>
              )}
            </div>

            {/* Інформація */}
            <div className="bg-gradient-to-br from-white to-accent-50/30 rounded-2xl shadow-lg border border-neutral-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl">ℹ️</span>
                </div>
                <h3 className="text-xl font-bold text-neutral-900">{t('profile.view.info.title')}</h3>
              </div>
              <div className="space-y-3">
                {/* Вік та стать */}
                {profile.age && (
                  <div className="p-3 bg-white rounded-lg border border-neutral-100">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide                     mb-1">{t('profile.view.info.age')}</p>
                                        <p className="font-medium text-neutral-900">{t('profile.view.header.years', { count: profile.age })}</p>
                  </div>
                )}
                {profile.gender && (
                  <div className="p-3 bg-white rounded-lg border border-neutral-100">
                                        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">{t('profile.view.info.gender')}</p>
                    <p className="font-medium text-neutral-900">
                                          {translateGender(profile.gender, locale)}
                    </p>
                  </div>
                )}

                {/* Сімейний стан */}
                {profile.maritalStatus && (
                  <div className="p-3 bg-white rounded-lg border border-neutral-100">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide                     mb-1">{t('profile.view.info.maritalStatus')}</p>
                    <p className="font-medium text-neutral-900">
                                          {translateMaritalStatus(profile.maritalStatus, locale)}
                    </p>
                  </div>
                )}

                {/* Склад сім'ї */}
                {profile.familyComposition && (
                  <div className="p-3 bg-white rounded-lg border border-neutral-100">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">{t('profile.view.info.familyComposition')}</p>
                    <p className="font-medium text-neutral-900">{profile.familyComposition}</p>
                  </div>
                )}

                {/* Діти */}
                {profile.childrenCount !== null && profile.childrenCount !== undefined && (
                  <div className="p-3 bg-white rounded-lg border border-neutral-100">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide                     mb-1">{t('profile.view.info.children')}</p>
                    <p className="font-medium text-neutral-900">
                                          {profile.childrenCount === 0 ? t('profile.view.info.noChildren') : t('profile.view.info.childrenCount', { count: profile.childrenCount })}
                    </p>
                  </div>
                )}

                {/* Професія */}
                {profile.profession && (
                  <div className="p-3 bg-white rounded-lg border border-neutral-100">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">{t('profile.view.info.profession')}</p>
                    <p className="font-medium text-neutral-900">{profile.profession}</p>
                  </div>
                )}

                {/* Статус зайнятості */}
                {profile.employmentStatus && (
                  <div className="p-3 bg-white rounded-lg border border-neutral-100">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide                     mb-1">{t('profile.view.info.employmentStatus')}</p>
                    <p className="font-medium text-neutral-900">
                                          {translateEmploymentStatus(profile.employmentStatus, locale)}
                    </p>
                  </div>
                )}

                {/* Місце роботи */}
                {profile.workplace && (
                  <div className="p-3 bg-white rounded-lg border border-neutral-100">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">{t('profile.view.info.workplace')}</p>
                    <p className="font-medium text-neutral-900">{profile.workplace}</p>
                  </div>
                )}

                {/* Освіта */}
                {profile.education && (
                  <div className="p-3 bg-white rounded-lg border border-neutral-100">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide                     mb-1">{t('profile.view.info.education')}</p>
                                        <p className="font-medium text-neutral-900">{translateEducation(profile.education, locale)}</p>
                  </div>
                )}

                {/* Тип житла */}
                {profile.housingType && (
                  <div className="p-3 bg-white rounded-lg border border-neutral-100">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide                     mb-1">{t('profile.view.info.housingType')}</p>
                    <p className="font-medium text-neutral-900">
                                          {translateHousingType(profile.housingType, locale)}
                    </p>
                  </div>
                )}

                {/* Ситуація з житлом */}
                {profile.livingSituation && (
                  <div className="p-3 bg-white rounded-lg border border-neutral-100">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide                     mb-1">{t('profile.view.info.livingSituation')}</p>
                                        <p className="font-medium text-neutral-900">{translateLivingSituation(profile.livingSituation, locale)}</p>
                  </div>
                )}

                {/* Транспорт */}
                {profile.hasCar !== null && (
                  <div className="p-3 bg-white rounded-lg border border-neutral-100">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide                     mb-1">{t('profile.view.info.car')}</p>
                    <p className="font-medium text-neutral-900">
                                          {profile.hasCar ? t('profile.view.info.hasCar') : t('profile.view.info.noCar')}
                    </p>
                  </div>
                )}

                {profile.carInfo && (
                  <div className="p-3 bg-white rounded-lg border border-neutral-100">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">{t('profile.view.info.carInfo')}</p>
                    <p className="font-medium text-neutral-900">{profile.carInfo}</p>
                  </div>
                )}

                {profile.otherTransport && (
                  <div className="p-3 bg-white rounded-lg border border-neutral-100">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">{t('profile.view.info.otherTransport')}</p>
                    <p className="font-medium text-neutral-900">{profile.otherTransport}</p>
                  </div>
                )}

                {/* Домашні тварини */}
                {profile.hasPets !== null && (
                  <div className="p-3 bg-white rounded-lg border border-neutral-100">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide                     mb-1">{t('profile.view.info.pets')}</p>
                    <p className="font-medium text-neutral-900">
                                          {profile.hasPets ? t('profile.view.info.hasPets') : t('profile.view.info.noPets')}
                    </p>
                  </div>
                )}

                {profile.petsInfo && (
                  <div className="p-3 bg-white rounded-lg border border-neutral-100">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">{t('profile.view.info.petsInfo')}</p>
                    <p className="font-medium text-neutral-900">{profile.petsInfo}</p>
                  </div>
                )}

                {/* Хобі та інтереси */}
                {profile.hobbies && (
                  <div className="p-3 bg-white rounded-lg border border-neutral-100">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">{t('profile.view.info.hobbies')}</p>
                    <p className="font-medium text-neutral-900 whitespace-pre-line">{profile.hobbies}</p>
                  </div>
                )}

                {profile.outdoorActivities && (
                  <div className="p-3 bg-white rounded-lg border border-neutral-100">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">{t('profile.view.info.outdoorActivities')}</p>
                    <p className="font-medium text-neutral-900 whitespace-pre-line">{profile.outdoorActivities}</p>
                  </div>
                )}

                {profile.sports && (
                  <div className="p-3 bg-white rounded-lg border border-neutral-100">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">{t('profile.view.info.sports')}</p>
                    <p className="font-medium text-neutral-900">{profile.sports}</p>
                  </div>
                )}

                {profile.lifestyle && (
                  <div className="p-3 bg-white rounded-lg border border-neutral-100">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">{t('profile.view.info.lifestyle')}</p>
                    <p className="font-medium text-neutral-900">{profile.lifestyle}</p>
                  </div>
                )}

                {/* Пошук роботи */}
                {profile.jobSeeking && (
                  <div className="p-3 bg-white rounded-lg border border-neutral-100">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">{t('profile.view.info.jobSeeking')}</p>
                    <p className="font-medium text-neutral-900">{profile.jobSeeking}</p>
                  </div>
                )}

                {/* Приватний бізнес */}
                {profile.privateBusinessInfo && (
                  <div className="p-3 bg-white rounded-lg border border-neutral-100">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">{t('profile.view.info.privateBusiness')}</p>
                    <p className="font-medium text-neutral-900 whitespace-pre-line">{profile.privateBusinessInfo}</p>
                  </div>
                )}

                {/* Дата реєстрації */}
                <div className="p-3 bg-gradient-to-br from-primary-50 to-accent-50 rounded-lg border border-primary-100">
                  <p className="text-xs font-semibold text-primary-600 uppercase tracking-wide                   mb-1">{t('profile.view.info.registered')}</p>
                  <p className="font-medium text-neutral-900">
                                      {formatDate(profile.createdAt, { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Особиста інформація */}
          <div className="bg-gradient-to-br from-white via-white to-primary-50/20 rounded-2xl shadow-lg border border-neutral-100 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white text-2xl">📋</span>
              </div>
              <h2 className="text-2xl font-bold text-neutral-900">{t('profile.view.personal.title')}</h2>
            </div>
            {/* Про себе */}
            {profile.bio && (
              <div className="mb-6 p-4 bg-white rounded-xl border border-neutral-100 shadow-sm">
                <p className="text-neutral-700 leading-relaxed whitespace-pre-line">{profile.bio}</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(profile.phone || profile.email) && (
                <div className="p-4 bg-white rounded-xl border border-neutral-100 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">{t('profile.view.personal.contacts')}</p>
                  <div className="space-y-1">
                    {profile.phone && (
                      <p className="font-medium text-neutral-900 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-primary-500" />
                        {profile.phone}
                      </p>
                    )}
                    {profile.email && (
                      <p className="font-medium text-neutral-900 flex items-center gap-2 break-all">
                        <Mail className="w-4 h-4 text-primary-500" />
                        {profile.email}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {(profile.gender || profile.age) && (
                <div className="p-4 bg-white rounded-xl border border-neutral-100 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide                   mb-2">{t('profile.view.personal.genderAge')}</p>
                                    <p className="font-medium text-neutral-900">{profile.gender ? translateGender(profile.gender, locale) : '—'}{profile.age ? ` • ${t('profile.view.header.years', { count: profile.age })}` : ''}</p>
                </div>
              )}
              {(profile.maritalStatus || profile.familyComposition) && (
                <div className="p-4 bg-white rounded-xl border border-neutral-100 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide                   mb-2">{t('profile.view.personal.maritalStatus')}</p>
                                    <p className="font-medium text-neutral-900">{profile.maritalStatus ? translateMaritalStatus(profile.maritalStatus, locale) : '—'}</p>
                  {profile.familyComposition && (
                    <p className="text-neutral-600 mt-2 text-sm">{profile.familyComposition}</p>
                  )}
                </div>
              )}
              {(profile.childrenCount !== null && profile.childrenCount !== undefined) && (
                <div className="p-4 bg-white rounded-xl border border-neutral-100 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide                   mb-2">{t('profile.view.personal.children')}</p>
                                    <p className="font-medium text-neutral-900">{profile.childrenCount === 0 ? t('profile.view.info.noChildren') : t('profile.view.info.childrenCount', { count: profile.childrenCount })}</p>
                </div>
              )}
              {(profile.city || profile.region) && (
                <div className="p-4 bg-white rounded-xl border border-neutral-100 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">{t('profile.view.personal.cityRegion')}</p>
                  <p className="font-medium text-neutral-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary-500" />
                    {profile.city || '—'}{profile.region ? `, ${profile.region}` : ''}
                  </p>
                </div>
              )}
              {(profile.education || profile.profession) && (
                <div className="p-4 bg-white rounded-xl border border-neutral-100 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide                   mb-2">{t('profile.view.personal.educationProfession')}</p>
                                    <p className="font-medium text-neutral-900">{profile.education ? translateEducation(profile.education, locale) : '—'}{profile.profession ? ` • ${profile.profession}` : ''}</p>
                </div>
              )}
              {(profile.employmentStatus || profile.workplace) && (
                <div className="p-4 bg-white rounded-xl border border-neutral-100 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide                   mb-2">{t('profile.view.personal.employment')}</p>
                                    <p className="font-medium text-neutral-900">{profile.employmentStatus ? translateEmploymentStatus(profile.employmentStatus, locale) : '—'}{profile.workplace ? ` • ${profile.workplace}` : ''}</p>
                </div>
              )}
              {(profile.hobbies || profile.sports || profile.lifestyle || profile.outdoorActivities) && (
                <div className="p-4 bg-gradient-to-br from-white to-primary-50/30 rounded-xl border border-primary-100 shadow-sm hover:shadow-md transition-shadow md:col-span-2">
                  <p className="text-xs font-semibold text-primary-600 uppercase tracking-wide mb-3">{t('profile.view.personal.interests')}</p>
                  <div className="space-y-2">
                    {profile.hobbies && (
                      <div className="flex items-start gap-2">
                        <span className="text-primary-500 mt-0.5">🎨</span>
                        <p className="text-neutral-900"><span className="font-semibold">{t('profile.view.personal.hobby')}</span> {profile.hobbies}</p>
                      </div>
                    )}
                    {profile.sports && (
                      <div className="flex items-start gap-2">
                        <span className="text-primary-500 mt-0.5">⚽</span>
                        <p className="text-neutral-900"><span className="font-semibold">{t('profile.view.personal.sport')}</span> {profile.sports}</p>
                      </div>
                    )}
                    {profile.lifestyle && (
                      <div className="flex items-start gap-2">
                        <span className="text-primary-500 mt-0.5">🌟</span>
                        <p className="text-neutral-900"><span className="font-semibold">{t('profile.view.personal.lifestyle')}</span> {profile.lifestyle}</p>
                      </div>
                    )}
                    {profile.outdoorActivities && (
                      <div className="flex items-start gap-2">
                        <span className="text-primary-500 mt-0.5">🏔️</span>
                        <p className="text-neutral-900"><span className="font-semibold">{t('profile.view.personal.outdoor')}</span> {profile.outdoorActivities}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Житло та транспорт */}
          {(profile.accountType !== 'basic' && asList(profile.carServices).length > 0) && (
            <div className="bg-gradient-to-br from-white to-accent-50/20 rounded-2xl shadow-lg border border-neutral-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl">🚗</span>
                </div>
                <h2 className="text-xl font-bold text-neutral-900">{t('profile.view.housing.title')}</h2>
              </div>
              {asList(profile.carServices).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide                   mb-3">{t('profile.view.housing.carServices')}</p>
                  <div className="flex flex-wrap gap-2">
                                      {asList(profile.carServices).map((item, i) => (
                                        <span key={i} className="px-4 py-2 rounded-full bg-white border border-neutral-200 text-neutral-800 text-sm font-medium shadow-sm hover:shadow-md transition-shadow">{item}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Пошук роботи / бізнесу */}
          {(profile.accountType !== 'basic' ? (profile.jobSeeking || profile.seekingPartTime || profile.seekingFullTime || profile.wantsStartBusiness) : false) && (
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-bold text-neutral-900               mb-4">{t('profile.view.job.title')}</h2>
              {profile.jobSeeking && (
                <div className="mb-3">
                                <p className="text-sm text-neutral-600">{t('profile.view.job.seekingField')}</p>
                  <p className="font-medium text-neutral-900">{profile.jobSeeking}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {profile.seekingPartTime !== null && profile.seekingPartTime !== undefined && (
                  <div className="p-3 bg-neutral-50 rounded-lg">
                    <p className="text-sm text-neutral-600">                    {t('profile.view.job.partTime')}</p>
                                        <p className="font-medium text-neutral-900">{translateBoolean(profile.seekingPartTime, locale)}</p>
                  </div>
                )}
                {profile.seekingFullTime !== null && profile.seekingFullTime !== undefined && (
                  <div className="p-3 bg-neutral-50 rounded-lg">
                    <p className="text-sm text-neutral-600">                    {t('profile.view.job.fullTime')}</p>
                                        <p className="font-medium text-neutral-900">{translateBoolean(profile.seekingFullTime, locale)}</p>
                  </div>
                )}
                {profile.wantsStartBusiness !== null && profile.wantsStartBusiness !== undefined && (
                  <div className="p-3 bg-neutral-50 rounded-lg">
                    <p className="text-sm text-neutral-600">                    {t('profile.view.job.startBusiness')}</p>
                                        <p className="font-medium text-neutral-900">{translateBoolean(profile.wantsStartBusiness, locale)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Переваги та використання сервісів - тільки для звичайних користувачів, не для бізнесу */}
          {(!profile.businessInfo && profile.accountType !== 'basic' && (profile.restaurantFrequency || profile.cuisinePreference || asList(profile.usesServices).length > 0 || asList(profile.usesBusinessServices).length > 0 || asList(profile.beautyServices).length > 0)) && (
            <div className="bg-gradient-to-br from-white to-primary-50/20 rounded-2xl shadow-lg border border-neutral-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl">⭐</span>
                </div>
                <h2 className="text-xl font-bold text-neutral-900">{t('profile.view.preferences.title')}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {profile.restaurantFrequency && (
                  <div className="p-4 bg-white rounded-xl border border-neutral-100 shadow-sm">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">{t('profile.view.preferences.restaurantFrequency')}</p>
                    <p className="font-medium text-neutral-900">{profile.restaurantFrequency}</p>
                  </div>
                )}
                {profile.cuisinePreference && (
                  <div className="p-4 bg-white rounded-xl border border-neutral-100 shadow-sm">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">{t('profile.view.preferences.cuisine')}</p>
                    <p className="font-medium text-neutral-900">{profile.cuisinePreference}</p>
                  </div>
                )}
              </div>
              {asList(profile.usesServices).length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide                   mb-3">{t('profile.view.preferences.homeServices')}</p>
                  <div className="flex flex-wrap gap-2">
                                      {asList(profile.usesServices).map((item, i) => (
                                        <span key={i} className="px-4 py-2 rounded-full bg-white border border-neutral-200 text-neutral-800 text-sm font-medium shadow-sm hover:shadow-md transition-shadow">{item}</span>
                    ))}
                  </div>
                </div>
              )}
              {asList(profile.usesBusinessServices).length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide                   mb-3">{t('profile.view.preferences.businessServices')}</p>
                  <div className="flex flex-wrap gap-2">
                                      {asList(profile.usesBusinessServices).map((item, i) => (
                                        <span key={i} className="px-4 py-2 rounded-full bg-white border border-neutral-200 text-neutral-800 text-sm font-medium shadow-sm hover:shadow-md transition-shadow">{item}</span>
                    ))}
                  </div>
                </div>
              )}
              {asList(profile.beautyServices).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide                   mb-3">{t('profile.view.preferences.beautyServices')}</p>
                  <div className="flex flex-wrap gap-2">
                                      {asList(profile.beautyServices).map((item, i) => (
                                        <span key={i} className="px-4 py-2 rounded-full bg-white border border-neutral-200 text-neutral-800 text-sm font-medium shadow-sm hover:shadow-md transition-shadow">{item}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CTA (видно на власному профілі з basic-типом) */}
          {isOwnProfile && profile.accountType === 'basic' && (
            <div className="bg-white rounded-2xl shadow-md p-6">
              <UpgradeAccountCTA currentType={profile.accountType} />
            </div>
          )}

          {/* Керування акаунтом */}
          {isOwnProfile && (
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">{t('profile.view.account.title')}</h2>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full inline-flex items-center justify-center px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  <LogOut className="w-5 h-5 mr-2 shrink-0" />
                  {loggingOut ? t('profile.view.actions.loggingOut') : t('profile.view.actions.logout')}
                </button>
                <Link
                  href="/favorites"
                  className="w-full inline-flex items-center justify-center px-5 py-3 border-2 border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-semibold rounded-lg transition-colors"
                >
                  <Heart className="w-5 h-5 mr-2 shrink-0" />
                  {t('profile.view.account.favorites')}
                </Link>
                <Link
                  href={localizedPath('/account-deletion', locale)}
                  className="text-center text-sm text-neutral-500 hover:text-red-600 transition-colors py-1"
                >
                  {t('profile.view.account.deleteAccount')}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
