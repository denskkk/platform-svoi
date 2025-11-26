'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Camera, X } from 'lucide-react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { usePermission } from '@/hooks/usePermission';
const CreateRequestModal = dynamic(() => import('@/components/requests/CreateRequestModal'), { ssr: false });
// Permission gating removed for service creation to allow basic users to create 1 уцм services

export default function CreateServicePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string>('');
  const [categories, setCategories] = useState<any[]>([]);
  const { hasAccess, errorMessage } = usePermission('CREATE_SERVICE');
  const [formData, setFormData] = useState({
    categoryId: '',
    title: '',
    description: '',
    priceFrom: '',
    priceTo: '',
    priceUnit: 'УЦМ',
    city: '',
    region: '',
    address: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openModal, setOpenModal] = useState(false);


  const cities = [
    'Київ', 'Харків', 'Одеса', 'Дніпро', 'Донецьк', 'Запоріжжя', 
    'Львів', 'Кривий Ріг', 'Миколаїв', 'Маріуполь', 'Вінниця', 
    'Херсон', 'Полтава', 'Чернігів', 'Черкаси', 'Суми'
  ];

  useEffect(() => {
    // Проверить авторизацию
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    // Не залогінений → реєстрація
    if (!storedUser || !storedToken) {
      router.push('/auth/register');
      return;
    }

    const userData = JSON.parse(storedUser);
    setUser(userData);
    setToken(storedToken);

    // If basic account: default price unit to 'уцм' but do not force the price
    try {
      if (userData && userData.accountType === 'basic') {
        setFormData(prev => ({ ...prev, priceUnit: 'уцм' }));
      }
    } catch {}
    
    // Установить город пользователя по умолчанию
    setFormData(prev => ({
      ...prev,
      city: userData.city || '',
    }));

    // If URL contains ?mode=request, open the request modal automatically
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const mode = params.get('mode');
        if (mode === 'request') setOpenModal(true);
      }
    } catch {}

    // Загрузить категории
    loadCategories();
  }, [router]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Файл занадто великий. Максимум 10MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setError('Будь ласка, оберіть зображення');
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;

  const formData = new FormData();
  formData.append('file', imageFile);
  formData.append('type', 'services');

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok && data.url) {
        // Повертаємо URL з cache-busting параметром для миттєвого відображення
        const urlWithTimestamp = `${data.url}?t=${Date.now()}`;
        return urlWithTimestamp;
      }
      
      throw new Error(data.error || 'Помилка завантаження фото');
    } catch (err: any) {
      console.error('Upload error:', err);
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.categoryId || !formData.title || !formData.city) {
      setError('Заповніть всі обов\'язкові поля');
      return;
    }

    setLoading(true);

    try {
  let imageUrl = null;
      
      // Завантажити фото якщо вибрано
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          categoryId: parseInt(formData.categoryId),
          title: formData.title,
          description: formData.description,
          // Зберігаємо оригінальний без cache-busting (API /upload вже оптимізував файл)
          imageUrl: imageUrl ? imageUrl.split('?')[0] : null,
          priceFrom: formData.priceFrom ? parseFloat(formData.priceFrom) : null,
          priceTo: formData.priceTo ? parseFloat(formData.priceTo) : null,
          priceUnit: formData.priceUnit,
          city: formData.city,
          region: formData.region || null,
          address: formData.address || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Помилка створення послуги');
      }

  // Примусово оновити профіль з cache-busting, щоб фото послуги з'явилось миттєво
  const redirectTs = Date.now();
  router.push(`/profile/${user.id}?t=${redirectTs}`);
    } catch (err: any) {
      setError(err.message || 'Помилка створення послуги');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-gray-600">Завантаження...</div>
      </div>
    );
  }

  

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link
            href={`/profile/${user.id}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад до профілю
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Створити послугу
            </h1>
            <p className="text-gray-600">
              Розкажіть про свою послугу або товар
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

            <form onSubmit={handleSubmit} className="space-y-6">
            {/* Категорія */}
            <div>
              <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-2">
                Категорія *
              </label>
              <select
                id="categoryId"
                name="categoryId"
                required
                value={formData.categoryId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Оберіть категорію</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Назва */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Назва послуги *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Наприклад: Ремонт квартир під ключ"
              />
            </div>

            {/* Опис */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Опис
              </label>
              <textarea
                id="description"
                name="description"
                rows={5}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Детальний опис послуги, ваш досвід, умови роботи..."
              />
            </div>

            {/* Фото послуги */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Фото послуги
              </label>
              
              {imagePreview ? (
                <div className="relative inline-block">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    width={640}
                    height={320}
                    unoptimized
                    className="w-full max-w-md h-48 object-cover rounded-lg border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-blue-500 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Camera className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="mb-2 text-sm text-gray-600">
                      <span className="font-semibold">Натисніть для вибору</span> або перетягніть
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, HEIC до 10MB</p>
                  </div>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Ціна */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="priceFrom" className="block text-sm font-medium text-gray-700 mb-2">
                  Ціна від
                </label>
                <input
                  type="number"
                  id="priceFrom"
                  name="priceFrom"
                  min="0"
                  step="0.01"
                  value={formData.priceFrom}
                  onChange={handleChange}
                  // Allow basic users to set their service price (creation fee may still apply)
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="100"
                />
              </div>
              <div>
                <label htmlFor="priceTo" className="block text-sm font-medium text-gray-700 mb-2">
                  Ціна до
                </label>
                <input
                  type="number"
                  id="priceTo"
                  name="priceTo"
                  min="0"
                  step="0.01"
                  value={formData.priceTo}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="5000"
                />
              </div>
              <div>
                <label htmlFor="priceUnit" className="block text-sm font-medium text-gray-700 mb-2">
                  Одиниця
                </label>
                <select
                  id="priceUnit"
                  name="priceUnit"
                  value={formData.priceUnit}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  // Allow selecting unit for all users
                >
                  <option value="УЦМ">УЦМ</option>
                  <option value="уцм">уцм</option>
                  <option value="УЦМ/год">УЦМ/год</option>
                  <option value="УЦМ/день">УЦМ/день</option>
                  <option value="УЦМ/м²">УЦМ/м²</option>
                  <option value="договірна">договірна</option>
                </select>
              </div>
            </div>

            {/* Локація */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  Місто *
                </label>
                <select
                  id="city"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Оберіть місто</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-2">
                  Область/Район
                </label>
                <input
                  type="text"
                  id="region"
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Наприклад: Шевченківський район"
                />
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Адреса (необов&apos;язково)
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Вулиця, будинок"
              />
            </div>

            {/* Кнопки */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Створюємо...' : 'Створити послугу'}
              </button>
              <Link
                href={`/profile/${user.id}`}
                className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors text-center"
              >
                Скасувати
              </Link>
            </div>
          </form>
          
        </div>
      </div>
    </div>
  );
}
