/**
 * API Rate Limiting Middleware
 * Provides rate limiting for API routes based on service type
 */

import { NextRequest, NextResponse } from 'next/server'
import { enhancedRateLimiter } from '../services/enhanced-rate-limiter'

interface RateLimitConfig {
  service: 'rapidapi' | 'odds' | 'sportsdb' | 'balldontlie' | 'espn'
  fallbackToCache?: boolean
  errorMessage?: string
}

/**
 * Rate limiting middleware for API routes
 */
export function withRateLimit(config: RateLimitConfig) {
  return function (handler: (request: NextRequest) => Promise<NextResponse>) {
    return async function (request: NextRequest): Promise<NextResponse> {
      try {
        // Check rate limit before processing
        const rateLimitResult = await enhancedRateLimiter.checkRateLimit(config.service, 'api')
        if (!rateLimitResult.allowed) {
          throw new Error(
            `Rate limit exceeded for ${config.service}: ${rateLimitResult.retryAfter ? `retry after ${rateLimitResult.retryAfter}s` : 'limit exceeded'}`
          )
        }

        // Process the request
        const response = await handler(request)

        // Add rate limit headers to response
        response.headers.set('X-RateLimit-Limit-Minute', '60') // Will be dynamic based on service
        response.headers.set('X-RateLimit-Remaining-Minute', rateLimitResult.remaining.toString())
        response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString())

        return response
      } catch (error) {
        if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
          // Return rate limit error with proper headers
          const rateLimitResult = await enhancedRateLimiter.checkRateLimit(config.service, 'api')
          const response = NextResponse.json(
            {
              error: config.errorMessage || 'Rate limit exceeded',
              message: error.message,
              retryAfter: rateLimitResult.retryAfter || 60, // seconds
            },
            { status: 429 }
          )

          response.headers.set('X-RateLimit-Limit-Minute', '60')
          response.headers.set('X-RateLimit-Remaining-Minute', '0')
          response.headers.set(
            'X-RateLimit-Reset',
            new Date(rateLimitResult.resetTime).toISOString()
          )
          response.headers.set('Retry-After', (rateLimitResult.retryAfter || 60).toString())

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
export async function getRateLimitStatus(
  service: 'rapidapi' | 'odds' | 'sportsdb' | 'balldontlie' | 'espn'
) {
  return await enhancedRateLimiter.getRateLimitStatus(service)
}

/**
 * Check if a service is rate limited
 */
export async function isRateLimited(
  service: 'rapidapi' | 'odds' | 'sportsdb' | 'balldontlie' | 'espn'
): Promise<boolean> {
  try {
    const result = await enhancedRateLimiter.checkRateLimit(service, 'api')
    return !result.allowed
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
    fallbackToCache: true,
  },
  odds: {
    service: 'odds' as const,
    errorMessage: 'Odds API rate limit exceeded. Please try again later.',
    fallbackToCache: true,
  },
  sportsdb: {
    service: 'sportsdb' as const,
    errorMessage: 'SportsDB API rate limit exceeded. Please try again later.',
    fallbackToCache: true,
  },
  balldontlie: {
    service: 'balldontlie' as const,
    errorMessage: 'BALLDONTLIE API rate limit exceeded. Please try again later.',
    fallbackToCache: true,
  },
  espn: {
    service: 'espn' as const,
    errorMessage: 'ESPN API rate limit exceeded. Please try again later.',
    fallbackToCache: true,
  },
} as const
