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

      // Load from database via databaseService
      const result = await databaseService.executeSQL(`
        SELECT logo_template, player_template, cdn_config
        FROM sports 
        WHERE name = $1 AND is_active = true
        LIMIT 1
      `, [sport])

      if (!result.success || !result.data || result.data.length === 0) {
        structuredLogger.warn('Sport configuration not found in database', { sport })
        return null
      }

      const sportData = result.data[0] as any
      const config: ESPNSportConfig = {
        sport,
        espn_sport_key: sport,
        logo_path_template: sportData.logo_template || '/i/teamlogos/default/500/{teamId}.png',
        player_path_template: sportData.player_template || '/i/headshots/default/players/full/{playerId}.png',
        is_active: true
      }

      this.sportConfigs.set(sport, config)
      return config
    } catch (error) {
      structuredLogger.error('Failed to get sport config from database', {
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

      // Get team ID from database
      const result = await databaseService.executeSQL(`
        SELECT cdn_team_id
        FROM team_cdn_mappings 
        WHERE team_name = $1 AND sport = $2 AND league = $3 AND cdn_provider = 'espn' AND is_active = true
        LIMIT 1
      `, [teamName, sport, league])
      
      if (result.success && result.data && result.data.length > 0) {
        const teamId = result.data[0].cdn_team_id
        structuredLogger.debug('ESPN CDN mapper - found team ID in database', {
          teamName,
          sport,
          league,
          teamId
        })
        
        this.teamMappings.set(cacheKey, teamId)
        return teamId
      }

      structuredLogger.debug('ESPN CDN mapper - no team ID found in database', {
        teamName,
        sport,
        league
      })
      return null
    } catch (error) {
      structuredLogger.error('Failed to resolve team ID from database', {
        teamName,
        sport,
        league,
        error: error instanceof Error ? error.message : String(error)
      })
      return null
    }
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
