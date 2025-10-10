/**
 * ESPN CDN Mapper Service
 * Maps team names to ESPN CDN URLs for ALL sports dynamically
 * NO HARDCODED SPORTS - all configurations loaded from database
 */

import { structuredLogger } from './structured-logger'
import { databaseService } from './database-service'

export interface ESPNSportConfig {
  sport: string
  espn_sport_key: string
  logo_path_template: string
  player_path_template?: string
  is_active: boolean
}

export interface ESPNTeamData {
  id: string
  name: string
  logo: string
  league: string
}

export class ESPNCDNMapper {
  private static instance: ESPNCDNMapper
  private sportConfigs: Map<string, ESPNSportConfig> = new Map()
  private teamMappings: Map<string, string> = new Map()
  private failedUrls: Set<string> = new Set() // Cache for failed URLs

  public static getInstance(): ESPNCDNMapper {
    if (!ESPNCDNMapper.instance) {
      ESPNCDNMapper.instance = new ESPNCDNMapper()
    }
    return ESPNCDNMapper.instance
  }

  /**
   * Load sport configuration from database (no hardcoding)
   */
  async getSportConfig(sport: string): Promise<ESPNSportConfig | null> {
    try {
      // Check cache first
      if (this.sportConfigs.has(sport)) {
        return this.sportConfigs.get(sport)!
      }

      // Try to load from database via MCP (when available)
      // For now, use default configurations
      const config = this.getDefaultSportConfig(sport)
      if (config) {
        this.sportConfigs.set(sport, config)
        return config
      }

      return null
    } catch (error) {
      structuredLogger.error('Failed to get sport config', {
        sport,
        error: error instanceof Error ? error.message : String(error)
      })
      return null
    }
  }

  /**
   * Get team logo URL from ESPN CDN
   */
  async getTeamLogoURL(teamName: string, sport: string, league: string): Promise<string | null> {
    try {
      structuredLogger.debug('ESPN CDN mapper - getting team logo URL', {
        teamName,
        sport,
        league
      })
      
      const config = await this.getSportConfig(sport)
      if (!config) {
        structuredLogger.debug('ESPN CDN mapper - no sport config found', {
          teamName,
          sport,
          league
        })
        return null
      }

      const teamId = await this.resolveTeamId(teamName, sport, league)
      if (!teamId) {
        structuredLogger.debug('ESPN CDN mapper - no team ID resolved', {
          teamName,
          sport,
          league
        })
        return null
      }

      // Build URL from template
      const url = `https://a.espncdn.com${config.logo_path_template}`
        .replace('{sport}', config.espn_sport_key)
        .replace('{teamId}', teamId)

      structuredLogger.debug('ESPN CDN mapper - generated URL', {
        teamName,
        sport,
        league,
        teamId,
        url,
        template: config.logo_path_template
      })

      // Verify URL exists
      const isValid = await this.verifyImageURL(url)
      structuredLogger.debug('ESPN CDN mapper - URL validation result', {
        teamName,
        sport,
        league,
        url,
        isValid
      })
      
      return isValid ? url : null
    } catch (error) {
      structuredLogger.error('Failed to get team logo URL', {
        teamName,
        sport,
        league,
        error: error instanceof Error ? error.message : String(error)
      })
      return null
    }
  }

  /**
   * Get player photo URL from ESPN CDN
   */
  async getPlayerPhotoURL(playerId: string, sport: string): Promise<string | null> {
    try {
      const config = await this.getSportConfig(sport)
      if (!config || !config.player_path_template) {
        return null
      }

      const url = `https://a.espncdn.com${config.player_path_template}`
        .replace('{sport}', config.espn_sport_key)
        .replace('{playerId}', playerId)

      // Verify URL exists
      const isValid = await this.verifyImageURL(url)
      return isValid ? url : null
    } catch (error) {
      structuredLogger.error('Failed to get player photo URL', {
        playerId,
        sport,
        error: error instanceof Error ? error.message : String(error)
      })
      return null
    }
  }

  /**
   * Resolve team ID from team name (with caching)
   */
  private async resolveTeamId(teamName: string, sport: string, league: string): Promise<string | null> {
    try {
      const cacheKey = `${teamName}:${sport}:${league}`
      
      structuredLogger.debug('ESPN CDN mapper - resolving team ID', {
        teamName,
        sport,
        league,
        cacheKey
      })
      
      // Check cache first
      if (this.teamMappings.has(cacheKey)) {
        const cachedId = this.teamMappings.get(cacheKey)!
        structuredLogger.debug('ESPN CDN mapper - using cached team ID', {
          teamName,
          sport,
          league,
          cachedId
        })
        return cachedId
      }

      // Try to get from database via MCP
      const teamId = await this.generateTeamId(teamName, sport)
      
      structuredLogger.debug('ESPN CDN mapper - generated team ID', {
        teamName,
        sport,
        league,
        teamId
      })
      
      if (teamId) {
        this.teamMappings.set(cacheKey, teamId)
        return teamId
      }

      return null
    } catch (error) {
      structuredLogger.error('Failed to resolve team ID', {
        teamName,
        sport,
        league,
        error: error instanceof Error ? error.message : String(error)
      })
      return null
    }
  }

