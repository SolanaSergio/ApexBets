import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Helper function to create a Supabase client
const createSupabaseClient = (request: NextRequest, response: NextResponse) => {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('Middleware: Missing Supabase environment variables', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
      })
      throw new Error('Missing Supabase configuration in middleware')
    }

    return createServerClient(supabaseUrl, supabaseKey, {
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
    })
  } catch (error) {
    console.error('Middleware: Failed to create Supabase client', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

// Helper function to handle redirects for unauthenticated users
const handleRedirect = (request: NextRequest) => {
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  return NextResponse.redirect(url)
}

// Helper function to check if a path is public
const isPublicPath = (path: string) => {
  return path.startsWith('/login') || path.startsWith('/auth') || path.startsWith('/api')
}

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request })

  try {
    const supabase = createSupabaseClient(request, response)

    // Use getUser() for secure authentication as recommended by Supabase
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      // Only log unexpected auth errors, not routine session checks
      const isExpectedError = 
        userError.message.includes('Auth session missing') ||
        userError.message.includes('refresh_token_not_found') ||
        userError.message.includes('Invalid JWT')

      if (!isExpectedError) {
        console.warn('Unexpected authentication error:', userError.message)
      }

      // Handle specific auth errors
      if (
        userError.message.includes('Auth session missing') ||
        userError.message.includes('refresh_token_not_found')
      ) {
        // Clear invalid session silently
        await supabase.auth.signOut()
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
