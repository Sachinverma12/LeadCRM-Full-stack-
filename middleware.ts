import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET)

const protectedRoutes = ['/dashboard']
const apiProtectedRoutes = ['/api/leads', '/api/auth/me']
const adminRoutes = ['/dashboard/users']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Skip middleware for public routes
  if (
    pathname === '/' ||
    pathname === '/login' ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/logout') ||
    pathname.startsWith('/api/leads') && req.method === 'POST' && !pathname.includes('/notes') && !pathname.includes('/assign') && !pathname.includes('/activity')
  ) {
    return NextResponse.next()
  }

  // Check for session cookie
  const token = req.cookies.get('session')?.value
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Verify JWT
  try {
    const { payload } = await jwtVerify(token, secret!)
    const userId = payload.userId as string
    const role = payload.role as string

    // Check admin-only routes
    const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
    if (isAdminRoute && role !== 'ADMIN') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // For API routes, add user info to headers so route handlers don't need to re-verify
    const headers = new Headers(req.headers)
    headers.set('x-user-id', userId)
    headers.set('x-user-role', role)

    return NextResponse.next({ request: { headers } })
  } catch {
    // Invalid token
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    const response = NextResponse.redirect(new URL('/login', req.url))
    response.cookies.delete('session')
    return response
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/leads/:path*',
    '/api/auth/me',
  ],
}
