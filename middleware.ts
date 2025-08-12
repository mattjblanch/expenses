import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()
  const url = new URL(req.url)

  const isAuthRoute = url.pathname.startsWith('/login') || url.pathname.startsWith('/auth')
  const isProtected = url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/expenses') || url.pathname.startsWith('/categories') || url.pathname.startsWith('/accounts') || url.pathname.startsWith('/settings') || url.pathname.startsWith('/exports')

  if (isProtected && !session) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect', url.pathname)
    return NextResponse.redirect(loginUrl)
  }
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
  return res
}

export const config = {
  matcher: ['/((?!_next/|favicon.ico|public/).*)'],
}