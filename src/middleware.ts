import { NextRequest, NextResponse } from 'next/server'
import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_HEADER,
  PATH_HEADER,
  Locale,
  defaultLocale,
  isLocale,
  parseAcceptLanguage,
} from '@/i18n/config'
import { isPrivatePath, isPublicLocalizedPath, splitLocalePrefix } from '@/i18n/routes'

function withLocaleCookie(request: NextRequest, response: NextResponse, locale: Locale) {
  if (request.cookies.get(LOCALE_COOKIE)?.value !== locale) {
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: '/',
      maxAge: LOCALE_COOKIE_MAX_AGE,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
  }
  return response
}

function finalize(response: NextResponse, path: string) {
  response.headers.append('Vary', 'Accept-Language')
  response.headers.append('Vary', 'Cookie')
  if (isPrivatePath(path)) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }
  return response
}

/**
 * Загальний захист API від перевантаження (одна база, один сервер).
 * Ліміти рахуються на IP: читання, запис і вхід/реєстрація окремо. Перевищення -> 429 з Retry-After.
 * Без залежностей, щоб працювало в Edge-середовищі middleware. Лічильники живуть у пам'яті процесу.
 */
const API_LIMITS = {
  read: { interval: 60_000, max: 600 },
  write: { interval: 60_000, max: 120 },
  auth: { interval: 10 * 60_000, max: 40 },
} as const

const apiHits = new Map<string, { count: number; reset: number }>()
let lastSweep = 0

function clientIp(request: NextRequest): string {
  // X-Real-IP виставляє nginx і клієнт його не підробить; X-Forwarded-For — запасний варіант (тунель, інший проксі).
  const real = request.headers.get('x-real-ip')?.trim()
  if (real) return real.slice(0, 45)
  return (request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '').slice(0, 45)
}

function rateLimitApi(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl
  if (pathname === '/api/health') return null
  const ip = clientIp(request)
  if (!ip) return null // пряме локальне звернення без проксі: не обмежуємо (розробка)
  const write = !(request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS')
  const isAuthRoute = write && /^\/api\/auth\/(login|register|register-business|restore|refresh)/.test(pathname)
  const bucket = isAuthRoute ? 'auth' : write ? 'write' : 'read'
  const limit = API_LIMITS[bucket]
  const now = Date.now()
  if (now - lastSweep > 5 * 60_000) {
    lastSweep = now
    apiHits.forEach((v, k) => { if (v.reset < now) apiHits.delete(k) })
  }
  const key = `${bucket}:${ip}`
  const entry = apiHits.get(key)
  if (!entry || entry.reset < now) {
    apiHits.set(key, { count: 1, reset: now + limit.interval })
    return null
  }
  entry.count++
  if (entry.count <= limit.max) return null
  const retry = Math.max(1, Math.ceil((entry.reset - now) / 1000))
  return NextResponse.json({ error: 'Too many requests', code: 'RATE_LIMITED' }, { status: 429, headers: { 'Retry-After': String(retry) } })
}

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return rateLimitApi(request) ?? NextResponse.next()
  }
  const { pathname, search } = request.nextUrl
  const { locale: prefixLocale, path } = splitLocalePrefix(pathname)
  const isNavigation = request.method === 'GET' || request.method === 'HEAD'

  // `/uk/...` is not a real prefix: Ukrainian lives at the unprefixed URL.
  if (prefixLocale === 'uk') {
    const url = request.nextUrl.clone()
    url.pathname = path
    return finalize(withLocaleCookie(request, NextResponse.redirect(url, 308), 'uk'), path)
  }

  let locale: Locale
  if (prefixLocale === 'en') {
    locale = 'en'
  } else {
    const cookieValue = request.cookies.get(LOCALE_COOKIE)?.value
    locale = isLocale(cookieValue)
      ? cookieValue
      : parseAcceptLanguage(request.headers.get('accept-language')) ?? defaultLocale

    // Public pages have a dedicated `/en/...` URL; send English visitors there.
    if (isNavigation && locale === 'en' && isPublicLocalizedPath(path)) {
      const url = request.nextUrl.clone()
      url.pathname = path === '/' ? '/en' : `/en${path}`
      url.search = search
      return finalize(NextResponse.redirect(url, 307), path)
    }
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(LOCALE_HEADER, locale)
  requestHeaders.set(PATH_HEADER, path)

  if (prefixLocale === 'en') {
    const url = request.nextUrl.clone()
    url.pathname = path
    return finalize(withLocaleCookie(request, NextResponse.rewrite(url, { request: { headers: requestHeaders } }), 'en'), path)
  }

  return finalize(NextResponse.next({ request: { headers: requestHeaders } }), path)
}

export const config = {
  matcher: ['/api/:path*', '/((?!api/|_next/|uploads/|.*\\..*).*)'],
}
