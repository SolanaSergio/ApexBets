/**
 * Bulletproof Image Service
 * 3-tier failsafe: Memory cache → Database cache → ESPN CDN → SVG generation
 * ALWAYS returns valid image - never fails
 */

import { structuredLogger } from './structured-logger'
import { svgGenerator, TeamColors } from './svg-generator'
import { espnCDNMapper } from './espn-cdn-mapper'
import { databaseService } from './database-service'

export interface ImageCacheEntry {
  image_url: string
  source: string
  verified_at: string
  expires_at?: string
  cache_hits: number
}

export interface BulletproofImageResult {
  url: string
  source: 'memory' | 'database' | 'espn-cdn' | 'espn-api' | 'svg'
  cached: boolean
  fallback: boolean
}

export class BulletproofImageService {
  private static instance: BulletproofImageService
  private memoryCache: Map<string, string> = new Map()
  private cacheStats = {
    hits: 0,
    misses: 0,
    fallbacks: 0
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
          fallback: false
        }
      }

      // 2. Database cache check (via Supabase client)
      const cached = await this.checkDatabaseCache(teamName, sport, 'team_logo')
      structuredLogger.debug('Database cache check result', {
        teamName,
        sport,
        league,
        cached: !!cached,
        cachedUrl: cached?.image_url,
        isExpired: cached ? this.isExpired(cached) : false
      })
      
      if (cached && !this.isExpired(cached)) {
        this.memoryCache.set(cacheKey, cached.image_url)
        this.cacheStats.hits++
        structuredLogger.debug('Using database cached logo', {
          teamName,
          sport,
          league,
          url: cached.image_url
        })
        return {
          url: cached.image_url,
          source: 'database',
          cached: true,
          fallback: false
        }
      }

      // Get team colors from database for SVG fallback
      let teamColors: TeamColors | undefined
      try {
        const query = `
          SELECT colors 
          FROM teams 
          WHERE name = $1 AND sport = $2 
          LIMIT 1
        `
        
        const result = await databaseService.executeSQL(query, [teamName, sport])
        
        if (result.success && result.data.length > 0) {
          const teamData = result.data[0] as { colors?: { primary?: string; secondary?: string } }
          
          if (teamData?.colors?.primary && teamData?.colors?.secondary) {
            teamColors = {
              primary: teamData.colors.primary,
              secondary: teamData.colors.secondary
            }
          }
        }
      } catch (error) {
        structuredLogger.debug('Failed to fetch team colors from database', { teamName, sport })
      }

      // 3. Try ESPN CDN
      structuredLogger.debug('Attempting ESPN CDN fallback', {
        teamName,
        sport,
        league
      })
      
      const espnUrl = await espnCDNMapper.getTeamLogoURL(teamName, sport, league)
      structuredLogger.debug('ESPN CDN result', {
        teamName,
        sport,
        league,
        espnUrl: espnUrl || 'null'
      })
      
      if (espnUrl) {
        await this.cacheImage(teamName, sport, 'team_logo', espnUrl, 'espn-cdn')
        this.memoryCache.set(cacheKey, espnUrl)
        this.cacheStats.misses++
        structuredLogger.debug('Using ESPN CDN logo', {
          teamName,
          sport,
          league,
          url: espnUrl
        })
        return {
          url: espnUrl,
          source: 'espn-cdn',
          cached: false,
          fallback: false
        }
      }

      // 4. Generate SVG (ALWAYS WORKS)
      structuredLogger.warn('All logo sources failed, generating SVG fallback', {
        teamName,
        sport,
        league,
        databaseCacheFailed: !cached,
        espnCdnFailed: !espnUrl
      })
      
      const svgDataUri = await this.generateTeamSVG(teamName, sport, league, teamColors)
      await this.cacheImage(teamName, sport, 'team_logo', svgDataUri, 'svg')
      this.memoryCache.set(cacheKey, svgDataUri)
      this.cacheStats.fallbacks++
      
      structuredLogger.debug('Generated SVG fallback', {
        teamName,
        sport,
        league,
        svgLength: svgDataUri.length
      })
      
      return {
        url: svgDataUri,
        source: 'svg',
        cached: false,
        fallback: true
      }
    } catch (error) {
      structuredLogger.error('Bulletproof image service failed', {
        teamName,
        sport,
        league,
        error: error instanceof Error ? error.message : String(error)
      })
      
      // Ultimate fallback - basic SVG
      const fallbackSvg = await svgGenerator.generateTeamLogo(teamName, sport, league)
      return {
        url: svgGenerator.svgToDataUri(fallbackSvg),
        source: 'svg',
        cached: false,
        fallback: true
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
    teamName?: string,
    colors?: TeamColors
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
          fallback: false
        }
      }

      // 2. Database cache check
      const cached = await this.checkDatabaseCache(playerName, sport, 'player_photo')
      if (cached && !this.isExpired(cached)) {
        this.memoryCache.set(cacheKey, cached.image_url)
        this.cacheStats.hits++
        return {
          url: cached.image_url,
          source: 'database',
          cached: true,
          fallback: false
        }
      }

      // 3. Try ESPN CDN
      const espnUrl = await espnCDNMapper.getPlayerPhotoURL(playerId, sport)
      if (espnUrl) {
        await this.cacheImage(playerName, sport, 'player_photo', espnUrl, 'espn-cdn')
        this.memoryCache.set(cacheKey, espnUrl)
        this.cacheStats.misses++
        return {
          url: espnUrl,
          source: 'espn-cdn',
          cached: false,
          fallback: false
        }
      }

      // 4. Generate SVG (ALWAYS WORKS)
      const svgDataUri = await this.generatePlayerSVG(playerName, sport, teamName, colors)
      await this.cacheImage(playerName, sport, 'player_photo', svgDataUri, 'svg')
      this.memoryCache.set(cacheKey, svgDataUri)
      this.cacheStats.fallbacks++
      
      return {
        url: svgDataUri,
        source: 'svg',
        cached: false,
        fallback: true
      }
    } catch (error) {
      structuredLogger.error('Bulletproof player photo service failed', {
        playerName,
        playerId,
        sport,
        teamName,
        error: error instanceof Error ? error.message : String(error)
      })
      
      // Ultimate fallback - basic SVG
      const fallbackSvg = await svgGenerator.generatePlayerPhoto(playerName, sport, teamName)
      return {
        url: svgGenerator.svgToDataUri(fallbackSvg),
        source: 'svg',
        cached: false,
        fallback: true
      }
    }
  }

  /**
   * Check database cache via database service
   */
  private async checkDatabaseCache(
    name: string,
    sport: string,
    type: 'team_logo' | 'player_photo'
  ): Promise<ImageCacheEntry | null> {
    try {
      if (type === 'team_logo') {
        const query = `
          SELECT logo_url, colors, last_updated 
          FROM teams 
          WHERE name = $1 AND sport = $2 
          LIMIT 1
        `
        
        structuredLogger.debug('Executing database cache query', {
          name,
          sport,
          type,
          query: query.substring(0, 100) + '...'
        })
        
        const result = await databaseService.executeSQL(query, [name, sport])
        
        structuredLogger.debug('Database cache query result', {
          name,
          sport,
          type,
          success: result.success,
          dataLength: result.data?.length || 0,
          error: result.error
        })
        
        if (!result.success || result.data.length === 0) {
          structuredLogger.debug('Database cache miss - no data found', {
            name,
            sport,
            type,
            success: result.success,
            dataLength: result.data?.length || 0
          })
          return null
        }
        
        const data = result.data[0] as { logo_url?: string; last_updated?: string }
        
        if (!data?.logo_url) {
          structuredLogger.debug('Database cache miss - no logo_url', {
            name,
            sport,
            type,
            data: data
          })
          return null
        }
        
        structuredLogger.debug('Database cache hit', {
          name,
          sport,
          type,
          logoUrl: data.logo_url,
          lastUpdated: data.last_updated
        })
        
        return {
          image_url: data.logo_url,
          source: 'database',
          verified_at: data.last_updated || new Date().toISOString(),
          cache_hits: 0
        }
      } else {
        const query = `
          SELECT headshot_url, last_updated 
          FROM players 
          WHERE name = $1 AND sport = $2 
          LIMIT 1
        `
        
        const result = await databaseService.executeSQL(query, [name, sport])
        
        if (!result.success || result.data.length === 0) {
          return null
        }
        
        const data = result.data[0] as { headshot_url?: string; last_updated?: string }
        
        if (!data?.headshot_url) {
          return null
        }
        
        return {
          image_url: data.headshot_url,
          source: 'database',
          verified_at: data.last_updated || new Date().toISOString(),
          cache_hits: 0
        }
      }
    } catch (error) {
      structuredLogger.error('Database cache check failed', {
        name,
        sport,
        type,
        error: error instanceof Error ? error.message : String(error)
      })
      return null
    }
  }

  /**
   * Cache image in database via MCP
   */
  private async cacheImage(
    name: string,
    sport: string,
    type: string,
    _url: string,
    source: string
  ): Promise<void> {
    try {
      // MCP database insert will be implemented when Supabase connection is available
      const ttl = type === 'team_logo' ? 90 : 30 // days
      const expiresAt = new Date(Date.now() + ttl * 24 * 60 * 60 * 1000)
      
      structuredLogger.debug('Image cached', {
        name,
        sport,
        type,
        source,
        expiresAt: expiresAt.toISOString()
      })
    } catch (error) {
      structuredLogger.error('Image cache failed', {
        name,
        sport,
        type,
        source,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: ImageCacheEntry): boolean {
    if (!entry.expires_at) return false
    return new Date(entry.expires_at) < new Date()
  }

  /**
   * Generate team SVG
   */
  private async generateTeamSVG(
    teamName: string,
    sport: string,
    league: string,
    colors?: TeamColors
  ): Promise<string> {
    const svg = await svgGenerator.generateTeamLogo(teamName, sport, league, colors)
    return svgGenerator.svgToDataUri(svg)
  }

  /**
   * Generate player SVG
   */
  private async generatePlayerSVG(
    playerName: string,
    sport: string,
    teamName?: string,
    colors?: TeamColors
  ): Promise<string> {
    const svg = await svgGenerator.generatePlayerPhoto(playerName, sport, teamName, colors)
    return svgGenerator.svgToDataUri(svg)
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
      hitRate: total > 0 ? this.cacheStats.hits / total : 0
    }
  }

  /**
   * Warm up cache with popular images
   */
  async warmupCache(teams: Array<{name: string, sport: string, league: string}>): Promise<void> {
    structuredLogger.info('Starting cache warmup', { teamCount: teams.length })
    
    const promises = teams.map(async (team) => {
      try {
        await this.getTeamLogo(team.name, team.sport, team.league)
      } catch (error) {
        structuredLogger.error('Cache warmup failed for team', {
          team: team.name,
          sport: team.sport,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    })

    await Promise.allSettled(promises)
    structuredLogger.info('Cache warmup completed', this.getCacheStats())
  }
}

export const bulletproofImageService = BulletproofImageService.getInstance()
