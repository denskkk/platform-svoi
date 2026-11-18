/** Спільні налаштування клубів: категорії (підписи — в clubs.categories.<key>) та ліміти. */
export const CLUB_CATEGORIES = ['fishing', 'auto', 'business', 'sport', 'travel', 'professional', 'other'] as const;
export type ClubCategory = (typeof CLUB_CATEGORIES)[number];
export const CLUB_LIMITS = { nameMax: 120, descriptionMax: 3000, pageSize: 20, maxOwnedPerUser: 5 } as const;

export function serializeClub(c: any, joined: boolean, viewerId: number) {
  return {
    id: c.id, name: c.name, description: c.description, category: c.category, city: c.city, imageUrl: c.imageUrl,
    membersCount: c.membersCount, joined, isOwner: c.ownerId === viewerId, createdAt: c.createdAt,
  };
}

