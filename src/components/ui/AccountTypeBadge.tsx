interface AccountTypeBadgeProps {
  accountType: 'guest' | 'basic' | 'extended' | 'business' | 'business_premium';
  size?: 'sm' | 'md' | 'lg';
}

export function AccountTypeBadge({ accountType, size = 'md' }: AccountTypeBadgeProps) {
  const configs = {
    guest: {
      label: 'Гість',
      icon: '👀',
      colors: 'bg-gray-100 text-gray-700 border-gray-300'
    },
    basic: {
      label: 'Базовий',
      icon: '🆓',
      colors: 'bg-green-100 text-green-700 border-green-300'
    },
    extended: {
      label: 'Розширений',
      icon: '⭐',
      colors: 'bg-blue-100 text-blue-700 border-blue-300'
    },
    business: {
      label: 'Бізнес',
      icon: '🏢',
      colors: 'bg-purple-100 text-purple-700 border-purple-300'
    },
    business_premium: {
      label: 'Бізнес Преміум',
      icon: '👑',
      colors: 'bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-800 border-amber-300'
    }
  };

  const config = configs[accountType] || configs.basic;

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${config.colors} ${sizeClasses[size]}`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
