/**
 * Серверна логіка оголошень: валідація, фільтри каталогу, серіалізація.
 */

import type { Prisma } from '@prisma/client';
import { CURRENCIES, fieldsFor, LISTING_LIMITS, ListingField } from '@/lib/listingFields';

export const listingInclude = {
  images: { orderBy: { position: 'asc' as const }, select: { id: true, url: true } },
  owner: {
    select: {
      id: true, firstName: true, lastName: true, avatarUrl: true, isVerified: true,
      businessInfo: { select: { companyName: true, logoUrl: true } },
    },
  },
} as const;

/** Фото оголошень — лише з наших завантажень. */
export function isOwnListingImage(url: unknown): url is string {
  return typeof url === 'string' && /^\/uploads\/listings\/[A-Za-z0-9._-]+\.(webp|jpg)$/.test(url);
}

export interface ListingInput {
  title: string;
  description: string;
  price: number | null;
  currency: string;
  city: string | null;
  contactName: string | null;
  phone: string | null;
  data: Record<string, string | number>;
  images: string[];
}

export type ValidationResult = { ok: true; value: ListingInput } | { ok: false; error: string; field?: string };

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  return v.length > 0 && v.length <= max ? v : null;
}

/** Перевіряє тіло запиту за конфігурацією проєкту. error — ключ перекладу в api.listings.* */
export function validateListing(slug: string, body: any): ValidationResult {
  const title = cleanText(body?.title, LISTING_LIMITS.titleMax);
  if (!title) return { ok: false, error: 'titleInvalid', field: 'title' };

  const description = cleanText(body?.description, LISTING_LIMITS.descriptionMax);
  if (!description) return { ok: false, error: 'descriptionInvalid', field: 'description' };

  let price: number | null = null;
  if (body?.price !== undefined && body?.price !== null && body?.price !== '') {
    price = Number(body.price);
    if (!Number.isFinite(price) || price < 0 || price > 1_000_000_000_000) return { ok: false, error: 'priceInvalid', field: 'price' };
  }
  const currency = String(body?.currency || 'UAH').toUpperCase();
  if (!(CURRENCIES as readonly string[]).includes(currency)) return { ok: false, error: 'currencyInvalid', field: 'currency' };

  const city = body?.city ? cleanText(body.city, 100) : null;
  if (!city) return { ok: false, error: 'cityRequired', field: 'city' };

  const phone = body?.phone ? cleanText(body.phone, 30) : null;
  if (phone && !/^[+0-9()\-\s]{5,30}$/.test(phone)) return { ok: false, error: 'phoneInvalid', field: 'phone' };
  const contactName = body?.contactName ? cleanText(body.contactName, 100) : null;

  const data: Record<string, string | number> = {};
  const input = body?.data && typeof body.data === 'object' ? body.data : {};
  for (const field of fieldsFor(slug)) {
    const raw = input[field.key];
    const empty = raw === undefined || raw === null || raw === '';
    if (empty) {
      if (field.required) return { ok: false, error: 'fieldRequired', field: field.key };
      continue;
    }
    const checked = checkField(field, raw);
    if (checked === null) return { ok: false, error: 'fieldInvalid', field: field.key };
    data[field.key] = checked;
    if (field.type === 'text') data[`${field.key}_l`] = String(checked).toLowerCase();
  }

  const images: unknown[] = Array.isArray(body?.images) ? body.images : [];
  if (images.length > LISTING_LIMITS.maxImages) return { ok: false, error: 'tooManyImages', field: 'images' };
  if (!images.every(isOwnListingImage)) return { ok: false, error: 'imageInvalid', field: 'images' };

  return { ok: true, value: { title, description, price, currency, city, contactName, phone, data, images: images as string[] } };
}

function checkField(field: ListingField, raw: unknown): string | number | null {
  if (field.type === 'number') {
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    if (field.min !== undefined && n < field.min) return null;
    if (field.max !== undefined && n > field.max) return null;
    return n;
  }
  if (field.type === 'select') {
    return typeof raw === 'string' && field.options?.includes(raw) ? raw : null;
  }
  return cleanText(raw, field.maxLength ?? 100);
}

