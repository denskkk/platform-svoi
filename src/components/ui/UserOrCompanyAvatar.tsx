'use client';

import React from 'react';
import { UserAvatar } from './UserAvatar';

interface BusinessInfo {
  companyName?: string | null;
  logoUrl?: string | null;
}

interface UserLike {
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  businessInfo?: BusinessInfo | null;
}

interface Props {
  user: UserLike | null | undefined;
  className?: string;
}

export function UserOrCompanyAvatar({ user, className = '' }: Props) {
  const displayImage = user?.businessInfo?.logoUrl || user?.avatarUrl || null;
  const displayName = (user?.businessInfo?.companyName || `${user?.firstName || ''} ${user?.lastName || ''}`).trim();

  return (
    <UserAvatar
      src={displayImage}
      alt={displayName || 'user'}
      className={className}
      fallbackName={displayName || 'User'}
    />
  );
}
