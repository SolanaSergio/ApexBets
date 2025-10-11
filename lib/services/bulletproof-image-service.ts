/**
 * Bulletproof Image Service
 * 3-tier failsafe: Memory cache → API cache → ESPN CDN → Static fallback
 * ALWAYS returns valid image - never fails
 */

import { structuredLogger } from './structured-logger'
import { fallbackImageService } from './svg-generator'
import { espnCDNMapper } from './espn-cdn-mapper'

export interface ImageCacheEntry {
  image_url: string
  source: string
  verified_at: string
  expires_at?: string
  cache_hits: number
}

export interface BulletproofImageResult {
  url: string
  source: 'memory' | 'database' | 'espn-cdn' | 'espn-api' | 'static'
  cached: boolean
  fallback: boolean
}

export class BulletproofImageService {
  private static instance: BulletproofImageService
  private memoryCache: Map<string, string> = new Map()
  private cacheStats = {
    hits: 0,
    misses: 0,
    fallbacks: 0,
  }

  public static getInstance(): BulletproofImageService {
    if (!BulletproofImageService.instance) {
      BulletproofImageService.instance = new BulletproofImageService()
    }
    return BulletproofImageService.instance
  }

  /**
   * Get team logo with bulletproof fallback chain
   * ALWAYS returns valid image - never fails
   */
  async getTeamLogo(
    teamName: string,
    sport: string,
    league: string
  ): Promise<BulletproofImageResult> {
    try {
      const cacheKey = `logo:${teamName}:${sport}:${league}`

      // 1. Memory cache check (instant)
      if (this.memoryCache.has(cacheKey)) {
        this.cacheStats.hits++
        return {
          url: this.memoryCache.get(cacheKey)!,
          source: 'memory',
          cached: true,
          fallback: false,
        }
      }

      // 2. API cache check (server-side database lookup)
      const cached = await this.checkApiCache(teamName, sport, 'team')
      structuredLogger.debug('API cache check result', {
        teamName,
        sport,
        league,
        cached: !!cached,
        cachedUrl: cached?.url,
      })

      if (cached) {
        this.memoryCache.set(cacheKey, cached.url)
        this.cacheStats.hits++
        structuredLogger.debug('Using API cached logo', {
          teamName,
          sport,
          league,
          url: cached.url,
        })
        return {
          url: cached.url,
          source: 'database',
          cached: true,
          fallback: false,
        }
      }

      // 3. Try ESPN CDN
      structuredLogger.debug('Attempting ESPN CDN fallback', {
        teamName,
        sport,
        league,
      })

      const espnUrl = await espnCDNMapper.getTeamLogoURL(teamName, sport, league)
      structuredLogger.debug('ESPN CDN result', {
        teamName,
        sport,
        league,
        espnUrl: espnUrl || 'null',
      })

      if (espnUrl) {
        this.memoryCache.set(cacheKey, espnUrl)
        this.cacheStats.misses++
        structuredLogger.debug('Using ESPN CDN logo', {
          teamName,
          sport,
          league,
          url: espnUrl,
        })
        return {
          url: espnUrl,
          source: 'espn-cdn',
          cached: false,
          fallback: false,
        }
      }

      // 4. Static fallback (ALWAYS WORKS)
      structuredLogger.warn('All logo sources failed, using static fallback', {
        teamName,
        sport,
        league,
        apiCacheFailed: !cached,
        espnCdnFailed: !espnUrl,
      })

      const staticFallback = fallbackImageService.getGenericFallback('team')
      this.memoryCache.set(cacheKey, staticFallback)
      this.cacheStats.fallbacks++

      structuredLogger.debug('Using static fallback', {
        teamName,
        sport,
        league,
        fallbackUrl: staticFallback,
      })

      return {
        url: staticFallback,
        source: 'static',
        cached: false,
        fallback: true,
      }
    } catch (error) {
      structuredLogger.error('Bulletproof image service failed', {
        teamName,
        sport,
        league,
        error: error instanceof Error ? error.message : String(error),
      })

      // Ultimate fallback - static image
      const staticFallback = fallbackImageService.getGenericFallback('team')
      return {
        url: staticFallback,
        source: 'static',
        cached: false,
        fallback: true,
      }
    }
  }