/** Збирає умови Prisma для каталогу з query-параметрів (q, city, priceMin/Max, f_<key>, f_<key>_min/max). */
export function buildCatalogWhere(slug: string, params: URLSearchParams): Prisma.ListingWhereInput {
  const and: Prisma.ListingWhereInput[] = [];

  const q = params.get('q')?.trim();
  if (q) and.push({ OR: [{ title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }] });

  const city = params.get('city')?.trim();
  if (city) and.push({ city: { contains: city, mode: 'insensitive' } });

  const num = (name: string) => {
    const v = params.get(name);
    if (v === null || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const priceMin = num('priceMin');
  const priceMax = num('priceMax');
  if (priceMin !== null) and.push({ price: { gte: priceMin } });
  if (priceMax !== null) and.push({ price: { lte: priceMax } });

  for (const field of fieldsFor(slug)) {
    if (field.filter === 'select') {
      const v = params.get(`f_${field.key}`);
      if (v && field.options?.includes(v)) and.push({ data: { path: [field.key], equals: v } });
    } else if (field.filter === 'text') {
      const v = params.get(`f_${field.key}`)?.trim().toLowerCase();
      if (v) and.push({ data: { path: [`${field.key}_l`], string_contains: v } });
    } else if (field.filter === 'range') {
      const min = num(`f_${field.key}_min`);
      const max = num(`f_${field.key}_max`);
      if (min !== null) and.push({ data: { path: [field.key], gte: min } });
      if (max !== null) and.push({ data: { path: [field.key], lte: max } });
    }
  }
  return { AND: and };
}

/** Публічно видимі оголошення проєкту: схвалені, не прострочені, власник активний. */
export function publicWhere(slug: string | null): Prisma.ListingWhereInput {
  return {
    ...(slug ? { projectSlug: slug } : {}),
    status: 'approved',
    expiresAt: { gt: new Date() },
    owner: { isActive: true },
  };
}

type ListingRow = {
  id: number; projectSlug: string; title: string; description: string; price: any; currency: string;
  city: string | null; contactName: string | null; phone: string | null; data: any; status: string;
  rejectReason: string | null; expiresAt: Date | null; viewsCount: number; createdAt: Date; updatedAt: Date; ownerId: number;
  images: { id: number; url: string }[];
  owner: { id: number; firstName: string; lastName: string; avatarUrl: string | null; isVerified: boolean; businessInfo: { companyName: string | null; logoUrl: string | null } | null };
};

export function serializeListing(row: ListingRow, viewerId: number, savedIds: Set<number>, opts: { full?: boolean } = {}) {
  const isOwner = row.ownerId === viewerId;
  const expired = row.status === 'approved' && !!row.expiresAt && row.expiresAt.getTime() <= Date.now();
  const base = {
    id: row.id,
    projectSlug: row.projectSlug,
    title: row.title,
    price: row.price === null || row.price === undefined ? null : Number(row.price),
    currency: row.currency,
    city: row.city,
    createdAt: row.createdAt.toISOString(),
    thumb: row.images[0]?.url ?? null,
    status: expired ? 'expired' : row.status,
    isOwner,
    saved: savedIds.has(row.id),
    data: Object.fromEntries(Object.entries((row.data as Record<string, unknown>) || {}).filter(([k]) => !k.endsWith('_l'))),
  };
  if (!opts.full) return base;
  return {
    ...base,
    description: row.description,
    images: row.images,
    contactName: row.contactName,
    phone: row.phone,
    viewsCount: row.viewsCount,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    rejectReason: isOwner ? row.rejectReason : null,
    owner: {
      id: row.owner.id,
      name: row.owner.businessInfo?.companyName || `${row.owner.firstName} ${row.owner.lastName}`.trim(),
      avatarUrl: row.owner.businessInfo?.logoUrl || row.owner.avatarUrl,
      isVerified: row.owner.isVerified,
    },
  };
}

export async function loadSavedIds(prisma: any, userId: number, ids: number[]): Promise<Set<number>> {
  if (!ids.length) return new Set();
  const rows = await prisma.savedListing.findMany({ where: { userId, listingId: { in: ids } }, select: { listingId: true } });
  return new Set(rows.map((r: { listingId: number }) => r.listingId));
}

export async function removeListingImageFiles(urls: string[]) {
  const { unlink } = await import('fs/promises');
  const { join } = await import('path');
  const root = process.env.UPLOADS_DIR || join(process.cwd(), 'public', 'uploads');
  await Promise.all(
    urls.filter(isOwnListingImage).flatMap((url) => {
      const base = url.replace('/uploads/listings/', '').replace(/\.(webp|jpg)$/, '');
      return [`${base}.webp`, `${base}.jpg`].map((f) => unlink(join(root, 'listings', f)).catch(() => undefined));
    })
  );
}
