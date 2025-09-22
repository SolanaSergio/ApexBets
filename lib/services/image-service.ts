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

      // In a real implementation, this would fetch from an API or database
      // For now, return a placeholder URL
      const logoUrl = this.generatePlaceholderLogoUrl(teamName, league, sport)
      
      // Cache the result
      this.cache.set(cacheKey, {
        url: logoUrl,
        cached: true
      })

      structuredLogger.cacheMiss(cacheKey)
      structuredLogger.debug('Generated team logo URL', { teamName, league, sport, logoUrl })

      return logoUrl

    } catch (error) {
      structuredLogger.error('Failed to get team logo URL', {
        teamName,
        league,
        sport,
        error: error instanceof Error ? error.message : String(error)
      })

      return this.getDefaultTeamLogoUrl()
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

      // In a real implementation, this would fetch from an API or database
      // For now, return a placeholder URL
      const photoUrl = this.generatePlaceholderPlayerPhotoUrl(playerId, sport)
      
      // Cache the result
      this.cache.set(cacheKey, {
        url: photoUrl,
        cached: true
      })

      structuredLogger.cacheMiss(cacheKey)
      structuredLogger.debug('Generated player photo URL', { playerId, sport, photoUrl })

      return photoUrl

    } catch (error) {
      structuredLogger.error('Failed to get player photo URL', {
        playerId,
        sport,
        error: error instanceof Error ? error.message : String(error)
      })

      return this.getDefaultPlayerPhotoUrl()
    }
  }

  private generatePlaceholderLogoUrl(teamName: string, _league?: string, _sport?: string): string {
    // Generate a placeholder logo URL based on team name
    const encodedTeamName = encodeURIComponent(teamName)
    const size = '200x200'
    
    // Use a placeholder service or generate a simple URL
    return `https://via.placeholder.com/${size}/4A90E2/FFFFFF?text=${encodedTeamName}`
  }

  private generatePlaceholderPlayerPhotoUrl(_playerId: string, sport?: string): string {
    // Generate a placeholder player photo URL
    const size = '150x150'
    const sportIcon = this.getSportIcon(sport)
    
    return `https://via.placeholder.com/${size}/2ECC71/FFFFFF?text=${sportIcon}`
  }

  private getSportIcon(sport?: string): string {
    const icons: { [key: string]: string } = {
      basketball: '🏀',
      football: '🏈',
      soccer: '⚽',
      baseball: '⚾',
      hockey: '🏒',
      tennis: '🎾',
      golf: '⛳'
    }
    
    return icons[sport || 'unknown'] || '👤'
  }

  private getDefaultTeamLogoUrl(): string {
    return 'https://via.placeholder.com/200x200/CCCCCC/FFFFFF?text=Team'
  }

  private getDefaultPlayerPhotoUrl(): string {
    return 'https://via.placeholder.com/150x150/CCCCCC/FFFFFF?text=Player'
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
  teamLogos: 'placeholder',
  playerPhotos: 'placeholder'
}

export function getSportsImageUrl(category: string, options?: { width?: number; height?: number }): string {
  const width = options?.width || 200
  const height = options?.height || 200
  const map: Record<string, string> = {
    team: `https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=${width}&h=${height}&auto=format&fit=crop`,
    player: `https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=${width}&h=${height}&auto=format&fit=crop`,
    sports: `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=${width}&h=${height}&auto=format&fit=crop`
  }
  return map[category] || `https://via.placeholder.com/${width}x${height}/CCCCCC/FFFFFF?text=Image`
}

export function getFallbackImageUrl(type: 'team' | 'player' | 'sports' = 'sports'): string {
  if (type === 'team') {
    return 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=150&h=150&auto=format&fit=crop'
  }
  if (type === 'player') {
    return 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=150&h=150&auto=format&fit=crop'
  }
  return 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=400&h=250&auto=format&fit=crop'
}
