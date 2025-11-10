"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
} from "lucide-react";

export default function RegisterBasicPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    // Основна інформація
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",

    // Місто
    city: "",

    // Освіта
    educationLevel: "",
    educationDetails: "",

    // УЦМ
    ucmMember: "",
    ucmSupporter: "",

    // Статус роботи
    employmentStatus: "",
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

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
      setError("Заповніть всі обов'язкові поля");
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
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          accountType: "basic",
          role: "user",
          ucmMember: formData.ucmMember === "yes",
          ucmSupporter: formData.ucmSupporter === "yes",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Помилка реєстрації");
      }

      // Зберегти користувача та токен (з кеш-бастингом для аватара)
      if (data.user) {
        const ts = Date.now();
        const appendTs = (url?: string) => {
          if (!url) return url;
          try {
            const u = new URL(url, typeof window !== "undefined" ? window.location.origin : undefined);
            u.searchParams.set("t", String(ts));
            return u.pathname + (u.search ? `?${u.searchParams.toString()}` : "");
          } catch {
            // Якщо це відносний шлях без домену або некоректний URL
            const hasQuery = url.includes("?");
            return url + (hasQuery ? `&t=${ts}` : `?t=${ts}`);
          }
        };

        const userWithBustedImages = {
          ...data.user,
          avatarUrl: appendTs(data.user.avatarUrl),
        };

        localStorage.setItem("user", JSON.stringify(userWithBustedImages));
      }
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

  // Перенаправити на профіль з кеш-бастингом (щоб аватар одразу відобразився)
  const redirectTs = Date.now();
  router.push(`/profile/${data.user.id}?t=${redirectTs}`);
    } catch (err: any) {
      setError(err.message || "Помилка реєстрації");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <Link
          href="/auth/register"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад до вибору типу
        </Link>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Звичайний Акаунт
                </h1>
                <p className="text-blue-100 mt-1">Безкоштовна реєстрація</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* ПІБ */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                Особисті дані
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Іван"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    По батькові
                  </label>
                  <input
                    type="text"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Іванович"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Іваненко"
                  />
                </div>
              </div>
            </div>

            {/* Контакти */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-500" />
                Контактна інформація
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Електронна пошта *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ivan@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Номер телефону
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+380 XX XXX XX XX"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Мінімум 6 символів"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Повторіть пароль"
                  />
                </div>
              </div>
            </div>

            {/* Місто */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-500" />
                Місце проживання
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Місто проживання
                </label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Оберіть місто</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Освіта */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-500" />
                Освіта
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Рівень освіти
                  </label>
                  <select
                    name="educationLevel"
                    value={formData.educationLevel}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Оберіть рівень</option>
                    <option value="secondary">Середня</option>
                    <option value="college">Коледж</option>
                    <option value="bachelor">Бакалавр</option>
                    <option value="master">Магістр</option>
                    <option value="doctorate">Аспірантура</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Заклад та напрямок
                  </label>
                  <input
                    type="text"
                    name="educationDetails"
                    value={formData.educationDetails}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="КНУ ім. Шевченка, Економіка"
                  />
                </div>
              </div>
            </div>

            {/* УЦМ */}
            <div className="space-y-4 bg-blue-50 p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-900">
                Українська Цивільна Місія (УЦМ)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Участник команди УЦМ?
                  </label>
                  <select
                    name="ucmMember"
                    value={formData.ucmMember}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">Оберіть варіант</option>
                    <option value="yes">Так</option>
                    <option value="no">Ні</option>
                    <option value="planning">Планую стати</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Підтримуєте проєкти УЦМ?
                  </label>
                  <select
                    name="ucmSupporter"
                    value={formData.ucmSupporter}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">Оберіть варіант</option>
                    <option value="yes">Так</option>
                    <option value="no">Ні</option>
                    <option value="planning">Планую</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Статус роботи */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-500" />
                Професійна діяльність
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Працюєте?
                </label>
                <select
                  name="employmentStatus"
                  value={formData.employmentStatus}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Оберіть статус</option>
                  <option value="employed">Так (найманий працівник)</option>
                  <option value="unemployed">Ні (не працюю)</option>
                  <option value="business">Власник бізнесу</option>
                  <option value="self_employed">Сам на себе (фріланс)</option>
                  <option value="looking">В пошуку роботи</option>
                </select>
              </div>
            </div>

            {/* Кнопки */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Увійти
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800">
            💡 <strong>Підказка:</strong> Заповніть основну інформацію зараз, а
            детальний профіль можна буде доповнити пізніше. Ви завжди зможете
            покращити акаунт до <strong>Розширеного</strong> для отримання
            додаткових можливостей!
          </p>
        </div>
      </div>
    </div>
  );
}
