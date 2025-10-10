/**
 * Image Service - Bulletproof Implementation
 * Integrates with bulletproof-image-service for guaranteed image delivery
 * ALWAYS returns valid image - never fails
 */

import { structuredLogger } from './structured-logger'
import { bulletproofImageService, BulletproofImageResult } from './bulletproof-image-service'

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
        format: result.source === 'svg' ? 'svg+xml' : 'webp'
      }

      this.cache.set(cacheKey, imageResult)
      structuredLogger.cacheMiss(cacheKey)
      structuredLogger.debug('Fetched team logo via bulletproof service', { 
        teamName, 
        league, 
        sport, 
        source: result.source,
        fallback: result.fallback 
      })

      return imageResult

    } catch (error) {
      structuredLogger.error('Failed to get team logo URL', {
        teamName,
        league,
        sport,
        error: error instanceof Error ? error.message : String(error)
      })

      // Ultimate fallback - basic SVG
      const fallbackSvg = `data:image/svg+xml,${encodeURIComponent(`
        <svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
          <circle cx="64" cy="64" r="60" fill="#666666" stroke="#999999" stroke-width="2"/>
          <text x="64" y="76" font-family="Arial, sans-serif" font-weight="bold" font-size="24" 
                text-anchor="middle" fill="#FFFFFF">${teamName.substring(0, 3).toUpperCase()}</text>
        </svg>
      `)}`
      
      return {
        url: fallbackSvg,
        cached: false,
        source: 'svg',
        fallback: true,
        format: 'svg+xml'
      }
    }
  }

  /**
   * Get player photo URL with bulletproof fallback
   * ALWAYS returns valid image - never fails
   */
  async getPlayerPhotoUrl(playerId: string, sport?: string, playerName?: string): Promise<ImageResult> {
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
        format: result.source === 'svg' ? 'svg+xml' : 'webp'
      }

      this.cache.set(cacheKey, imageResult)
      structuredLogger.cacheMiss(cacheKey)
      structuredLogger.debug('Fetched player photo via bulletproof service', { 
        playerId, 
        sport, 
        source: result.source,
        fallback: result.fallback 
      })

      return imageResult

    } catch (error) {
      structuredLogger.error('Failed to get player photo URL', {
        playerId,
        sport,
        error: error instanceof Error ? error.message : String(error)
      })

      // Ultimate fallback - basic SVG
      const fallbackSvg = `data:image/svg+xml,${encodeURIComponent(`
        <svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
          <circle cx="64" cy="64" r="60" fill="#666666" stroke="#999999" stroke-width="2"/>
          <text x="64" y="76" font-family="Arial, sans-serif" font-weight="bold" font-size="20" 
                text-anchor="middle" fill="#FFFFFF">${playerId.substring(0, 2).toUpperCase()}</text>
        </svg>
      `)}`
      
      return {
        url: fallbackSvg,
        cached: false,
        source: 'svg',
        fallback: true,
        format: 'svg+xml'
      }
    }
  }

  /**
   * Get team logo with full metadata
   */
  async getTeamLogo(teamName: string, league?: string, sport?: string): Promise<ImageResult> {
    const result = await this.getTeamLogoUrl(teamName, league, sport)
    const cacheKey = `team_logo_${teamName}_${league}_${sport}`
    
    return this.cache.get(cacheKey) || {
      url: result.url,
      cached: false,
      source: 'svg',
      fallback: true,
      format: 'svg+xml'
    }
  }

  /**
   * Get player photo with full metadata
   */
  async getPlayerPhoto(playerId: string, sport?: string, playerName?: string): Promise<ImageResult> {
    const result = await this.getPlayerPhotoUrl(playerId, sport, playerName)
    const cacheKey = `player_photo_${playerId}_${sport}`
    
    return this.cache.get(cacheKey) || {
      url: result.url,
      cached: false,
      source: 'svg',
      fallback: true,
      format: 'svg+xml'
    }
  }

  async optimizeImage(url: string, width?: number, height?: number): Promise<ImageResult> {
    try {
      // For SVG images, return as-is
      if (url.startsWith('data:image/svg+xml')) {
        return {
          url,
          width: width || 200,
          height: height || 200,
          format: 'svg+xml',
          cached: false
        }
      }

      // For other images, add optimization parameters
      const optimizedUrl = this.addOptimizationParams(url, width, height)
      
      return {
        url: optimizedUrl,
        width: width || 200,
        height: height || 200,
        format: 'webp',
        cached: false
      }

    } catch (error) {
      structuredLogger.error('Failed to optimize image', {
        url,
        width,
        height,
        error: error instanceof Error ? error.message : String(error)
      })

      return {
        url,
        cached: false
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
      bulletproof: bulletproofImageService.getCacheStats()
    }
  }

  /**
   * Warm up cache with popular images
   */
  async warmupCache(teams: Array<{name: string, sport: string, league: string}>): Promise<void> {
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
export interface TeamLogoConfig { teamName: string; league?: string; sport?: string }
export interface PlayerPhotoConfig { playerId: string; sport?: string }

export const IMAGE_SOURCES = {
  teamLogos: 'bulletproof',
  playerPhotos: 'bulletproof'
}

export function getSportsImageUrl(category: string, options?: { width?: number; height?: number }): string {
  // Generate SVG based on category
  const svg = `
    <svg width="${options?.width || 200}" height="${options?.height || 200}" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#f0f0f0" rx="10"/>
      <text x="100" y="110" font-family="Arial, sans-serif" font-size="16" text-anchor="middle" fill="#666">
        ${category.toUpperCase()}
      </text>
    </svg>
  `
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export function getFallbackImageUrl(type: 'team' | 'player' | 'sports' = 'sports'): string {
  const svg = `
    <svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
      <circle cx="64" cy="64" r="60" fill="#e0e0e0" stroke="#ccc" stroke-width="2"/>
      <text x="64" y="76" font-family="Arial, sans-serif" font-size="16" text-anchor="middle" fill="#999">
        ${type.toUpperCase()}
      </text>
    </svg>
  `
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}
