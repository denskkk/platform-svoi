'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, Newspaper, Store, Wallet } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { saveToken, saveUser } from '@/lib/client-auth';

const inputCls =
  'w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-[16px] text-neutral-900 placeholder:text-neutral-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200';

/**
 * Єдина проста реєстрація (як у соцмережах): ім'я, прізвище, пошта, пароль.
 * Решту (місто, інтереси, бізнес-профіль, організація) людина додає пізніше в профілі.
 */
/** Код запрошення: з адреси (?ref=) або збережений після переходу по посиланню/QR. */
function readInviteRef(): string | undefined {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('ref');
    const code = fromUrl || localStorage.getItem('svoi_ref');
    return code ? code.slice(0, 16) : undefined;
  } catch { return undefined; }
}

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim();
    if (!firstName || !lastName || !email || !form.password) { setError(t('auth.register.simple.errors.required')); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError(t('auth.register.simple.errors.email')); return; }
    if (form.password.length < 6) { setError(t('auth.register.simple.errors.password')); return; }

    setLoading(true);
    try {
      let res: Response;
      try {
        res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ firstName, lastName, email, password: form.password, accountType: 'basic', ref: readInviteRef() }),
        });
      } catch {
        throw new Error(t('auth.register.simple.errors.network'));
      }
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.user) throw new Error(data?.error || t('auth.register.simple.errors.failed'));

      saveUser(data.user);
      if (data.token) saveToken(data.token);
      window.dispatchEvent(new Event('auth:changed'));
      router.push('/feed');
    } catch (err: any) {
      setError(err?.message || t('auth.register.simple.errors.failed'));
    } finally {
      setLoading(false);
    }
  };

  const perks = [
    { icon: Newspaper, text: t('auth.register.simple.perks.people') },
    { icon: Store, text: t('auth.register.simple.perks.business') },
    { icon: Wallet, text: t('auth.register.simple.perks.earn') },
  ];

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
        <div className="text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-extrabold text-primary-600">{t('auth.register.simple.heroTitle')}</h1>
          <p className="mt-3 text-lg md:text-2xl text-neutral-800">{t('auth.register.simple.heroText')}</p>
          <ul className="mt-6 hidden md:block space-y-3">
            {perks.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-neutral-700">
                <span className="h-9 w-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center"><Icon className="w-5 h-5" /></span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={submit} noValidate className="bg-white rounded-xl shadow-lg p-5 sm:p-6 space-y-3">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">{t('auth.register.simple.formTitle')}</h2>
            <p className="text-sm text-neutral-500">{t('auth.register.simple.formSubtitle')}</p>
          </div>
          <hr className="border-neutral-200" />

          <div className="grid grid-cols-2 gap-3">
            <input className={inputCls} placeholder={t('auth.register.simple.firstName')} aria-label={t('auth.register.simple.firstName')} autoComplete="given-name" value={form.firstName} onChange={set('firstName')} maxLength={50} />
            <input className={inputCls} placeholder={t('auth.register.simple.lastName')} aria-label={t('auth.register.simple.lastName')} autoComplete="family-name" value={form.lastName} onChange={set('lastName')} maxLength={50} />
          </div>
          <input className={inputCls} type="email" inputMode="email" autoCapitalize="none" placeholder={t('auth.register.simple.email')} aria-label={t('auth.register.simple.email')} autoComplete="email" value={form.email} onChange={set('email')} maxLength={120} />
          <div className="relative">
            <input className={`${inputCls} pr-12`} type={showPassword ? 'text' : 'password'} placeholder={t('auth.register.simple.password')} aria-label={t('auth.register.simple.password')} autoComplete="new-password" value={form.password} onChange={set('password')} maxLength={100} />
            <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? t('auth.register.simple.hidePassword') : t('auth.register.simple.showPassword')} className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100">
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <p className="text-xs text-neutral-500 leading-relaxed">
            {t('auth.register.simple.agreePrefix')}{' '}
            <Link href="/terms-of-use" className="text-primary-700 hover:underline">{t('auth.register.simple.terms')}</Link>{' '}
            {t('auth.register.simple.and')}{' '}
            <Link href="/privacy" className="text-primary-700 hover:underline">{t('auth.register.simple.privacy')}</Link>.
          </p>

          {error && <p role="alert" className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">{error}</p>}

          <button type="submit" disabled={loading} className="w-full rounded-lg bg-primary-500 hover:bg-primary-600 disabled:opacity-70 text-white text-lg font-bold py-3 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? t('auth.register.simple.submitting') : t('auth.register.simple.submit')}
          </button>

          <p className="text-center text-sm text-neutral-600 pt-1">
            {t('auth.register.simple.haveAccount')}{' '}
            <Link href="/auth/login" className="text-primary-700 font-semibold hover:underline">{t('auth.register.simple.signIn')}</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
