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

export function middleware(request: NextRequest) {
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
  matcher: ['/((?!api/|_next/|uploads/|.*\\..*).*)'],
}
