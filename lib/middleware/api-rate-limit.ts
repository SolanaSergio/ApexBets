/**
 * API Rate Limiting Middleware
 * Provides rate limiting for API routes based on service type
 */

import { NextRequest, NextResponse } from 'next/server'
import { apiRateLimiter } from '../rules/api-rate-limiter'

interface RateLimitConfig {
  service: 'rapidapi' | 'odds' | 'sportsdb' | 'balldontlie' | 'espn'
  fallbackToCache?: boolean
  errorMessage?: string
}

/**
 * Rate limiting middleware for API routes
 */
export function withRateLimit(config: RateLimitConfig) {
  return function(handler: (request: NextRequest) => Promise<NextResponse>) {
    return async function(request: NextRequest): Promise<NextResponse> {
      try {
        // Check rate limit before processing
        apiRateLimiter.checkRateLimit(config.service)
        
        // Process the request
        const response = await handler(request)
        
        // Record successful request
        apiRateLimiter.recordRequest(config.service)
        
        // Add rate limit headers to response
        const usage = apiRateLimiter.getUsage(config.service)
        response.headers.set('X-RateLimit-Limit-Minute', '60') // Will be dynamic based on service
        response.headers.set('X-RateLimit-Remaining-Minute', (60 - usage.minute).toString())
        response.headers.set('X-RateLimit-Reset', new Date(Date.now() + 60000).toISOString())
        
        return response
      } catch (error) {
        if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
          // Return rate limit error with proper headers
          apiRateLimiter.getUsage(config.service)
          const response = NextResponse.json(
            { 
              error: config.errorMessage || 'Rate limit exceeded',
              message: error.message,
              retryAfter: 60 // seconds
            },
            { status: 429 }
          )
          
          response.headers.set('X-RateLimit-Limit-Minute', '60')
          response.headers.set('X-RateLimit-Remaining-Minute', '0')
          response.headers.set('X-RateLimit-Reset', new Date(Date.now() + 60000).toISOString())
          response.headers.set('Retry-After', '60')
          
          return response
        }
        
        // Re-throw other errors
        throw error
      }
    }
  }
}

/**
 * Get rate limit status for a service
 */
export function getRateLimitStatus(service: 'rapidapi' | 'odds' | 'sportsdb' | 'balldontlie' | 'espn') {
  return apiRateLimiter.getUsage(service)
}

/**
 * Check if a service is rate limited
 */
export function isRateLimited(service: 'rapidapi' | 'odds' | 'sportsdb' | 'balldontlie' | 'espn'): boolean {
  try {
    apiRateLimiter.checkRateLimit(service)
    return false
  } catch {
    return true
  }
}

/**
 * Rate limit configuration for different services
 */
export const RATE_LIMIT_CONFIGS = {
  rapidapi: {
    service: 'rapidapi' as const,
    errorMessage: 'RapidAPI rate limit exceeded. Please try again later.',
    fallbackToCache: true
  },
  odds: {
    service: 'odds' as const,
    errorMessage: 'Odds API rate limit exceeded. Please try again later.',
    fallbackToCache: true
  },
  sportsdb: {
    service: 'sportsdb' as const,
    errorMessage: 'SportsDB API rate limit exceeded. Please try again later.',
    fallbackToCache: true
  },
  balldontlie: {
    service: 'balldontlie' as const,
    errorMessage: 'BALLDONTLIE API rate limit exceeded. Please try again later.',
    fallbackToCache: true
  },
  espn: {
    service: 'espn' as const,
    errorMessage: 'ESPN API rate limit exceeded. Please try again later.',
    fallbackToCache: true
  }
} as const
