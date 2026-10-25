/**
 * СВІЙ ДЛЯ СВОЇХ - Authentication Utilities
 * 
 * JWT та bcrypt функції для аутентифікації
 */

import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createHash, randomUUID } from 'crypto';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required. Set it in the environment before starting the app.`);
  }
  return value;
}

const JWT_SECRET: string = requireEnv('JWT_SECRET');
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as string;
const REFRESH_TOKEN_SECRET: string = requireEnv('REFRESH_TOKEN_SECRET');
const REFRESH_TOKEN_EXPIRES_IN = (process.env.REFRESH_TOKEN_EXPIRES_IN || '30d') as string;

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  accountType?: string;
  /** ID сесії в БД. Токени без sid — старі (до переходу на сесійну модель). */
  sid?: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isSessionId(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

/**
 * Дістати sid з access/refresh токена (підпис перевіряється, строк дії ігнорується) —
 * потрібно, щоб logout міг відкликати сесію і за простроченим токеном.
 */
export function extractSessionId(token: string): string | null {
  for (const secret of [JWT_SECRET, REFRESH_TOKEN_SECRET]) {
    try {
      const payload = jwt.verify(token, secret, { ignoreExpiration: true }) as JWTPayload;
      if (isSessionId(payload.sid)) return payload.sid;
    } catch {
      // спробуємо інший секрет
    }
  }
  return null;
}

/**
 * Хешувати пароль за допомогою bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Порівняти пароль з хешем
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    // Пошкоджений/порожній хеш — це «пароль не підходить», а не помилка сервера
    return false;
  }
}

/**
 * Варіанти введеного пароля, які мобільні клавіатури псують найчастіше:
 * зайві пробіли по краях і автоматична велика/мала перша літера.
 * Точний варіант завжди перший.
 */
export function passwordVariants(password: string): string[] {
  const flipFirst = (value: string) => {
    const first = value.charAt(0);
    const flipped = first === first.toLowerCase() ? first.toUpperCase() : first.toLowerCase();
    return flipped + value.slice(1);
  };
  const trimmed = password.trim();
  const variants = [password, trimmed, flipFirst(password), flipFirst(trimmed)];
  return Array.from(new Set(variants)).filter((value) => value.length > 0);
}

export async function passwordMatches(candidates: string[], hash: string): Promise<boolean> {
  for (const candidate of candidates) {
    if (await comparePassword(candidate, hash)) return true;
  }
  return false;
}

/**
 * Створити JWT токен
 */
export function generateToken(payload: JWTPayload): string {
  // jwtid робить кожен токен унікальним (інакше два входи в одну секунду дають однаковий токен)
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    jwtid: randomUUID()
  } as SignOptions);
}

/**
 * SHA-256 хеш токена для збереження в таблиці сесій (сам токен у БД не зберігаємо)
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Створити refresh токен
 */
export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    jwtid: randomUUID()
  } as SignOptions);
}

/**
 * Верифікувати JWT токен
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Верифікувати refresh токен
 */
export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Отримати токен з headers
 */
export function getTokenFromHeader(authorization: string | null): string | null {
  if (!authorization) return null;
  
  const parts = authorization.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  
  return parts[1];
}
