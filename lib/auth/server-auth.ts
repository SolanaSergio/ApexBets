/**
 * Server-Side Authentication Utilities
 * Provides server-side session validation for Next.js App Router
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export interface ServerAuthResult {
  user: any | null
  session: any | null
  isAuthenticated: boolean
}

/**
 * Get server-side authentication state
 * Returns user and session data without redirecting
 */
export async function getServerAuth(): Promise<ServerAuthResult> {
  try {
    const supabase = await createClient()
    
    if (!supabase) {
      return {
        user: null,
        session: null,
        isAuthenticated: false
      }
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      // Handle expected errors silently
      const isExpectedError = 
        userError.message.includes('Auth session missing') ||
        userError.message.includes('refresh_token_not_found') ||
        userError.message.includes('Invalid JWT')

      if (!isExpectedError) {
        console.warn('Server auth error:', userError.message)
      }
      
      return {
        user: null,
        session: null,
        isAuthenticated: false
      }
    }

    const { data: { session } } = await supabase.auth.getSession()

    return {
      user,
      session,
      isAuthenticated: !!user
    }
  } catch (error) {
    console.error('Server auth error:', error)
    return {
      user: null,
      session: null,
      isAuthenticated: false
    }
  }
}

/**
 * Require authentication on server-side
 * Redirects to login if not authenticated
 */
export async function requireServerAuth(): Promise<ServerAuthResult> {
  const auth = await getServerAuth()
  
  if (!auth.isAuthenticated) {
    redirect('/login')
  }
  
  return auth
}

/**
 * Check if user is authenticated without redirecting
 * Useful for conditional rendering
 */
export async function isServerAuthenticated(): Promise<boolean> {
  const auth = await getServerAuth()
  return auth.isAuthenticated
}