  /**
   * Get player photo with bulletproof fallback chain
   * ALWAYS returns valid image - never fails
   */
  async getPlayerPhoto(
    playerName: string,
    playerId: string,
    sport: string,
    teamName?: string
  ): Promise<BulletproofImageResult> {
    try {
      const cacheKey = `photo:${playerName}:${sport}:${playerId}`

      // 1. Memory cache check
      if (this.memoryCache.has(cacheKey)) {
        this.cacheStats.hits++
        return {
          url: this.memoryCache.get(cacheKey)!,
          source: 'memory',
          cached: true,
          fallback: false,
        }
      }

      // 2. API cache check
      const cached = await this.checkApiCache(playerName, sport, 'player')
      if (cached) {
        this.memoryCache.set(cacheKey, cached.url)
        this.cacheStats.hits++
        return {
          url: cached.url,
          source: 'database',
          cached: true,
          fallback: false,
        }
      }

      // 3. Try ESPN CDN
      const espnUrl = await espnCDNMapper.getPlayerPhotoURL(playerId, sport)
      if (espnUrl) {
        this.memoryCache.set(cacheKey, espnUrl)
        this.cacheStats.misses++
        return {
          url: espnUrl,
          source: 'espn-cdn',
          cached: false,
          fallback: false,
        }
      }

      // 4. Static fallback (ALWAYS WORKS)
      const staticFallback = fallbackImageService.getGenericFallback('player')
      this.memoryCache.set(cacheKey, staticFallback)
      this.cacheStats.fallbacks++

      return {
        url: staticFallback,
        source: 'static',
        cached: false,
        fallback: true,
      }
    } catch (error) {
      structuredLogger.error('Bulletproof player photo service failed', {
        playerName,
        playerId,
        sport,
        teamName,
        error: error instanceof Error ? error.message : String(error),
      })

      // Ultimate fallback - static image
      const staticFallback = fallbackImageService.getGenericFallback('player')
      return {
        url: staticFallback,
        source: 'static',
        cached: false,
        fallback: true,
      }
    }
  }

  /**
   * Check API cache - uses server-side API route
   */
  private async checkApiCache(
    name: string,
    sport: string,
    entity: 'team' | 'player'
  ): Promise<{ url: string; source: string } | null> {
    try {
      // Skip API calls during build phase
      if (process.env.NEXT_PHASE === 'phase-production-build') {
        structuredLogger.debug('Skipping API cache check during build phase', {
          name,
          sport,
          entity,
        })
        return null
      }

      const params = new URLSearchParams({
        entity,
        name,
        sport,
      })

      const response = await fetch(`/api/images/cache?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        return {
          url: data.url,
          source: data.source,
        }
      }

      if (response.status === 404) {
        structuredLogger.debug('No cached image found in API', {
          name,
          sport,
          entity,
        })
        return null
      }

      throw new Error(`API cache check failed with status ${response.status}`)
    } catch (error) {
      structuredLogger.error('API cache check failed', {
        name,
        sport,
        entity,
        error: error instanceof Error ? error.message : String(error),
      })
      return null
    }
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.memoryCache.clear()
    espnCDNMapper.clearCache()
    this.cacheStats = { hits: 0, misses: 0, fallbacks: 0 }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    memory: number
    hits: number
    misses: number
    fallbacks: number
    hitRate: number
  } {
    const total = this.cacheStats.hits + this.cacheStats.misses
    return {
      memory: this.memoryCache.size,
      hits: this.cacheStats.hits,
      misses: this.cacheStats.misses,
      fallbacks: this.cacheStats.fallbacks,
      hitRate: total > 0 ? this.cacheStats.hits / total : 0,
    }
  }

  /**
   * Warm up cache with popular images
   */
  async warmupCache(teams: Array<{ name: string; sport: string; league: string }>): Promise<void> {
    structuredLogger.info('Starting cache warmup', { teamCount: teams.length })

    const promises = teams.map(async team => {
      try {
        await this.getTeamLogo(team.name, team.sport, team.league)
      } catch (error) {
        structuredLogger.error('Cache warmup failed for team', {
          team: team.name,
          sport: team.sport,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    })

    await Promise.allSettled(promises)
    structuredLogger.info('Cache warmup completed', this.getCacheStats())
  }
}

export const bulletproofImageService = BulletproofImageService.getInstance()
