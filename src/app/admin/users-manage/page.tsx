'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Search,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  CheckCircle,
  XCircle,
  Shield
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { getCityName } from '@/lib/constants';

const DATE_OPTIONS: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  city?: string;
  isVerified?: boolean;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string | null;
  servicesCount: number;
}

export default function AdminUsersManagePage() {
  const router = useRouter();
  const { t, locale, formatDate } = useI18n();
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/auth/login');
      return;
    }

    const user = JSON.parse(storedUser);
    if (!user.isAdmin) {
      router.push('/auth/login');
      return;
    }

    loadUsers();
  }, [page, sortBy, order, router]);

  const loadUsers = async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search,
        sortBy,
        order
      });

      const response = await fetch(`/api/admin/users?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(t('admin.users.loadError'));
      }

      const data = await response.json();
      setUsers(data.users);
      setTotalPages(data.pagination.totalPages);
    } catch (err: any) {
      console.error(err);
      toast.error(t('admin.users.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadUsers();
  };

  const handleToggleVerification = async (user: User) => {
    const newStatus = !user.isVerified;

    const name = `${user.firstName} ${user.lastName}`;
    if (!confirm(t(newStatus ? 'admin.users.confirmVerify' : 'admin.users.confirmUnverify', { name }))) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${user.id}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ verified: newStatus })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t('admin.users.updateError'));
      }

      const data = await response.json();
      toast.success(data.message);

      loadUsers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/20 to-neutral-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => router.push('/admin')}
          className="inline-flex items-center text-neutral-600 hover:text-neutral-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t('admin.common.backToAdmin')}
        </button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2 flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary-500" />
            {t('admin.users.title')}
          </h1>
          <p className="text-neutral-600">
            {t('admin.users.subtitle')}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={t('admin.users.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-primary-500 focus:outline-none"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
            >
              {t('admin.users.search')}
            </button>
          </div>

          <div className="mt-4 flex gap-4">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border-2 border-neutral-200 rounded-lg focus:border-primary-500 focus:outline-none"
            >
              <option value="createdAt">{t('admin.users.sort.createdAt')}</option>
              <option value="firstName">{t('admin.users.sort.firstName')}</option>
              <option value="city">{t('admin.users.sort.city')}</option>
            </select>

            <select
              value={order}
              onChange={(e) => {
                setOrder(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border-2 border-neutral-200 rounded-lg focus:border-primary-500 focus:outline-none"
            >
              <option value="desc">{t('admin.users.order.desc')}</option>
              <option value="asc">{t('admin.users.order.asc')}</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-neutral-600">{t('admin.common.loading')}</div>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {users.map((user) => (
                <div key={user.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-primary-200">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-2 flex-wrap">
                            {user.firstName} {user.lastName}
                            {user.isVerified && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                                <CheckCircle className="w-3 h-3" />
                                {t('admin.users.verified')}
                              </span>
                            )}
                          </h3>
                          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-neutral-600">
                            <span className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              {user.email}
                            </span>
                            {user.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                {user.phone}
                              </span>
                            )}
                            {user.city && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {getCityName(user.city, locale)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right text-xs text-neutral-500">
                          <div>
                            {t('admin.users.registered', { date: formatDate(user.createdAt, DATE_OPTIONS) })}
                          </div>
                          {user.lastLogin && (
                            <div className="mt-1">
                              {t('admin.users.lastLogin', { date: formatDate(user.lastLogin, DATE_OPTIONS) })}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 p-4 bg-neutral-50 rounded-lg">
                        <div className="text-center">
                          <div className="text-neutral-600 text-sm mb-1">{t('admin.users.services')}</div>
                          <div className="text-lg font-bold flex items-center justify-center gap-1">
                            <Briefcase className="w-4 h-4 text-blue-500" />
                            {user.servicesCount}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex lg:flex-col gap-3 lg:w-48">
                      <button
                        onClick={() => handleToggleVerification(user)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                          user.isVerified
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {user.isVerified ? (
                          <>
                            <XCircle className="w-4 h-4" />
                            {t('admin.users.unverify')}
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            {t('admin.users.verify')}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between bg-white rounded-2xl shadow-lg p-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                {t('admin.common.previous')}
              </button>

              <div className="text-neutral-600">
                {t('admin.users.pageOf', { page, total: totalPages })}
              </div>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('admin.common.next')}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