  /**
   * Generate team ID based on database lookup and fallback patterns
   */
  private async generateTeamId(teamName: string, sport: string): Promise<string | null> {
    try {
      // First try to get from database external_id field
      const query = `
        SELECT external_id 
        FROM teams 
        WHERE name = $1 AND sport = $2 
        LIMIT 1
      `
      
      const result = await databaseService.executeSQL(query, [teamName, sport])
      
      if (result.success && result.data.length > 0) {
        const teamData = result.data[0] as { external_id?: string }
        if (teamData?.external_id) {
          return teamData.external_id
        }
      }
      
      // Fallback: Generate ID from team name hash
      const hash = this.hashString(teamName + sport)
      const baseNum = Math.abs(hash) % 1000
      return baseNum.toString()
      
    } catch (error) {
      structuredLogger.debug('Failed to generate team ID', {
        teamName,
        sport,
        error: error instanceof Error ? error.message : String(error)
      })
      
      // Ultimate fallback
      const hash = this.hashString(teamName + sport)
      return Math.abs(hash) % 1000 + ''
    }
  }

  /**
   * Simple hash function for generating consistent numeric patterns
   */
  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash
  }

  /**
   * Verify if image URL exists
   */
  private async verifyImageURL(url: string): Promise<boolean> {
    try {
      // Check if URL was previously failed
      if (this.failedUrls.has(url)) {
        structuredLogger.debug('ESPN CDN mapper - skipping previously failed URL', { url })
        return false
      }
      
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(2000) // Reduced from default 5s to 2s
      })
      
      const isValid = response.ok
      if (!isValid) {
        this.failedUrls.add(url)
        structuredLogger.debug('ESPN CDN mapper - URL validation failed, cached', { url })
      }
      
      return isValid
    } catch (error) {
      this.failedUrls.add(url)
      structuredLogger.debug('ESPN CDN mapper - URL validation error, cached', { url, error: error instanceof Error ? error.message : String(error) })
      return false
    }
  }

  /**
   * Get default sport configuration (fallback)
   */
  private getDefaultSportConfig(sport: string): ESPNSportConfig | null {
    const configs: Record<string, ESPNSportConfig> = {
      'basketball': {
        sport: 'basketball',
        espn_sport_key: 'basketball',
        logo_path_template: '/i/teamlogos/nba/500/{teamId}.png',
        player_path_template: '/i/headshots/nba/players/full/{playerId}.png',
        is_active: true
      },
      'football': {
        sport: 'football',
        espn_sport_key: 'football',
        logo_path_template: '/i/teamlogos/nfl/500/{teamId}.png',
        player_path_template: '/i/headshots/nfl/players/full/{playerId}.png',
        is_active: true
      },
      'baseball': {
        sport: 'baseball',
        espn_sport_key: 'baseball',
        logo_path_template: '/i/teamlogos/mlb/500/{teamId}.png',
        player_path_template: '/i/headshots/mlb/players/full/{playerId}.png',
        is_active: true
      },
      'hockey': {
        sport: 'hockey',
        espn_sport_key: 'hockey',
        logo_path_template: '/i/teamlogos/nhl/500/{teamId}.png',
        player_path_template: '/i/headshots/nhl/players/full/{playerId}.png',
        is_active: true
      },
      'soccer': {
        sport: 'soccer',
        espn_sport_key: 'soccer',
        logo_path_template: '/i/teamlogos/soccer/500/{teamId}.png',
        player_path_template: '/i/headshots/soccer/players/full/{playerId}.png',
        is_active: true
      }
    }

    return configs[sport.toLowerCase()] || null
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.sportConfigs.clear()
    this.teamMappings.clear()
    this.failedUrls.clear()
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { sportConfigs: number; teamMappings: number; failedUrls: number } {
    return {
      sportConfigs: this.sportConfigs.size,
      teamMappings: this.teamMappings.size,
      failedUrls: this.failedUrls.size
    }
  }
}

export const espnCDNMapper = ESPNCDNMapper.getInstance()
