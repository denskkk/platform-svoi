/**
 * Налаштування користувача (один JSON у user_settings.data).
 * Особисті та бізнес-налаштування розділені: personal.* і business.*.
 * Невідомі ключі та значення поза межами відкидаються — клієнту не довіряємо.
 */
import { prisma } from '@/lib/prisma';

type Audience = 'everyone' | 'friends' | 'nobody';
const AUDIENCE: Audience[] = ['everyone', 'friends', 'nobody'];
const SCOPES = ['city', 'region', 'country', 'all'] as const;
const GENDERS = ['all', 'male', 'female'] as const;
const CONTACT = ['hidden', 'everyone'] as const;

export interface SettingsData {
  privacy: {
    privateAccount: boolean;
    comments: Audience;
    mentions: Audience;
    messages: Audience;
    showProfileOnLinkShare: boolean;
    showFollowing: 'everyone' | 'me';
    showLikedPosts: 'everyone' | 'me';
    allowDownloads: boolean;
    recordProfileViews: boolean; // чи зберігати мої заходи на чужі профілі
    showProfileViewers: boolean; // чи показувати мені, хто заходив до мене
  };
  contacts: { phone: (typeof CONTACT)[number]; email: (typeof CONTACT)[number] };
  feed: { scope: (typeof SCOPES)[number]; country: string; region: string; city: string; interests: string };
  business: {
    clientsCanWrite: boolean;
    targetGender: (typeof GENDERS)[number];
    targetAgeMin: number;
    targetAgeMax: number;
    targetCountry: string;
    targetRegion: string;
    promotePostsByDefault: boolean;
  };
  family: { enabled: boolean };
}

export const DEFAULT_SETTINGS: SettingsData = {
  privacy: {
    privateAccount: false, comments: 'everyone', mentions: 'everyone', messages: 'everyone',
    showProfileOnLinkShare: true, showFollowing: 'everyone', showLikedPosts: 'me', allowDownloads: true,
    recordProfileViews: true, showProfileViewers: true,
  },
  contacts: { phone: 'hidden', email: 'hidden' },
  feed: { scope: 'region', country: '', region: '', city: '', interests: '' },
  business: {
    clientsCanWrite: true, targetGender: 'all', targetAgeMin: 18, targetAgeMax: 99,
    targetCountry: '', targetRegion: '', promotePostsByDefault: false,
  },
  family: { enabled: false },
};

const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d);
const pick = <T extends string>(v: unknown, list: readonly T[], d: T): T => (list.includes(v as T) ? (v as T) : d);
const str = (v: unknown, d: string, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : d);
const num = (v: unknown, d: number, min: number, max: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : d;
};

/** Зводить будь-який вхід до повного коректного об'єкта, підставляючи значення із `base`. */
export function normalizeSettings(input: any, base: SettingsData = DEFAULT_SETTINGS): SettingsData {
  const p = input?.privacy ?? {}, c = input?.contacts ?? {}, f = input?.feed ?? {}, b = input?.business ?? {}, fam = input?.family ?? {};
  const bp = base.privacy, bb = base.business;
  const ageMin = num(b.targetAgeMin, bb.targetAgeMin, 13, 99);
  const ageMax = num(b.targetAgeMax, bb.targetAgeMax, 13, 99);
  return {
    privacy: {
      privateAccount: bool(p.privateAccount, bp.privateAccount),
      comments: pick(p.comments, AUDIENCE, bp.comments),
      mentions: pick(p.mentions, AUDIENCE, bp.mentions),
      messages: pick(p.messages, AUDIENCE, bp.messages),
      showProfileOnLinkShare: bool(p.showProfileOnLinkShare, bp.showProfileOnLinkShare),
      showFollowing: pick(p.showFollowing, ['everyone', 'me'] as const, bp.showFollowing),
      showLikedPosts: pick(p.showLikedPosts, ['everyone', 'me'] as const, bp.showLikedPosts),
      allowDownloads: bool(p.allowDownloads, bp.allowDownloads),
      recordProfileViews: bool(p.recordProfileViews, bp.recordProfileViews),
      showProfileViewers: bool(p.showProfileViewers, bp.showProfileViewers),
    },
    contacts: { phone: pick(c.phone, CONTACT, base.contacts.phone), email: pick(c.email, CONTACT, base.contacts.email) },
    feed: {
      scope: pick(f.scope, SCOPES, base.feed.scope),
      country: str(f.country, base.feed.country, 60),
      region: str(f.region, base.feed.region, 80),
      city: str(f.city, base.feed.city, 80),
      interests: str(f.interests, base.feed.interests, 300),
    },
    business: {
      clientsCanWrite: bool(b.clientsCanWrite, bb.clientsCanWrite),
      targetGender: pick(b.targetGender, GENDERS, bb.targetGender),
      targetAgeMin: Math.min(ageMin, ageMax),
      targetAgeMax: Math.max(ageMin, ageMax),
      targetCountry: str(b.targetCountry, bb.targetCountry, 60),
      targetRegion: str(b.targetRegion, bb.targetRegion, 80),
      promotePostsByDefault: bool(b.promotePostsByDefault, bb.promotePostsByDefault),
    },
    family: { enabled: bool(fam.enabled, base.family.enabled) },
  };
}

