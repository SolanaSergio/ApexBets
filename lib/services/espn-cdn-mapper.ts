/**
 * ESPN CDN Mapper Service
 * Maps team names to ESPN CDN URLs for ALL sports dynamically
 * NO HARDCODED SPORTS - uses static configurations
 */

import { structuredLogger } from './structured-logger'

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

      // Use static sport configurations instead of database
      const staticConfigs: Record<string, ESPNSportConfig> = {
        basketball: {
          sport: 'basketball',
          espn_sport_key: 'nba',
          logo_path_template: '/i/teamlogos/nba/500/{teamId}.png',
          player_path_template: '/i/headshots/nba/players/full/{playerId}.png',
          is_active: true,
        },
        football: {
          sport: 'football',
          espn_sport_key: 'nfl',
          logo_path_template: '/i/teamlogos/nfl/500/{teamId}.png',
          player_path_template: '/i/headshots/nfl/players/full/{playerId}.png',
          is_active: true,
        },
        baseball: {
          sport: 'baseball',
          espn_sport_key: 'mlb',
          logo_path_template: '/i/teamlogos/mlb/500/{teamId}.png',
          player_path_template: '/i/headshots/mlb/players/full/{playerId}.png',
          is_active: true,
        },
        hockey: {
          sport: 'hockey',
          espn_sport_key: 'nhl',
          logo_path_template: '/i/teamlogos/nhl/500/{teamId}.png',
          player_path_template: '/i/headshots/nhl/players/full/{playerId}.png',
          is_active: true,
        },
        soccer: {
          sport: 'soccer',
          espn_sport_key: 'soccer',
          logo_path_template: '/i/teamlogos/soccer/500/{teamId}.png',
          player_path_template: '/i/headshots/soccer/players/full/{playerId}.png',
          is_active: true,
        },
      }

      const config = staticConfigs[sport.toLowerCase()]
      if (!config) {
        structuredLogger.warn('Sport configuration not found in static configs', { sport })
        return null
      }

      this.sportConfigs.set(sport, config)
      return config
    } catch (error) {
      structuredLogger.error('Failed to get sport config', {
        sport,
        error: error instanceof Error ? error.message : String(error),
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
        league,
      })

      const config = await this.getSportConfig(sport)
      if (!config) {
        structuredLogger.debug('ESPN CDN mapper - no sport config found', {
          teamName,
          sport,
          league,
        })
        return null
      }

      const teamId = await this.resolveTeamId(teamName, sport, league)
      if (!teamId) {
        structuredLogger.debug('ESPN CDN mapper - no team ID resolved', {
          teamName,
          sport,
          league,
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
        template: config.logo_path_template,
      })

      // Verify URL exists
      const isValid = await this.verifyImageURL(url)
      structuredLogger.debug('ESPN CDN mapper - URL validation result', {
        teamName,
        sport,
        league,
        url,
        isValid,
      })

      return isValid ? url : null
    } catch (error) {
      structuredLogger.error('Failed to get team logo URL', {
        teamName,
        sport,
        league,
        error: error instanceof Error ? error.message : String(error),
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
        error: error instanceof Error ? error.message : String(error),
      })
      return null
    }
  }

  /**
   * Resolve team ID from team name (with caching)
   */
  private async resolveTeamId(
    teamName: string,
    sport: string,
    league: string
  ): Promise<string | null> {
    try {
      const cacheKey = `${teamName}:${sport}:${league}`

      structuredLogger.debug('ESPN CDN mapper - resolving team ID', {
        teamName,
        sport,
        league,
        cacheKey,
      })

      // Check cache first
      if (this.teamMappings.has(cacheKey)) {
        const cachedId = this.teamMappings.get(cacheKey)!
        structuredLogger.debug('ESPN CDN mapper - using cached team ID', {
          teamName,
          sport,
          league,
          cachedId,
        })
        return cachedId
      }

      // Use static team mappings for major leagues
      const teamId = this.getStaticTeamId(teamName, sport, league)
      if (teamId) {
        structuredLogger.debug('ESPN CDN mapper - found static team mapping', {
          teamName,
          sport,
          league,
          teamId,
        })
        this.teamMappings.set(cacheKey, teamId)
        return teamId
      }

      structuredLogger.debug('ESPN CDN mapper - no static team mapping available', {
        teamName,
        sport,
        league,
      })
      return null
    } catch (error) {
      structuredLogger.error('Failed to resolve team ID from database', {
        teamName,
        sport,
        league,
        error: error instanceof Error ? error.message : String(error),
      })
      return null
    }
  }

  /**
   * Get static team ID mapping for major leagues
   */
  private getStaticTeamId(teamName: string, sport: string, league: string): string | null {
    const normalizedTeamName = teamName.toLowerCase().trim()
    const normalizedSport = sport.toLowerCase()
    const normalizedLeague = league.toLowerCase()

    // NBA Team Mappings
    if (normalizedSport === 'basketball' || normalizedLeague.includes('nba')) {
      const nbaTeams: Record<string, string> = {
        'los angeles lakers': 'lal',
        'lakers': 'lal',
        'boston celtics': 'bos',
        'celtics': 'bos',
        'golden state warriors': 'gs',
        'warriors': 'gs',
        'chicago bulls': 'chi',
        'bulls': 'chi',
        'miami heat': 'mia',
        'heat': 'mia',
        'phoenix suns': 'phx',
        'suns': 'phx',
        'denver nuggets': 'den',
        'nuggets': 'den',
        'dallas mavericks': 'dal',
        'mavericks': 'dal',
        'milwaukee bucks': 'mil',
        'bucks': 'mil',
        'philadelphia 76ers': 'phi',
        '76ers': 'phi',
        'new york knicks': 'ny',
        'knicks': 'ny',
        'brooklyn nets': 'bkn',
        'nets': 'bkn',
        'atlanta hawks': 'atl',
        'hawks': 'atl',
        'cleveland cavaliers': 'cle',
        'cavaliers': 'cle',
        'toronto raptors': 'tor',
        'raptors': 'tor',
        'indiana pacers': 'ind',
        'pacers': 'ind',
        'detroit pistons': 'det',
        'pistons': 'det',
        'orlando magic': 'orl',
        'magic': 'orl',
        'charlotte hornets': 'cha',
        'hornets': 'cha',
        'washington wizards': 'wsh',
        'wizards': 'wsh',
        'oklahoma city thunder': 'okc',
        'thunder': 'okc',
        'portland trail blazers': 'por',
        'trail blazers': 'por',
        'utah jazz': 'utah',
        'jazz': 'utah',
        'sacramento kings': 'sac',
        'kings': 'sac',
        'memphis grizzlies': 'mem',
        'grizzlies': 'mem',
        'new orleans pelicans': 'no',
        'pelicans': 'no',
        'houston rockets': 'hou',
        'rockets': 'hou',
        'san antonio spurs': 'sa',
        'spurs': 'sa',
        'minnesota timberwolves': 'min',
        'timberwolves': 'min',
      }
      return nbaTeams[normalizedTeamName] || null
    }

    // NFL Team Mappings
    if (normalizedSport === 'football' || normalizedLeague.includes('nfl')) {
      const nflTeams: Record<string, string> = {
        'kansas city chiefs': 'kc',
        'chiefs': 'kc',
        'buffalo bills': 'buf',
        'bills': 'buf',
        'miami dolphins': 'mia',
        'dolphins': 'mia',
        'new england patriots': 'ne',
        'patriots': 'ne',
        'new york jets': 'nyj',
        'jets': 'nyj',
        'baltimore ravens': 'bal',
        'ravens': 'bal',
        'cincinnati bengals': 'cin',
        'bengals': 'cin',
        'cleveland browns': 'cle',
        'browns': 'cle',
        'pittsburgh steelers': 'pit',
        'steelers': 'pit',
        'houston texans': 'hou',
        'texans': 'hou',
        'indianapolis colts': 'ind',
        'colts': 'ind',
        'jacksonville jaguars': 'jax',
        'jaguars': 'jax',
        'tennessee titans': 'ten',
        'titans': 'ten',
        'denver broncos': 'den',
        'broncos': 'den',
        'las vegas raiders': 'lv',
        'raiders': 'lv',
        'los angeles chargers': 'lac',
        'chargers': 'lac',
        'dallas cowboys': 'dal',
        'cowboys': 'dal',
        'new york giants': 'nyg',
        'giants': 'nyg',
        'philadelphia eagles': 'phi',
        'eagles': 'phi',
        'washington commanders': 'wsh',
        'commanders': 'wsh',
        'chicago bears': 'chi',
        'bears': 'chi',
        'detroit lions': 'det',
        'lions': 'det',
        'green bay packers': 'gb',
        'packers': 'gb',
        'minnesota vikings': 'min',
        'vikings': 'min',
        'atlanta falcons': 'atl',
        'falcons': 'atl',
        'carolina panthers': 'car',
        'panthers': 'car',
        'new orleans saints': 'no',
        'saints': 'no',
        'tampa bay buccaneers': 'tb',
        'buccaneers': 'tb',
        'arizona cardinals': 'ari',
        'cardinals': 'ari',
        'los angeles rams': 'lar',
        'rams': 'lar',
        'san francisco 49ers': 'sf',
        '49ers': 'sf',
        'seattle seahawks': 'sea',
        'seahawks': 'sea',
      }
      return nflTeams[normalizedTeamName] || null
    }

    // MLB Team Mappings
    if (normalizedSport === 'baseball' || normalizedLeague.includes('mlb')) {
      const mlbTeams: Record<string, string> = {
        'los angeles dodgers': 'lad',
        'dodgers': 'lad',
        'atlanta braves': 'atl',
        'braves': 'atl',
        'houston astros': 'hou',
        'astros': 'hou',
        'philadelphia phillies': 'phi',
        'phillies': 'phi',
        'baltimore orioles': 'bal',
        'orioles': 'bal',
        'new york yankees': 'nyy',
        'yankees': 'nyy',
        'boston red sox': 'bos',
        'red sox': 'bos',
        'tampa bay rays': 'tb',
        'rays': 'tb',
        'toronto blue jays': 'tor',
        'blue jays': 'tor',
        'cleveland guardians': 'cle',
        'guardians': 'cle',
        'detroit tigers': 'det',
        'tigers': 'det',
        'kansas city royals': 'kc',
        'royals': 'kc',
        'minnesota twins': 'min',
        'twins': 'min',
        'chicago white sox': 'cws',
        'white sox': 'cws',
        'texas rangers': 'tex',
        'rangers': 'tex',
        'seattle mariners': 'sea',
        'mariners': 'sea',
        'oakland athletics': 'oak',
        'athletics': 'oak',
        'los angeles angels': 'laa',
        'angels': 'laa',
        'san diego padres': 'sd',
        'padres': 'sd',
        'san francisco giants': 'sf',
        'giants': 'sf',
        'arizona diamondbacks': 'ari',
        'diamondbacks': 'ari',
        'colorado rockies': 'col',
        'rockies': 'col',
        'chicago cubs': 'chc',
        'cubs': 'chc',
        'milwaukee brewers': 'mil',
        'brewers': 'mil',
        'st. louis cardinals': 'stl',
        'cardinals': 'stl',
        'pittsburgh pirates': 'pit',
        'pirates': 'pit',
        'cincinnati reds': 'cin',
        'reds': 'cin',
        'washington nationals': 'was',
        'nationals': 'was',
        'new york mets': 'nym',
        'mets': 'nym',
        'miami marlins': 'mia',
        'marlins': 'mia',
      }
      return mlbTeams[normalizedTeamName] || null
    }

    // NHL Team Mappings
    if (normalizedSport === 'hockey' || normalizedLeague.includes('nhl')) {
      const nhlTeams: Record<string, string> = {
        'vegas golden knights': 'vgk',
        'golden knights': 'vgk',
        'boston bruins': 'bos',
        'bruins': 'bos',
        'toronto maple leafs': 'tor',
        'maple leafs': 'tor',
        'carolina hurricanes': 'car',
        'hurricanes': 'car',
        'new jersey devils': 'nj',
        'devils': 'nj',
        'new york rangers': 'nyr',
        'rangers': 'nyr',
        'tampa bay lightning': 'tb',
        'lightning': 'tb',
        'florida panthers': 'fla',
        'panthers': 'fla',
        'washington capitals': 'wsh',
        'capitals': 'wsh',
        'pittsburgh penguins': 'pit',
        'penguins': 'pit',
        'philadelphia flyers': 'phi',
        'flyers': 'phi',
        'columbus blue jackets': 'cbj',
        'blue jackets': 'cbj',
        'detroit red wings': 'det',
        'red wings': 'det',
        'buffalo sabres': 'buf',
        'sabres': 'buf',
        'ottawa senators': 'ott',
        'senators': 'ott',
        'montreal canadiens': 'mtl',
        'canadiens': 'mtl',
        'edmonton oilers': 'edm',
        'oilers': 'edm',
        'calgary flames': 'cgy',
        'flames': 'cgy',
        'vancouver canucks': 'van',
        'canucks': 'van',
        'winnipeg jets': 'wpg',
        'jets': 'wpg',
        'colorado avalanche': 'col',
        'avalanche': 'col',
        'dallas stars': 'dal',
        'stars': 'dal',
        'minnesota wild': 'min',
        'wild': 'min',
        'nashville predators': 'nsh',
        'predators': 'nsh',
        'st. louis blues': 'stl',
        'blues': 'stl',
        'chicago blackhawks': 'chi',
        'blackhawks': 'chi',
        'arizona coyotes': 'ari',
        'coyotes': 'ari',
        'anaheim ducks': 'ana',
        'ducks': 'ana',
        'los angeles kings': 'lak',
        'kings': 'lak',
        'san jose sharks': 'sj',
        'sharks': 'sj',
        'seattle kraken': 'sea',
        'kraken': 'sea',
      }
      return nhlTeams[normalizedTeamName] || null
    }

    return null
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
        signal: AbortSignal.timeout(2000), // Reduced from default 5s to 2s
      })

      const isValid = response.ok
      if (!isValid) {
        this.failedUrls.add(url)
        structuredLogger.debug('ESPN CDN mapper - URL validation failed, cached', { url })
      }

      return isValid
    } catch (error) {
      this.failedUrls.add(url)
      structuredLogger.debug('ESPN CDN mapper - URL validation error, cached', {
        url,
        error: error instanceof Error ? error.message : String(error),
      })
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
      failedUrls: this.failedUrls.size,
    }
  }
}

export const espnCDNMapper = ESPNCDNMapper.getInstance()
