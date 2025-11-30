import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'premium'
export type BadgeSize = 'sm' | 'md' | 'lg'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  icon?: LucideIcon
  pulse?: boolean
  className?: string
}

export function Badge({ 
  children, 
  variant = 'default',
  size = 'md',
  icon: Icon,
  pulse = false,
  className = '',
}: BadgeProps) {
  const variants = {
    default: 'bg-neutral-100 text-neutral-700 border-neutral-200',
    primary: 'bg-gradient-to-r from-primary-100 to-accent-100 text-primary-700 border-primary-200',
    success: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200',
    warning: 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 border-yellow-200',
    error: 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border-red-200',
    info: 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-200',
    premium: 'bg-gradient-to-r from-amber-400 to-yellow-400 text-white border-yellow-500 shadow-lg',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold border transition-all duration-300 hover:scale-105',
        variants[variant],
        sizes[size],
        pulse && 'animate-pulse',
        className
      )}
    >
      {Icon && <Icon className={`${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />}
      {children}
    </span>
  )
}

// Бейдж зі статусом
export function StatusBadge({ status }: { status: 'active' | 'pending' | 'completed' | 'cancelled' }) {
  const statusConfig = {
    active: { variant: 'success' as BadgeVariant, label: 'Активно', pulse: true },
    pending: { variant: 'warning' as BadgeVariant, label: 'В очікуванні', pulse: false },
    completed: { variant: 'info' as BadgeVariant, label: 'Завершено', pulse: false },
    cancelled: { variant: 'error' as BadgeVariant, label: 'Скасовано', pulse: false },
  }

  const config = statusConfig[status]

  return (
    <Badge variant={config.variant} pulse={config.pulse}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {config.label}
    </Badge>
  )
}

// Бейдж для типу користувача
export function UserTypeBadge({ type }: { type: 'CONSUMER' | 'BUSINESS' | 'PREMIUM' }) {
  const typeConfig = {
    CONSUMER: { variant: 'default' as BadgeVariant, label: '👤 Споживач' },
    BUSINESS: { variant: 'primary' as BadgeVariant, label: '💼 Бізнес' },
    PREMIUM: { variant: 'premium' as BadgeVariant, label: '⭐ Преміум' },
  }

  const config = typeConfig[type]

  return <Badge variant={config.variant} size="sm">{config.label}</Badge>
}

// Бейдж для категорії
export function CategoryBadge({ category, emoji }: { category: string; emoji?: string }) {
  return (
    <Badge variant="primary" size="sm">
      {emoji && <span>{emoji}</span>}
      {category}
    </Badge>
  )
}

// Бейдж з анімацією пульсації
export function PulseBadge({ children }: { children: React.ReactNode }) {
  return (
    <Badge variant="error">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
      </span>
      {children}
    </Badge>
  )
}
