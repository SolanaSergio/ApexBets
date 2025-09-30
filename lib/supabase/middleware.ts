import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { authErrorHandler } from '../auth/auth-error-handler'

// Helper function to create a Supabase client
const createSupabaseClient = (request: NextRequest, response: NextResponse) => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set(name, value, options)
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set(name, '', options)
        },
      },
    }
  )
}

// Helper function to handle redirects for unauthenticated users
const handleRedirect = (request: NextRequest) => {
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  return NextResponse.redirect(url)
}

// Helper function to check if a path is public
const isPublicPath = (path: string) => {
  return (
    path.startsWith('/login') ||
    path.startsWith('/auth') ||
    path.startsWith('/api')
  )
}

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request })
  const supabase = createSupabaseClient(request, response)

  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      const errorResult = authErrorHandler.handleAuthError(error)
      
      // Only log auth errors for non-public paths and non-session-missing errors
      if (!isPublicPath(request.nextUrl.pathname) && 
          !error.message.includes('Auth session missing')) {
        console.warn(`Middleware auth error: ${errorResult.error}`)
      }

      if (errorResult.shouldClearSession) {
        await authErrorHandler.clearSession(supabase)
      }

      if (errorResult.shouldRedirect && !isPublicPath(request.nextUrl.pathname)) {
        return handleRedirect(request)
      }
    }

    if (!user && !isPublicPath(request.nextUrl.pathname)) {
      return handleRedirect(request)
    }
  } catch (error) {
    console.error('Critical middleware error:', error)
    if (!isPublicPath(request.nextUrl.pathname)) {
      return handleRedirect(request)
    }
  }

  return response
}
