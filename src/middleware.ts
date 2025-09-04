import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // For now, we'll let the client-side handle auth
  // The AuthProvider will redirect if not authenticated
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/login']
}
