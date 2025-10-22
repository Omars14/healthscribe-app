import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  try {
    // For now, we'll let the client-side handle auth
    // The AuthProvider will redirect if not authenticated
    return NextResponse.next()
  } catch (error) {
    // Silently catch middleware errors to prevent unhandled exceptions
    // This prevents noise from browser extension connection attempts
    if (process.env.NODE_ENV === 'development') {
      console.debug('Middleware error (suppressed):', error)
    }
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/login']
}
