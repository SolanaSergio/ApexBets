/**
 * Image Service
 * Handles team logos and player photos
 */

import { structuredLogger } from './structured-logger'

export interface ImageResult {
  url: string
  width?: number
  height?: number
  format?: string
  cached: boolean
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

  async getTeamLogoUrl(teamName: string, league?: string, sport?: string): Promise<string> {
    try {
      const cacheKey = `team_logo_${teamName}_${league}_${sport}`
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey)!
        structuredLogger.cacheHit(cacheKey)
        return cached.url
      }

      // Fetch from database via MCP - no mock data allowed
      const logoUrl = await this.fetchTeamLogoFromDatabase(teamName, league, sport)
      
      if (logoUrl) {
        // Cache the result
        this.cache.set(cacheKey, {
          url: logoUrl,
          cached: true
        })

        structuredLogger.cacheMiss(cacheKey)
        structuredLogger.debug('Fetched team logo URL from database', { teamName, league, sport, logoUrl })

        return logoUrl
      }

      // No logo found - return empty string per no-mock-data rule
      structuredLogger.debug('No team logo found in database', { teamName, league, sport })
      return ''

    } catch (error) {
      structuredLogger.error('Failed to get team logo URL', {
        teamName,
        league,
        sport,
        error: error instanceof Error ? error.message : String(error)
      })

      // Return empty string instead of placeholder per no-mock-data rule
      return ''
    }
  }

  async getPlayerPhotoUrl(playerId: string, sport?: string): Promise<string> {
    try {
      const cacheKey = `player_photo_${playerId}_${sport}`
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey)!
        structuredLogger.cacheHit(cacheKey)
        return cached.url
      }

      // Fetch from database via MCP - no mock data allowed
      const photoUrl = await this.fetchPlayerPhotoFromDatabase(playerId, sport)
      
      if (photoUrl) {
        // Cache the result
        this.cache.set(cacheKey, {
          url: photoUrl,
          cached: true
        })

        structuredLogger.cacheMiss(cacheKey)
        structuredLogger.debug('Fetched player photo URL from database', { playerId, sport, photoUrl })

        return photoUrl
      }

      // No photo found - return empty string per no-mock-data rule
      structuredLogger.debug('No player photo found in database', { playerId, sport })
      return ''

    } catch (error) {
      structuredLogger.error('Failed to get player photo URL', {
        playerId,
        sport,
        error: error instanceof Error ? error.message : String(error)
      })

      // Return empty string instead of placeholder per no-mock-data rule
      return ''
    }
  }

  private async fetchTeamLogoFromDatabase(teamName: string, league?: string, sport?: string): Promise<string | null> {
    try {
      // Import MCP database service
      const { mcpDatabaseService } = await import('./mcp-database-service')
      
      const query = `
        SELECT logo_url 
        FROM teams 
        WHERE name = $1 
        AND ($2::text IS NULL OR league = $2)
        AND ($3::text IS NULL OR sport = $3)
        LIMIT 1
      `
      
      const result = await mcpDatabaseService.executeSQL(query, [teamName, league, sport])
      
      if (result.success && result.data && result.data.length > 0) {
        return result.data[0].logo_url
      }
      
      return null
    } catch (error) {
      structuredLogger.error('Failed to fetch team logo from database', {
        teamName,
        league,
        sport,
        error: error instanceof Error ? error.message : String(error)
      })
      return null
    }
  }

  private async fetchPlayerPhotoFromDatabase(playerId: string, sport?: string): Promise<string | null> {
    try {
      // Import MCP database service
      const { mcpDatabaseService } = await import('./mcp-database-service')
      
      const query = `
        SELECT photo_url 
        FROM players 
        WHERE id = $1 
        AND ($2::text IS NULL OR sport = $2)
        LIMIT 1
      `
      
      const result = await mcpDatabaseService.executeSQL(query, [playerId, sport])
      
      if (result.success && result.data && result.data.length > 0) {
        return result.data[0].photo_url
      }
      
      return null
    } catch (error) {
      structuredLogger.error('Failed to fetch player photo from database', {
        playerId,
        sport,
        error: error instanceof Error ? error.message : String(error)
      })
      return null
    }
  }

  async optimizeImage(url: string, width?: number, height?: number): Promise<ImageResult> {
    try {
      // In a real implementation, this would use an image optimization service
      // For now, return the original URL with optimization parameters
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
    structuredLogger.info('Image service cache cleared')
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

export const imageService = ImageService.getInstance()

// Export convenience functions
export const getTeamLogoUrl = (teamName: string, league?: string, sport?: string) => 
  imageService.getTeamLogoUrl(teamName, league, sport)

export const getPlayerPhotoUrl = (playerId: string, sport?: string) => 
  imageService.getPlayerPhotoUrl(playerId, sport)

// Align with components/ui/sports-image expected exports (non-breaking stubs)
export type SportsLeague = string
export interface TeamLogoConfig { teamName: string; league?: string; sport?: string }
export interface PlayerPhotoConfig { playerId: string; sport?: string }

export const IMAGE_SOURCES = {
  teamLogos: 'database',
  playerPhotos: 'database'
}

export function getSportsImageUrl(_category: string, _options?: { width?: number; height?: number }): string {
  // No mock data - return empty string per compliance rules
  return ''
}

export function getFallbackImageUrl(_type: 'team' | 'player' | 'sports' = 'sports'): string {
  // No mock data - return empty string per compliance rules
  return ''
}