export async function getSettings(userId: number): Promise<SettingsData> {
  try {
    const row = await prisma.userSettings.findUnique({ where: { userId }, select: { data: true } });
    return normalizeSettings(row?.data ?? {});
  } catch {
    return DEFAULT_SETTINGS; // таблиці ще немає — працюємо зі значеннями за замовчуванням
  }
}

export async function saveSettings(userId: number, patch: any): Promise<SettingsData> {
  const current = await getSettings(userId);
  // Часткове оновлення: глибоко зливаємо патч поверх поточних значень
  const merged = normalizeSettings({
    privacy: { ...current.privacy, ...(patch?.privacy ?? {}) },
    contacts: { ...current.contacts, ...(patch?.contacts ?? {}) },
    feed: { ...current.feed, ...(patch?.feed ?? {}) },
    business: { ...current.business, ...(patch?.business ?? {}) },
    family: { ...current.family, ...(patch?.family ?? {}) },
  }, current);
  await prisma.userSettings.upsert({ where: { userId }, create: { userId, data: merged as any }, update: { data: merged as any } });
  return merged;
}

/** Дружба = взаємна підписка. */
async function areFriends(a: number, b: number): Promise<boolean> {
  const [x, y] = await Promise.all([
    prisma.follow.findUnique({ where: { followerId_followingId: { followerId: a, followingId: b } }, select: { id: true } }),
    prisma.follow.findUnique({ where: { followerId_followingId: { followerId: b, followingId: a } }, select: { id: true } }),
  ]);
  return !!x && !!y;
}

/** Чи дозволив власник `ownerId` взаємодію `kind` (коментар / згадка / особисте повідомлення) користувачу `viewerId`. */
export async function isAllowedByOwner(ownerId: number, viewerId: number, kind: 'comments' | 'mentions' | 'messages'): Promise<boolean> {
  if (ownerId === viewerId) return true;
  const s = await getSettings(ownerId);
  const audience = s.privacy[kind];
  if (audience === 'everyone') return true;
  if (audience === 'nobody') return false;
  return areFriends(ownerId, viewerId);
}

/** Чи може клієнт писати бізнесу (налаштування «Клієнти можуть писати мені»; лише для бізнес-акаунтів). */
export async function businessAcceptsMessages(ownerId: number): Promise<boolean> {
  const owner = await prisma.user.findUnique({ where: { id: ownerId }, select: { accountType: true } });
  if (owner?.accountType !== 'business') return true;
  return (await getSettings(ownerId)).business.clientsCanWrite;
}

/** Автори з приватним акаунтом, на яких `viewerId` не підписаний: їхні дописи йому не показуємо. */
export async function getPrivateAuthorIdsHiddenFrom(viewerId: number): Promise<number[]> {
  try {
    const priv = await prisma.userSettings.findMany({
      where: { data: { path: ['privacy', 'privateAccount'], equals: true }, userId: { not: viewerId } },
      select: { userId: true },
      take: 5000,
    });
    if (priv.length === 0) return [];
    const ids = priv.map((r: any) => r.userId as number);
    const followed = await prisma.follow.findMany({ where: { followerId: viewerId, followingId: { in: ids } }, select: { followingId: true } });
    const ok = new Set<number>(followed.map((f: any) => f.followingId as number));
    return ids.filter((id: number) => !ok.has(id));
  } catch {
    return []; // таблиці налаштувань ще немає
  }
}
