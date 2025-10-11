import { updateSession } from '@/lib/supabase/middleware'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Skip middleware for API routes to prevent authentication issues
  if (request.nextUrl.pathname.startsWith('/api')) {
    return
  }

  // Skip middleware for reset-password page to allow it to be static
  if (request.nextUrl.pathname === '/auth/reset-password') {
    return
  }

  const response = await updateSession(request)
  response.headers.set('x-request-id', crypto.randomUUID())
  return response
}

export const config = {
  // Apply middleware to all routes except static assets
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
