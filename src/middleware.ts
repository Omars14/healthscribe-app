import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  try {
    // For now, we'll let the client-side handle auth
    // The AuthProvider will redirect if not authenticated
    return NextResponse.next()
  } catch (error) {
    // Catch any middleware errors to prevent unhandled exceptions
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/login']
}
