/**
 * Authentication Error Handler
 * Centralized handling of Supabase auth errors
 */

import { AuthError } from '@supabase/supabase-js'

export interface AuthErrorResult {
  shouldRetry: boolean
  shouldClearSession: boolean
  shouldRedirect: boolean
  redirectPath?: string
  error: string
  isRefreshTokenError: boolean
}

export class AuthErrorHandler {
  private static instance: AuthErrorHandler

  public static getInstance(): AuthErrorHandler {
    if (!AuthErrorHandler.instance) {
      AuthErrorHandler.instance = new AuthErrorHandler()
    }
    return AuthErrorHandler.instance
  }

  /**
   * Handle authentication errors with appropriate recovery strategies
   */
  handleAuthError(error: AuthError | Error): AuthErrorResult {
    const errorMessage = error.message.toLowerCase()
    const isRefreshTokenError =
      errorMessage.includes('refresh_token_not_found') ||
      errorMessage.includes('invalid refresh token')

    // Handle refresh token errors
    if (isRefreshTokenError) {
      console.warn('Refresh token error detected:', error.message)
      return {
        shouldRetry: false,
        shouldClearSession: true,
        shouldRedirect: true,
        redirectPath: '/login',
        error: 'Session expired. Please sign in again.',
        isRefreshTokenError: true,
      }
    }

    // Handle invalid credentials
    if (
      errorMessage.includes('invalid login credentials') ||
      errorMessage.includes('invalid email or password')
    ) {
      return {
        shouldRetry: false,
        shouldClearSession: false,
        shouldRedirect: false,
        error: 'Invalid email or password.',
        isRefreshTokenError: false,
      }
    }

    // Handle email not confirmed
    if (errorMessage.includes('email not confirmed')) {
      return {
        shouldRetry: false,
        shouldClearSession: false,
        shouldRedirect: false,
        error: 'Please check your email and confirm your account.',
        isRefreshTokenError: false,
      }
    }

    // Handle rate limiting
    if (errorMessage.includes('too many requests') || errorMessage.includes('rate limit')) {
      return {
        shouldRetry: true,
        shouldClearSession: false,
        shouldRedirect: false,
        error: 'Too many requests. Please try again later.',
        isRefreshTokenError: false,
      }
    }

    // Handle network errors
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('connection')
    ) {
      return {
        shouldRetry: true,
        shouldClearSession: false,
        shouldRedirect: false,
        error: 'Network error. Please check your connection.',
        isRefreshTokenError: false,
      }
    }

    // Generic error handling
    return {
      shouldRetry: false,
      shouldClearSession: false,
      shouldRedirect: false,
      error: error.message || 'An authentication error occurred.',
      isRefreshTokenError: false,
    }
  }

  /**
   * Clear authentication session and cookies
   */
  async clearSession(supabase: any): Promise<void> {
    try {
      await supabase.auth.signOut()
      console.log('Session cleared successfully')
    } catch (error) {
      console.error('Error clearing session:', error)
    }
  }

  /**
   * Check if error is related to refresh token issues
   */
  isRefreshTokenError(error: Error): boolean {
    const errorMessage = error.message.toLowerCase()
    return (
      errorMessage.includes('refresh_token_not_found') ||
      errorMessage.includes('invalid refresh token') ||
      errorMessage.includes('refresh token not found')
    )
  }

  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage(error: Error): string {
    const result = this.handleAuthError(error)
    return result.error
  }
}

export const authErrorHandler = AuthErrorHandler.getInstance()
