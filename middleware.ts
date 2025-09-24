import { updateSession } from "@/lib/supabase/middleware"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Skip middleware for reset-password page to allow it to be static
  if (request.nextUrl.pathname === '/auth/reset-password') {
    return
  }
  
  return await updateSession(request)
}

export const config = {
  // Exclude static assets and the reset-password page so it can remain static
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|auth/reset-password|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
// Use experimental-edge runtime for Vercel/Next.js compatibility
export const runtime = 'experimental-edge'