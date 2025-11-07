"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  User,
  Target,
  Crown,
  Sparkles,
  CheckCircle,
} from "lucide-react";

function BusinessRegistrationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPremium = searchParams?.get("premium") === "true";
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("basic");

  // Заборона прямого доступу: business реєстрація тільки через апгрейд з extended
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      alert('Спочатку потрібно створити Базовий акаунт, потім Розширений, і тільки після цього — Бізнес.');
      router.push('/auth/register/basic');
      return;
    }
    const user = JSON.parse(storedUser);
    if (user.accountType === 'basic') {
      alert('Спочатку покращіть акаунт до Розширеного, а потім до Бізнес.');
      router.push('/auth/upgrade');
    }
  }, [router]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    companyName: "",
    companyCode: "",
    city: "",
    businessCategory: "",
    companyType: "",
    offerType: "",
    description: "",
    website: "",
    seekingPartner: false,
    seekingInvestor: false,
    seekingCustomer: false,
    seekingEmployee: false,
    offerToCustomers: false,
    offerToPartners: false,
    offerToInvestors: false,
    wantsUCMAnalysis: false,
  });

  const cities = [
    "Київ",
    "Харків",
    "Одеса",
    "Дніпро",
    "Донецьк",
    "Запоріжжя",
    "Львів",
    "Кривий Ріг",
    "Миколаїв",
    "Маріуполь",
    "Вінниця",
    "Херсон",
    "Полтава",
    "Чернігів",
    "Черкаси",
    "Суми",
  ];

  const businessCategories = [
    { value: "education", label: "Освіта" },
    { value: "products", label: "Продукти харчування" },
    { value: "advertising", label: "Реклама та маркетинг" },
    { value: "online_sales", label: "Інтернет-продажі" },
    { value: "offline_sales", label: "Офлайн-торгівля" },
    { value: "auto_service", label: "СТО та автосервіс" },
    { value: "construction", label: "Будівництво та ремонт" },
    { value: "it", label: "IT та розробка" },
    { value: "other", label: "Інше" },
  ];

  const tabs = [
    { id: "basic", name: "Основне", icon: User },
    { id: "company", name: "Компанія", icon: Building2 },
    { id: "seeking", name: "Що шукаєте", icon: Target },
  ];

  if (isPremium) {
    tabs.push({ id: "premium", name: "Преміум", icon: Crown });
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Валідація
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.password
    ) {
      setError("Заповніть всі обов'язкові особисті дані");
      return;
    }

    if (!formData.companyName) {
      setError("Вкажіть назву компанії");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Паролі не співпадають");
      return;
    }

    if (formData.password.length < 6) {
      setError("Пароль повинен містити мінімум 6 символів");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register-business", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            password: formData.password,
            phone: formData.phone,
            city: formData.city,
            role: "business",
            accountType: isPremium ? "business_premium" : "business",
          },
          business: {
            companyName: formData.companyName,
            companyCode: formData.companyCode,
            city: formData.city,
            businessCategory: formData.businessCategory,
            companyType: formData.companyType,
            offerType: formData.offerType,
            description: formData.description,
            website: formData.website,
            seekingPartner: formData.seekingPartner,
            seekingInvestor: formData.seekingInvestor,
            seekingCustomer: formData.seekingCustomer,
            seekingEmployee: formData.seekingEmployee,
            offerToCustomers: isPremium ? formData.offerToCustomers : false,
            offerToPartners: isPremium ? formData.offerToPartners : false,
            offerToInvestors: isPremium ? formData.offerToInvestors : false,
            wantsUCMAnalysis: isPremium ? formData.wantsUCMAnalysis : false,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Помилка реєстрації");
      }

      // Зберегти користувача та токен
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      // Перенаправити на профіль
      router.push(`/profile/${data.user.id}`);
    } catch (err: any) {
      setError(err.message || "Помилка реєстрації");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          href="/auth/register"
          className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад до вибору типу
        </Link>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className={`${
            isPremium
              ? "bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600"
              : "bg-gradient-to-r from-orange-500 to-red-500"
          } px-8 py-6`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                {isPremium ? (
                  <Crown className="w-6 h-6 text-white" />
                ) : (
                  <Building2 className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                  {isPremium && <Sparkles className="w-6 h-6" />}
                  Бізнес {isPremium && "Преміум"} Акаунт
                </h1>
                <p className="text-white/90 mt-1">
                  {isPremium
                    ? "Максимальна видимість та можливості"
                    : "Для підприємців та компаній"}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="px-8 flex space-x-4 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    type="button"
                    className={`py-4 px-4 border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                      activeTab === tab.id
                        ? "border-orange-500 text-orange-600 font-medium"
                        : "border-transparent text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Tab: Basic */}
            {activeTab === "basic" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Дані представника компанії
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ім&apos;я *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Прізвище *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Телефон
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Пароль *
                    </label>
                    <input
                      type="password"
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Підтвердження паролю *
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Company */}
            {activeTab === "company" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Назва компанії *
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      required
                      value={formData.companyName}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="ТОВ 'Будівельна компанія'"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Код ЄДРПОУ
                    </label>
                    <input
                      type="text"
                      name="companyCode"
                      value={formData.companyCode}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="12345678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Місто діяльності
                    </label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">Оберіть місто</option>
                      {cities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Тип компанії
                    </label>
                    <select
                      name="companyType"
                      value={formData.companyType}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">Оберіть тип</option>
                      <option value="fop">ФОП</option>
                      <option value="tov">ТОВ</option>
                      <option value="other">Інше</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Категорія діяльності
                    </label>
                    <select
                      name="businessCategory"
                      value={formData.businessCategory}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">Оберіть категорію</option>
                      {businessCategories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Що пропонуєте?
                    </label>
                    <select
                      name="offerType"
                      value={formData.offerType}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">Оберіть</option>
                      <option value="service">Послуга</option>
                      <option value="product">Товар</option>
                      <option value="both">Послуги та товари</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Короткий опис
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                      placeholder="Що пропонує ваша компанія..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Веб-сайт
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="https://yourcompany.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Seeking */}
            {activeTab === "seeking" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Кого/що шукаєте?
                </h3>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      name="seekingPartner"
                      checked={formData.seekingPartner}
                      onChange={handleChange}
                      className="w-5 h-5 text-orange-600"
                    />
                    <div>
                      <div className="font-medium">Партнера</div>
                      <div className="text-sm text-gray-500">
                        Пошук ділових партнерів для співпраці
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      name="seekingInvestor"
                      checked={formData.seekingInvestor}
                      onChange={handleChange}
                      className="w-5 h-5 text-orange-600"
                    />
                    <div>
                      <div className="font-medium">Інвестора</div>
                      <div className="text-sm text-gray-500">
                        Залучення інвестицій для розвитку
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      name="seekingCustomer"
                      checked={formData.seekingCustomer}
                      onChange={handleChange}
                      className="w-5 h-5 text-orange-600"
                    />
                    <div>
                      <div className="font-medium">Споживача</div>
                      <div className="text-sm text-gray-500">
                        Розширення клієнтської бази
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      name="seekingEmployee"
                      checked={formData.seekingEmployee}
                      onChange={handleChange}
                      className="w-5 h-5 text-orange-600"
                    />
                    <div>
                      <div className="font-medium">Працівника</div>
                      <div className="text-sm text-gray-500">
                        Пошук співробітників у команду
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Tab: Premium */}
            {activeTab === "premium" && isPremium && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6 rounded-xl border-2 border-yellow-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Crown className="w-6 h-6 text-yellow-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Преміум можливості
                    </h3>
                  </div>
                  <p className="text-sm text-gray-700 mb-4">
                    Активуйте функції для максимальної видимості вашого бізнесу
                  </p>

                  <div className="space-y-3">
                    <label className="flex items-start gap-3 p-4 bg-white border border-yellow-300 rounded-lg hover:bg-yellow-50 cursor-pointer">
                      <input
                        type="checkbox"
                        name="offerToCustomers"
                        checked={formData.offerToCustomers}
                        onChange={handleChange}
                        className="w-5 h-5 text-yellow-600 mt-0.5"
                      />
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-yellow-600" />
                          Пропонувати споживачам
                        </div>
                        <div className="text-sm text-gray-600">
                          Система автоматично показуватиме вас потенційним
                          клієнтам
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-4 bg-white border border-yellow-300 rounded-lg hover:bg-yellow-50 cursor-pointer">
                      <input
                        type="checkbox"
                        name="offerToPartners"
                        checked={formData.offerToPartners}
                        onChange={handleChange}
                        className="w-5 h-5 text-yellow-600 mt-0.5"
                      />
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-yellow-600" />
                          Пропонувати партнерам
                        </div>
                        <div className="text-sm text-gray-600">
                          Знаходьте ділових партнерів автоматично
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-4 bg-white border border-yellow-300 rounded-lg hover:bg-yellow-50 cursor-pointer">
                      <input
                        type="checkbox"
                        name="offerToInvestors"
                        checked={formData.offerToInvestors}
                        onChange={handleChange}
                        className="w-5 h-5 text-yellow-600 mt-0.5"
                      />
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-yellow-600" />
                          Пропонувати інвесторам
                        </div>
                        <div className="text-sm text-gray-600">
                          Показувати ваш бізнес потенційним інвесторам
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-4 bg-white border border-yellow-300 rounded-lg hover:bg-yellow-50 cursor-pointer">
                      <input
                        type="checkbox"
                        name="wantsUCMAnalysis"
                        checked={formData.wantsUCMAnalysis}
                        onChange={handleChange}
                        className="w-5 h-5 text-yellow-600 mt-0.5"
                      />
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-yellow-600" />
                          Аналіз від команди УЦМ
                        </div>
                        <div className="text-sm text-gray-600">
                          Отримайте професійний аналіз та рекомендації для
                          покращення бізнесу
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Кнопки */}
            <div className="flex gap-4 pt-6 border-t border-gray-200 mt-8">
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 ${
                  isPremium
                    ? "bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 hover:from-yellow-500 hover:via-amber-600 hover:to-yellow-700"
                    : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                } text-white py-3 px-6 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
              >
                {loading ? "Реєструємо..." : "Зареєструватися"}
              </button>
              <Link
                href="/auth/register"
                className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-center"
              >
                Скасувати
              </Link>
            </div>

            {/* Login Link */}
            <div className="text-center pt-4">
              <p className="text-gray-600">
                Вже маєте акаунт?{" "}
                <Link
                  href="/auth/login"
                  className="text-orange-600 hover:text-orange-700 font-semibold"
                >
                  Увійти
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Info */}
        <div className={`mt-6 border rounded-xl p-4 ${
          isPremium
            ? "bg-yellow-50 border-yellow-200"
            : "bg-orange-50 border-orange-200"
        }`}>
          <p className={`text-sm ${isPremium ? "text-yellow-800" : "text-orange-800"}`}>
            {isPremium ? (
              <>
                � <strong>Бізнес Преміум:</strong> Автоматичні пропозиції,
                пріоритет у пошуку та аналіз від УЦМ. Максимальна видимість для
                вашого бізнесу!
              </>
            ) : (
              <>
                🏢 <strong>Бізнес акаунт:</strong> Пошук партнерів, інвесторів
                та споживачів. Завжди можна покращити до Преміум для
                автоматичних пропозицій!
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterBusinessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Завантаження...</p>
        </div>
      </div>
    }>
      <BusinessRegistrationForm />
    </Suspense>
  );
}
