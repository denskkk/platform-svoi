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
  DollarSign, 
  MessageSquare, 
  Briefcase,
  CheckCircle,
  XCircle,
  Gift,
  Shield
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  city?: string;
  balanceUcm: number;
  ucmVerified?: boolean;
  isActive: boolean;
  createdAt: string;
  servicesCount: number;
  ucmSent: number;
  ucmReceived: number;
}

export default function AdminUsersManagePage() {
  const router = useRouter();
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  
  // Модальні вікна
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [grantAmount, setGrantAmount] = useState('');
  const [grantReason, setGrantReason] = useState('');
  const [grantDescription, setGrantDescription] = useState('');
  const [processing, setProcessing] = useState(false);

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
        throw new Error('Помилка завантаження користувачів');
      }

      const data = await response.json();
      setUsers(data.users);
      setTotalPages(data.pagination.totalPages);
    } catch (err: any) {
      console.error(err);
      toast.error('Помилка завантаження користувачів');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadUsers();
  };

  const handleGrantUCM = async () => {
    if (!selectedUser || !grantAmount || !grantReason) {
      toast.warning('Заповніть всі обов\'язкові поля');
      return;
    }

    const amount = parseFloat(grantAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.warning('Сума повинна бути більше 0');
      return;
    }

    setProcessing(true);

    try {
      const response = await fetch('/api/admin/grant-ucm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          targetUserId: selectedUser.id,
          amount,
          reason: grantReason,
          description: grantDescription
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Помилка видачі УЦМ');
      }

      const data = await response.json();
      toast.success(data.message);
      
      // Оновити список користувачів
      loadUsers();
      
      // Закрити модальне вікно
      setGrantModalOpen(false);
      setSelectedUser(null);
      setGrantAmount('');
      setGrantReason('');
      setGrantDescription('');
      
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleVerification = async (user: User) => {
    const newStatus = !user.ucmVerified;
    
    if (!confirm(`${newStatus ? 'Встановити' : 'Зняти'} статус "Перевірено УЦМ" для ${user.firstName} ${user.lastName}?`)) {
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
        throw new Error(data.error || 'Помилка оновлення статусу');
      }

      const data = await response.json();
      toast.success(data.message);
      
      // Оновити список
      loadUsers();
      
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const openGrantModal = (user: User) => {
    setSelectedUser(user);
    setGrantModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/20 to-neutral-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <button
          onClick={() => router.push('/admin')}
          className="inline-flex items-center text-neutral-600 hover:text-neutral-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Назад до адмін-панелі
        </button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2 flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary-500" />
            Управління користувачами
          </h1>
          <p className="text-neutral-600">
            Видача УЦМ, верифікація та детальна інформація
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Пошук по імені, email, місту..."
                className="w-full pl-10 pr-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-primary-500 focus:outline-none"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
            >
              Шукати
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
              <option value="createdAt">Дата реєстрації</option>
              <option value="balanceUcm">Баланс УЦМ</option>
              <option value="firstName">Ім'я</option>
              <option value="city">Місто</option>
            </select>

            <select
              value={order}
              onChange={(e) => {
                setOrder(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border-2 border-neutral-200 rounded-lg focus:border-primary-500 focus:outline-none"
            >
              <option value="desc">За спаданням</option>
              <option value="asc">За зростанням</option>
            </select>
          </div>
        </div>

        {/* Users List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-neutral-600">Завантаження...</div>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {users.map((user) => (
                <div key={user.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-primary-200">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* User Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                            {user.firstName} {user.lastName}
                            {user.ucmVerified && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                                <CheckCircle className="w-3 h-3" />
                                Перевірено УЦМ
                              </span>
                            )}
                          </h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-neutral-600">
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
                                {user.city}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-2xl font-bold text-amber-600">
                            {user.balanceUcm.toLocaleString()} уцм
                          </div>
                          <div className="text-xs text-neutral-500 mt-1">
                            Зареєстрований: {new Date(user.createdAt).toLocaleDateString('uk-UA')}
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 p-4 bg-neutral-50 rounded-lg">
                        <div className="text-center">
                          <div className="text-neutral-600 text-sm mb-1">Послуги</div>
                          <div className="text-lg font-bold flex items-center justify-center gap-1">
                            <Briefcase className="w-4 h-4 text-blue-500" />
                            {user.servicesCount}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-neutral-600 text-sm mb-1">Відправлено УЦМ</div>
                          <div className="text-lg font-bold flex items-center justify-center gap-1 text-red-600">
                            <DollarSign className="w-4 h-4" />
                            {user.ucmSent.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-neutral-600 text-sm mb-1">Отримано УЦМ</div>
                          <div className="text-lg font-bold flex items-center justify-center gap-1 text-green-600">
                            <DollarSign className="w-4 h-4" />
                            {user.ucmReceived.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex lg:flex-col gap-3 lg:w-48">
                      <button
                        onClick={() => openGrantModal(user)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
                      >
                        <Gift className="w-4 h-4" />
                        Видати УЦМ
                      </button>
                      
                      <button
                        onClick={() => handleToggleVerification(user)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                          user.ucmVerified
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {user.ucmVerified ? (
                          <>
                            <XCircle className="w-4 h-4" />
                            Зняти статус
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Верифікувати
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between bg-white rounded-2xl shadow-lg p-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Назад
              </button>

              <div className="text-neutral-600">
                Сторінка {page} з {totalPages}
              </div>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Вперед
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Grant UCM Modal */}
      {grantModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">
              Видати УЦМ
            </h2>
            
            <div className="mb-4">
              <div className="text-sm text-neutral-600 mb-2">Користувач:</div>
              <div className="font-medium">{selectedUser.firstName} {selectedUser.lastName}</div>
              <div className="text-sm text-neutral-500">{selectedUser.email}</div>
              <div className="text-sm text-amber-600 mt-1">
                Поточний баланс: {selectedUser.balanceUcm.toLocaleString()} уцм
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Сума УЦМ *
                </label>
                <input
                  type="number"
                  value={grantAmount}
                  onChange={(e) => setGrantAmount(e.target.value)}
                  min="1"
                  step="0.01"
                  className="w-full px-4 py-2 border-2 border-neutral-200 rounded-lg focus:border-primary-500 focus:outline-none"
                  placeholder="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Причина *
                </label>
                <select
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-neutral-200 rounded-lg focus:border-primary-500 focus:outline-none"
                >
                  <option value="">Оберіть причину</option>
                  <option value="admin_bonus">Бонус від адміністрації</option>
                  <option value="admin_compensation">Компенсація</option>
                  <option value="admin_reward">Винагорода</option>
                  <option value="admin_grant">Грант УЦМ</option>
                  <option value="admin_other">Інше</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Опис (необов'язково)
                </label>
                <textarea
                  value={grantDescription}
                  onChange={(e) => setGrantDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-neutral-200 rounded-lg focus:border-primary-500 focus:outline-none"
                  placeholder="Додаткова інформація..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setGrantModalOpen(false);
                  setSelectedUser(null);
                  setGrantAmount('');
                  setGrantReason('');
                  setGrantDescription('');
                }}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors disabled:opacity-50"
              >
                Скасувати
              </button>
              <button
                onClick={handleGrantUCM}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium disabled:opacity-50"
              >
                {processing ? 'Обробка...' : 'Видати'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
