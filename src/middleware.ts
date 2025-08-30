import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow access to auth pages and API routes
  if (pathname.startsWith('/auth') || pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Allow access to static files
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next()
  }

  // Allow access to root page
  if (pathname === '/') {
    return NextResponse.next()
  }

  // For dashboard routes, let the dashboard layout handle authentication
  // This avoids Supabase calls in middleware which can cause fetch errors
  if (pathname.startsWith('/dashboard')) {
    // Just pass through to dashboard layout
    return NextResponse.next()
  }

  // For all other routes, allow access
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 