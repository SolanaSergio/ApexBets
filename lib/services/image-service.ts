/**
 * Image Service - Bulletproof Implementation
 * Integrates with bulletproof-image-service for guaranteed image delivery
 * ALWAYS returns valid image - never fails
 */

import { structuredLogger } from './structured-logger'
import { bulletproofImageService, BulletproofImageResult } from './bulletproof-image-service'
import { fallbackImageService } from './svg-generator'

export interface ImageResult {
  url: string
  width?: number
  height?: number
  format?: string
  cached: boolean
  source?: string
  fallback?: boolean
}

export class ImageService {
  private static instance: ImageService
  private cache: Map<string, ImageResult> = new Map()

  public static getInstance(): ImageService {
    if (!ImageService.instance) {
      ImageService.instance = new ImageService()
    }
    return ImageService.instance
  }

  /**
   * Get team logo URL with bulletproof fallback
   * ALWAYS returns valid image - never fails
   */
  async getTeamLogoUrl(teamName: string, league?: string, sport?: string): Promise<ImageResult> {
    try {
      const cacheKey = `team_logo_${teamName}_${league}_${sport}`

      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey)!
        structuredLogger.cacheHit(cacheKey)
        return cached
      }

      // Use bulletproof service
      const result: BulletproofImageResult = await bulletproofImageService.getTeamLogo(
        teamName,
        sport || 'unknown',
        league || 'unknown'
      )

      // Cache the result
      const imageResult: ImageResult = {
        url: result.url,
        cached: result.cached,
        source: result.source,
        fallback: result.fallback,
        format: result.source === 'static' ? 'png' : 'webp',
      }

      this.cache.set(cacheKey, imageResult)
      structuredLogger.cacheMiss(cacheKey)
      structuredLogger.debug('Fetched team logo via bulletproof service', {
        teamName,
        league,
        sport,
        source: result.source,
        fallback: result.fallback,
      })

