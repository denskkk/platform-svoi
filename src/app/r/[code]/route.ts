import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, context: { params: { code: string } }) {
  const code = context.params.code
  const url = new URL(request.url)
  const target = new URL('/auth/register', url.origin)
  target.searchParams.set('ref', code)

  const res = NextResponse.redirect(target)
  // Set short-lived cookie to carry ref across pages if needed
  res.cookies.set('ref', code, { path: '/', maxAge: 60 * 60 * 24 * 7 })
  return res
}
