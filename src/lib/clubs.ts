/** Спільні налаштування клубів: категорії (підписи — в clubs.categories.<key>) та ліміти. */
export const CLUB_CATEGORIES = ['fishing', 'hunting', 'knitting', 'creativity', 'travel', 'sport', 'auto', 'business', 'professional', 'bloggers', 'streamers', 'gamers', 'other'] as const;
/** Іконки категорій для кубиків */
export const CLUB_ICONS: Record<string, string> = { fishing: '🎣', hunting: '🦌', knitting: '🧶', creativity: '🎨', travel: '🧭', sport: '⚽', auto: '🚗', business: '💼', professional: '🎓', bloggers: '📱', streamers: '🎥', gamers: '🎮', other: '✨' };
export type ClubCategory = (typeof CLUB_CATEGORIES)[number];
export const CLUB_LIMITS = { nameMax: 120, descriptionMax: 3000, pageSize: 20, maxOwnedPerUser: 5 } as const;

export function serializeClub(c: any, joined: boolean, viewerId: number, membership?: { status: string; canWrite: boolean } | null) {
  const isOwner = c.ownerId === viewerId;
  const active = isOwner || membership?.status === 'active';
  return {
    joinMode: c.joinMode ?? 'open', postMode: c.postMode ?? 'owner', visibility: c.visibility ?? 'public',
    membership: isOwner ? 'active' : (membership?.status ?? null),
    canPost: isOwner || (active && ((c.postMode ?? 'owner') === 'members' || !!membership?.canWrite)),
    canSeeBoard: (c.visibility ?? 'public') === 'public' || active,
    id: c.id, name: c.name, description: c.description, category: c.category, city: c.city, imageUrl: c.imageUrl,
    membersCount: c.membersCount, joined: active, isOwner, createdAt: c.createdAt,
  };
}


export const CLUB_JOIN_MODES = ['open', 'approval'] as const;
export const CLUB_POST_MODES = ['owner', 'members'] as const;
export const CLUB_VISIBILITIES = ['public', 'members'] as const;