      return imageResult
    } catch (error) {
      structuredLogger.error('Failed to get team logo URL', {
        teamName,
        league,
        sport,
        error: error instanceof Error ? error.message : String(error),
      })

      // Ultimate fallback - static image
      const staticFallback = fallbackImageService.getGenericFallback('team')

      return {
        url: staticFallback,
        cached: false,
        source: 'static',
        fallback: true,
        format: 'png',
      }
    }
  }

  /**
   * Get player photo URL with bulletproof fallback
   * ALWAYS returns valid image - never fails
   */
  async getPlayerPhotoUrl(
    playerId: string,
    sport?: string,
    playerName?: string
  ): Promise<ImageResult> {
    try {
      const cacheKey = `player_photo_${playerId}_${sport}`

      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey)!
        structuredLogger.cacheHit(cacheKey)
        return cached
      }

      // Use bulletproof service
      const result: BulletproofImageResult = await bulletproofImageService.getPlayerPhoto(
        playerName || `Player ${playerId}`,
        playerId,
        sport || 'unknown'
      )

      // Cache the result
      const imageResult: ImageResult = {
        url: result.url,
        cached: result.cached,
        source: result.source,
        fallback: result.fallback,
        format: result.source === 'static' ? 'png' : 'webp',
      }

      this.cache.set(cacheKey, imageResult)
      structuredLogger.cacheMiss(cacheKey)
      structuredLogger.debug('Fetched player photo via bulletproof service', {
        playerId,
        sport,
        source: result.source,
        fallback: result.fallback,
      })

      return imageResult
    } catch (error) {
      structuredLogger.error('Failed to get player photo URL', {
        playerId,
        sport,
        error: error instanceof Error ? error.message : String(error),
      })

      // Ultimate fallback - static image
      const staticFallback = fallbackImageService.getGenericFallback('player')

      return {
        url: staticFallback,
        cached: false,
        source: 'static',
        fallback: true,
        format: 'png',
      }
    }
  }

  /**
   * Get team logo with full metadata
   */
  async getTeamLogo(teamName: string, league?: string, sport?: string): Promise<ImageResult> {
    const result = await this.getTeamLogoUrl(teamName, league, sport)
    const cacheKey = `team_logo_${teamName}_${league}_${sport}`

    return (
      this.cache.get(cacheKey) || {
        url: result.url,
        cached: false,
        source: 'static',
        fallback: true,
        format: 'png',
      }
    )
  }

  /**
   * Get player photo with full metadata
   */
  async getPlayerPhoto(
    playerId: string,
    sport?: string,
    playerName?: string
  ): Promise<ImageResult> {
    const result = await this.getPlayerPhotoUrl(playerId, sport, playerName)
    const cacheKey = `player_photo_${playerId}_${sport}`

    return (
      this.cache.get(cacheKey) || {
        url: result.url,
        cached: false,
        source: 'static',
        fallback: true,
        format: 'png',
      }
    )
  }

  async optimizeImage(url: string, width?: number, height?: number): Promise<ImageResult> {
    try {
      // For static fallback images, return as-is
      if (url.startsWith('/images/fallbacks/')) {
        return {
          url,
          width: width || 200,
          height: height || 200,
          format: 'png',
          cached: false,
        }
      }

      // For other images, add optimization parameters
      const optimizedUrl = this.addOptimizationParams(url, width, height)

      return {
        url: optimizedUrl,
        width: width || 200,
        height: height || 200,
        format: 'webp',
        cached: false,
      }
    } catch (error) {
      structuredLogger.error('Failed to optimize image', {
        url,
        width,
        height,
        error: error instanceof Error ? error.message : String(error),
      })

      return {
        url,
        cached: false,
      }
    }
  }

  private addOptimizationParams(url: string, width?: number, height?: number): string {
    const params = new URLSearchParams()

    if (width) params.set('w', width.toString())
    if (height) params.set('h', height.toString())
    params.set('f', 'webp')
    params.set('q', '80')

    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}${params.toString()}`
  }

  clearCache(): void {
    this.cache.clear()
    bulletproofImageService.clearCache()
    structuredLogger.info('Image service cache cleared')
  }

  getCacheStats(): {
    size: number
    keys: string[]
    bulletproof: ReturnType<typeof bulletproofImageService.getCacheStats>
  } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      bulletproof: bulletproofImageService.getCacheStats(),
    }
  }

  /**
   * Warm up cache with popular images
   */
  async warmupCache(teams: Array<{ name: string; sport: string; league: string }>): Promise<void> {
    await bulletproofImageService.warmupCache(teams)
  }
}

export const imageService = ImageService.getInstance()

// Export convenience functions
export const getTeamLogoUrl = (teamName: string, league?: string, sport?: string) =>
  imageService.getTeamLogoUrl(teamName, league, sport)

export const getPlayerPhotoUrl = (playerId: string, sport?: string, playerName?: string) =>
  imageService.getPlayerPhotoUrl(playerId, sport, playerName)

// Align with components/ui/sports-image expected exports (non-breaking stubs)
export type SportsLeague = string
export interface TeamLogoConfig {
  teamName: string
  league?: string
  sport?: string
}
export interface PlayerPhotoConfig {
  playerId: string
  sport?: string
}

// Static image sources for fallbacks
export const IMAGE_SOURCES = {
  basketball: '/images/fallbacks/sports.png',
  football: '/images/fallbacks/sports.png',
  baseball: '/images/fallbacks/sports.png',
  hockey: '/images/fallbacks/sports.png',
  soccer: '/images/fallbacks/sports.png',
  tennis: '/images/fallbacks/sports.png',
  golf: '/images/fallbacks/sports.png',
  default: '/images/fallbacks/sports.png',
}

// Convenience function for getting sports images
export const getSportsImageUrl = (sport: string, _config?: { width?: number; height?: number }): string => {
  return IMAGE_SOURCES[sport as keyof typeof IMAGE_SOURCES] || IMAGE_SOURCES.default
}

// Convenience function for getting fallback images
export const getFallbackImageUrl = (type: 'team' | 'player' | 'sports' = 'sports'): string => {
  return fallbackImageService.getGenericFallback(type)
}
