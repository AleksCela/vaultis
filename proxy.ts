import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, verifyAdminToken } from '@/lib/auth'

const USER_PROTECTED = ['/dashboard', '/send', '/transactions', '/profile', '/step-up']
const ADMIN_PROTECTED = ['/admin/dashboard', '/admin/queue', '/admin/events']

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (ADMIN_PROTECTED.some(p => pathname.startsWith(p))) {
    const token = req.cookies.get('vaultis_admin_token')?.value
    if (!token || !verifyAdminToken(token)) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
    return NextResponse.next()
  }

  if (USER_PROTECTED.some(p => pathname.startsWith(p))) {
    const token = req.cookies.get('vaultis_token')?.value
    if (!token || !verifyToken(token)) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/send/:path*',
    '/transactions/:path*',
    '/profile/:path*',
    '/step-up/:path*',
    '/admin/dashboard/:path*',
    '/admin/queue/:path*',
    '/admin/events/:path*',
  ],
}
