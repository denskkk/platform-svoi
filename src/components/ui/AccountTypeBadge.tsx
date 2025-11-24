interface AccountTypeBadgeProps {
  accountType: 'guest' | 'basic' | 'extended' | 'business' | 'business_premium';
  size?: 'sm' | 'md' | 'lg';
}

export function AccountTypeBadge({ accountType, size = 'md' }: AccountTypeBadgeProps) {
  const configs = {
    guest: {
      label: 'Гість',
      icon: '👀',
      colors: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300 shadow-sm'
    },
    basic: {
      label: 'Базовий',
      icon: '🆓',
      colors: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-300 shadow-sm'
    },
    extended: {
      label: 'Розширений',
      icon: '⭐',
      colors: 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-300 shadow-md'
    },
    business: {
      label: 'Бізнес',
      icon: '🏢',
      colors: 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border-purple-300 shadow-md'
    },
    business_premium: {
      label: 'Бізнес Преміум',
      icon: '👑',
      colors: 'bg-gradient-to-r from-yellow-200 via-amber-200 to-yellow-200 text-amber-900 border-amber-400 shadow-lg animate-gradient'
    }
  };

  const config = configs[accountType] || configs.basic;

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-4 py-1.5',
    lg: 'text-base px-5 py-2'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 font-bold rounded-full border-2 ${config.colors} ${sizeClasses[size]} hover:scale-105 transition-transform duration-200`}>
      <span className="text-base">{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
