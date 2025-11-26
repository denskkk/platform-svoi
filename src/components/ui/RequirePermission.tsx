/**
 * Компонент для обмеження доступу до функцій
 */

'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePermission } from '@/hooks/usePermission';
import { PERMISSIONS } from '@/lib/permissions';
import { Lock, Crown, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface RequirePermissionProps {
  permission: keyof typeof PERMISSIONS;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradeButton?: boolean;
}

/**
 * Компонент що показує контент тільки якщо є права
 */
export function RequirePermission({ 
  permission, 
  children, 
  fallback,
  showUpgradeButton = true 
}: RequirePermissionProps) {
  const { hasAccess, errorMessage, loading } = usePermission(permission);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="bg-gradient-to-br from-neutral-50 to-blue-50 border-2 border-neutral-200 rounded-xl p-6 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-4">
        <Lock className="w-8 h-8 text-blue-600" />
      </div>
      <h3 className="text-lg font-bold text-neutral-900 mb-2">
        Функція недоступна
      </h3>
      <p className="text-neutral-600 mb-4">
        {errorMessage}
      </p>
      {showUpgradeButton && (
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:shadow-lg hover:scale-105"
        >
          <Crown className="w-5 h-5" />
          <span>Оновити план</span>
        </Link>
      )}
    </div>
  );
}

/**
 * Кнопка яка блокується якщо немає прав
 */
interface PermissionButtonProps {
  permission: keyof typeof PERMISSIONS;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function PermissionButton({ 
  permission, 
  onClick, 
  children, 
  className = '',
  disabled = false
}: PermissionButtonProps) {
  const { hasAccess, errorMessage } = usePermission(permission);
  const toast = useToast();

  const handleClick = () => {
    if (!hasAccess) {
      toast.warning(errorMessage || 'Доступ заборонено');
      return;
    }
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || !hasAccess}
      className={`${className} ${!hasAccess ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={!hasAccess ? errorMessage || undefined : undefined}
    >
      {!hasAccess && <Lock className="w-4 h-4 mr-2 inline" />}
      {children}
    </button>
  );
}

/**
 * Бейдж преміум функції
 */
export function PremiumBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-800 text-xs font-semibold rounded-full border border-amber-300 ${className}`}>
      <Crown className="w-3 h-3" />
      <span>Преміум</span>
    </span>
  );
}

/**
 * Бейдж бізнес функції
 */
export function BusinessBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full border border-purple-300 ${className}`}>
      <Sparkles className="w-3 h-3" />
      <span>Бізнес</span>
    </span>
  );
}
