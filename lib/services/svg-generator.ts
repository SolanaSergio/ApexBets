/**
 * Fallback Image Service
 * Provides static fallback image URLs for teams and players
 * No database dependencies - client-safe
 */

export interface TeamColors {
  primary: string
  secondary: string
}

export interface SVGConfig {
  width: number
  height: number
  shape: 'circle' | 'square' | 'hexagon' | 'shield'
  pattern: 'solid' | 'gradient' | 'striped'
}

export class FallbackImageService {
  private static instance: FallbackImageService

  public static getInstance(): FallbackImageService {
    if (!FallbackImageService.instance) {
      FallbackImageService.instance = new FallbackImageService()
    }
    return FallbackImageService.instance
  }

  /**
   * Get team logo fallback URL
   * Returns static fallback image URL
   */
  async getTeamLogoFallback(
    _teamName: string,
    _sport: string,
    _league: string,
    _colors?: TeamColors,
    _config?: Partial<SVGConfig>
  ): Promise<string> {
    // Return static fallback image URL
    return '/images/fallbacks/team.png'
  }

  /**
   * Get player photo fallback URL
   * Returns static fallback image URL
   */
  async getPlayerPhotoFallback(
    _playerName: string,
    _sport: string,
    _teamName?: string,
    _colors?: TeamColors,
    _config?: Partial<SVGConfig>
  ): Promise<string> {
    // Return static fallback image URL
    return '/images/fallbacks/player.png'
  }

  /**
   * Get generic fallback image URL
   * Returns static fallback image URL
   */
  getGenericFallback(type: 'team' | 'player' | 'sports' = 'sports'): string {
    switch (type) {
      case 'team':
        return '/images/fallbacks/team.png'
      case 'player':
        return '/images/fallbacks/player.png'
      case 'sports':
      default:
        return '/images/fallbacks/sports.png'
    }
  }
}

export const fallbackImageService = FallbackImageService.getInstance()

// Legacy exports for backward compatibility
export const svgGenerator = fallbackImageService
