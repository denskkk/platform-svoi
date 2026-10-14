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
  return await bcrypt.compare(password, hash);
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
