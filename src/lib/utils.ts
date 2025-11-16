import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Форматувати суму у внутрішній валюті платформи — «уцмка»
 * Приклад: formatUCM(123.4) => "123,40 уцмка"
 */
export function formatUCM(amount: number | string) {
  const n = typeof amount === 'string' ? Number(amount) : amount
  if (Number.isNaN(n)) return `0,00 уцмка`
  return `${n.toFixed(2).replace('.', ',')} уцмка`
}
