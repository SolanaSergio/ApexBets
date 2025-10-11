/**
 * Logo Population Service
 * Automatically fetches and populates team logos from multiple sources
 * Uses ESPN CDN, SportsDB, and other reliable sources
 */

import { databaseService } from './database-service'
import { structuredLogger } from './structured-logger'

interface LogoSource {
  name: string
  baseUrl: string
  getTeamLogoUrl: (teamName: string, sport: string) => Promise<string | null>
  priority: number
}

interface TeamLogoResult {
  teamId: string
  teamName: string
  sport: string
  logoUrl: string | null
  source: string
  success: boolean
  error?: string
}

export class LogoPopulationService {
  private static instance: LogoPopulationService
  private logoSources: LogoSource[] = []

  public static getInstance(): LogoPopulationService {
    if (!LogoPopulationService.instance) {
      LogoPopulationService.instance = new LogoPopulationService()
    }
    return LogoPopulationService.instance
  }

  constructor() {
    this.initializeLogoSources()
  }

  private initializeLogoSources(): void {
    this.logoSources = [
      {
        name: 'espn-cdn',
        baseUrl: 'https://a.espncdn.com/i/teamlogos',
        getTeamLogoUrl: this.getESPNLogoUrl.bind(this),
        priority: 1,
      },
      {
        name: 'sportsdb',
        baseUrl: 'https://www.thesportsdb.com/images/media/team/logo',
        getTeamLogoUrl: this.getSportsDBLogoUrl.bind(this),
        priority: 2,
      },
      {
        name: 'sport-specific',
        baseUrl: 'various',
        getTeamLogoUrl: this.getNFLLogoUrl.bind(this),
        priority: 3,
      },
      {
        name: 'logos-world',
        baseUrl: 'https://logos-world.net/wp-content/uploads/2020/06',
        getTeamLogoUrl: this.getLogosWorldUrl.bind(this),
        priority: 4,
      },
      {
        name: 'team-logos',
        baseUrl: 'https://team-logos.com',
        getTeamLogoUrl: this.getTeamLogosUrl.bind(this),
        priority: 5,
      },
    ]
  }

  /**
   * Populate logos for all teams missing logo URLs
   */
  async populateAllLogos(): Promise<{
    totalProcessed: number
    successful: number
    failed: number
    results: TeamLogoResult[]
  }> {
    structuredLogger.info('Starting logo population for all teams')

    // Get all teams without logos
    const teamsQuery = `
      SELECT id, name, sport, abbreviation, league_name 
      FROM teams 
      WHERE logo_url IS NULL AND is_active = true
      ORDER BY sport, name
    `

    const teamsResult = await databaseService.executeSQL(teamsQuery)

    if (!teamsResult.success || teamsResult.data.length === 0) {
      structuredLogger.info('No teams found without logos')
      return {
        totalProcessed: 0,
        successful: 0,
        failed: 0,
        results: [],
      }
    }

    const teams = teamsResult.data
    const results: TeamLogoResult[] = []
    let successful = 0
    let failed = 0

    structuredLogger.info(`Found ${teams.length} teams without logos`)

    // Process teams in batches to avoid overwhelming APIs
    const batchSize = 10
    for (let i = 0; i < teams.length; i += batchSize) {
      const batch = teams.slice(i, i + batchSize)

      structuredLogger.info(
        `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(teams.length / batchSize)}`
      )

      const batchPromises = batch.map(team => this.populateTeamLogo(team))
      const batchResults = await Promise.allSettled(batchPromises)

      batchResults.forEach((result: PromiseSettledResult<TeamLogoResult>, index: number) => {
        if (result.status === 'fulfilled') {
          results.push(result.value)
          if (result.value.success) {
            successful++
          } else {
            failed++
          }
        } else {
          const team = batch[index]
          results.push({
            teamId: team.id,
            teamName: team.name,
            sport: team.sport,
            logoUrl: null,
            source: 'error',
            success: false,
            error: result.reason?.message || 'Unknown error',
          })
          failed++
        }
      })

      // Rate limiting - wait between batches
      if (i + batchSize < teams.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    structuredLogger.info('Logo population completed', {
      totalProcessed: teams.length,
      successful,
      failed,
      successRate: `${((successful / teams.length) * 100).toFixed(1)}%`,
    })

    return {
      totalProcessed: teams.length,
      successful,
      failed,
      results,
    }
  }

  /**
   * Populate logo for a specific team
   */
  async populateTeamLogo(team: {
    id: string
    name: string
    sport: string
    abbreviation?: string
    league_name?: string
  }): Promise<TeamLogoResult> {
    const { id: teamId, name: teamName, sport } = team

    structuredLogger.debug('Populating logo for team', { teamName, sport })

    // Try each logo source in priority order
    for (const source of this.logoSources.sort((a, b) => a.priority - b.priority)) {
      try {
        const logoUrl = await source.getTeamLogoUrl(teamName, sport)

        if (logoUrl && (await this.validateLogoUrl(logoUrl))) {
          // Update database with logo URL
          const updateQuery = `
            UPDATE teams 
            SET logo_url = $1, last_updated = NOW() 
            WHERE id = $2
          `

          const updateResult = await databaseService.executeSQL(updateQuery, [logoUrl, teamId])

          if (updateResult.success) {
            structuredLogger.info('Successfully populated logo', {
              teamName,
              sport,
              source: source.name,
              logoUrl,
            })

            return {
              teamId,
              teamName,
              sport,
              logoUrl,
              source: source.name,
              success: true,
            }
          }
        }
      } catch (error) {
        structuredLogger.debug('Logo source failed', {
          teamName,
          sport,
          source: source.name,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    // All sources failed
    structuredLogger.warn('Failed to find logo for team', { teamName, sport })

    return {
      teamId,
      teamName,
      sport,
      logoUrl: null,
      source: 'none',
      success: false,
      error: 'No valid logo found from any source',
    }
  }

  /**
   * ESPN CDN logo URL generation - Dynamic approach for all sports
   */
  private async getESPNLogoUrl(teamName: string, sport: string): Promise<string | null> {
    try {
      // Get sport configuration from database
      const sportQuery = `
        SELECT name, display_name, data_types 
        FROM sports 
        WHERE name = $1 AND is_active = true
        LIMIT 1
      `

      const sportResult = await databaseService.executeSQL(sportQuery, [sport])
      if (!sportResult.success || sportResult.data.length === 0) {
        return null
      }

      // const sportData = sportResult.data[0]

      // Get league information for the sport
      const leagueQuery = `
        SELECT name, abbreviation 
        FROM leagues 
        WHERE sport = $1 AND is_active = true
        ORDER BY level ASC
        LIMIT 1
      `

      const leagueResult = await databaseService.executeSQL(leagueQuery, [sport])
      if (!leagueResult.success || leagueResult.data.length === 0) {
        return null
      }

      const league = leagueResult.data[0]
      const leagueCode = league.abbreviation || league.name.toLowerCase()

      // Try multiple ESPN URL patterns based on sport and league
      const urlPatterns = this.generateESPNUrlPatterns(teamName, sport, leagueCode)

      // Test each pattern to find a valid logo
      for (const url of urlPatterns) {
        if (await this.validateLogoUrl(url)) {
          return url
        }
      }

      return null
    } catch (error) {
      structuredLogger.debug('ESPN logo URL generation failed', {
        teamName,
        sport,
        error: error instanceof Error ? error.message : String(error),
      })
      return null
    }
  }

  /**
   * Generate multiple ESPN URL patterns to try
   */
  private generateESPNUrlPatterns(teamName: string, sport: string, leagueCode: string): string[] {
    const patterns: string[] = []

    // Clean team name for URL generation
    const cleanName = teamName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '')
      .substring(0, 10) // Limit length

    // Pattern 1: Standard ESPN format
    patterns.push(`https://a.espncdn.com/i/teamlogos/${leagueCode}/500/${cleanName}.png`)

    // Pattern 2: Alternative ESPN format
    patterns.push(
      `https://a.espncdn.com/i/teamlogos/${leagueCode}/500/${cleanName.substring(0, 3)}.png`
    )

    // Pattern 3: ESPN with team abbreviation
    const abbreviation = this.generateTeamAbbreviation(teamName)
    if (abbreviation) {
      patterns.push(
        `https://a.espncdn.com/i/teamlogos/${leagueCode}/500/${abbreviation.toLowerCase()}.png`
      )
    }

    // Pattern 4: ESPN with numeric ID (try common patterns)
    const numericPatterns = this.generateNumericPatterns(teamName, sport)
    numericPatterns.forEach(num => {
      patterns.push(`https://a.espncdn.com/i/teamlogos/${leagueCode}/500/${num}.png`)
    })

    return patterns
  }

  /**
   * Generate team abbreviation from team name
   */
  private generateTeamAbbreviation(teamName: string): string | null {
    // Common abbreviation patterns
    const words = teamName.split(' ')

    if (words.length >= 2) {
      // Take first letter of each word
      return words.map(word => word.charAt(0)).join('')
    } else if (words.length === 1) {
      // Take first 3 characters
      return words[0].substring(0, 3)
    }

    return null
  }

  /**
   * Generate numeric patterns for ESPN URLs
   */
  private generateNumericPatterns(teamName: string, sport: string): string[] {
    const patterns: string[] = []

    // Generate patterns based on team name hash
    const hash = this.hashString(teamName)
    const baseNum = Math.abs(hash) % 1000

    // Try variations around the hash
    for (let i = 0; i < 10; i++) {
      patterns.push((baseNum + i).toString())
    }

    // Try common team ID patterns for each sport
    const sportPatterns: Record<string, number[]> = {
      basketball: [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
        26, 27, 28, 29, 30,
      ],
      football: [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
        26, 27, 28, 29, 30, 31, 32,
      ],
      baseball: [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
        26, 27, 28, 29, 30,
      ],
      hockey: [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
        26, 27, 28, 29, 30, 31, 32,
      ],
      soccer: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    }

    const sportNums = sportPatterns[sport] || []
    sportNums.forEach(num => patterns.push(num.toString()))

    return patterns
  }

  /**
   * Simple hash function for generating consistent numeric patterns
   */
  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash
  }

  /**
   * SportsDB logo URL generation - Dynamic approach
   */
  private async getSportsDBLogoUrl(teamName: string, sport: string): Promise<string | null> {
    try {
      // Get sport configuration from database
      const sportQuery = `
        SELECT name, display_name 
        FROM sports 
        WHERE name = $1 AND is_active = true
        LIMIT 1
      `

      const sportResult = await databaseService.executeSQL(sportQuery, [sport])
      if (!sportResult.success || sportResult.data.length === 0) {
        return null
      }

      // const sportData = sportResult.data[0]

      // Generate multiple SportsDB URL patterns
      const urlPatterns = this.generateSportsDBUrlPatterns(teamName, sport, sport)

      // Test each pattern to find a valid logo
      for (const url of urlPatterns) {
        if (await this.validateLogoUrl(url)) {
          return url
        }
      }

      return null
    } catch (error) {
      structuredLogger.debug('SportsDB logo URL generation failed', {
        teamName,
        sport,
        error: error instanceof Error ? error.message : String(error),
      })
      return null
    }
  }

  /**
   * Generate multiple SportsDB URL patterns
   */
  private generateSportsDBUrlPatterns(
    teamName: string,
    sport: string,
    _sportDisplayName: string
  ): string[] {
    const patterns: string[] = []

    // Clean team name variations
    const cleanName = teamName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '')
    const slugName = teamName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
    const shortName = cleanName.substring(0, 8)

    // Pattern 1: Standard SportsDB format
    patterns.push(`https://www.thesportsdb.com/images/media/team/logo/${cleanName}.png`)

    // Pattern 2: With sport prefix
    patterns.push(`https://www.thesportsdb.com/images/media/team/logo/${sport}-${cleanName}.png`)

    // Pattern 3: Slug format
    patterns.push(`https://www.thesportsdb.com/images/media/team/logo/${slugName}.png`)

    // Pattern 4: Short name
    patterns.push(`https://www.thesportsdb.com/images/media/team/logo/${shortName}.png`)

    // Pattern 5: With league prefix
    const leaguePrefix = this.getLeaguePrefix(sport)
    if (leaguePrefix) {
      patterns.push(
        `https://www.thesportsdb.com/images/media/team/logo/${leaguePrefix}-${cleanName}.png`
      )
    }

    return patterns
  }

  /**
   * Get league prefix for SportsDB URLs
   */
  private getLeaguePrefix(sport: string): string | null {
    const leaguePrefixes: Record<string, string> = {
      basketball: 'nba',
      football: 'nfl',
      baseball: 'mlb',
      hockey: 'nhl',
      soccer: 'pl', // Premier League
    }

    return leaguePrefixes[sport] || null
  }

  /**
   * NFL API logo URL generation - Dynamic approach for all sports
   */
  private async getNFLLogoUrl(teamName: string, sport: string): Promise<string | null> {
    try {
      // Get sport configuration from database
      const sportQuery = `
        SELECT name, display_name 
        FROM sports 
        WHERE name = $1 AND is_active = true
        LIMIT 1
      `

      const sportResult = await databaseService.executeSQL(sportQuery, [sport])
      if (!sportResult.success || sportResult.data.length === 0) {
        return null
      }

      // const sportData = sportResult.data[0]

      // Generate multiple sport-specific URL patterns
      const urlPatterns = this.generateSportSpecificUrlPatterns(teamName, sport, sport)

      // Test each pattern to find a valid logo
      for (const url of urlPatterns) {
        if (await this.validateLogoUrl(url)) {
          return url
        }
      }

      return null
    } catch (error) {
      structuredLogger.debug('Sport-specific logo URL generation failed', {
        teamName,
        sport,
        error: error instanceof Error ? error.message : String(error),
      })
      return null
    }
  }

  /**
   * Generate sport-specific URL patterns
   */
  private generateSportSpecificUrlPatterns(
    teamName: string,
    sport: string,
    _sportDisplayName: string
  ): string[] {
    const patterns: string[] = []

    // Clean team name for URL generation
    const cleanName = teamName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '')
    const abbreviation = this.generateTeamAbbreviation(teamName)

    // Sport-specific URL patterns
    switch (sport) {
      case 'football':
        // NFL-specific patterns
        if (abbreviation) {
          patterns.push(
            `https://static.www.nfl.com/image/private/t_headshot_desktop/league/${abbreviation.toLowerCase()}.png`
          )
          patterns.push(
            `https://static.nfl.com/static/content/public/static/img/logos/teams/${abbreviation.toLowerCase()}.png`
          )
        }
        patterns.push(
          `https://static.www.nfl.com/image/private/t_headshot_desktop/league/${cleanName}.png`
        )
        break

      case 'basketball':
        // NBA-specific patterns
        if (abbreviation) {
          patterns.push(
            `https://cdn.nba.com/logos/nba/${abbreviation.toLowerCase()}/global/L/logo.svg`
          )
          patterns.push(
            `https://cdn.nba.com/logos/nba/${abbreviation.toLowerCase()}/global/D/logo.svg`
          )
        }
        patterns.push(`https://cdn.nba.com/logos/nba/${cleanName}/global/L/logo.svg`)
        break

      case 'baseball':
        // MLB-specific patterns
        if (abbreviation) {
          patterns.push(`https://www.mlbstatic.com/team-logos/${abbreviation.toLowerCase()}.svg`)
          patterns.push(`https://www.mlbstatic.com/team-logos/${abbreviation.toLowerCase()}.png`)
        }
        patterns.push(`https://www.mlbstatic.com/team-logos/${cleanName}.svg`)
        break

      case 'hockey':
        // NHL-specific patterns
        if (abbreviation) {
          patterns.push(
            `https://cms.nhl.bamgrid.com/images/logos/team/${abbreviation.toLowerCase()}/dark.svg`
          )
          patterns.push(
            `https://cms.nhl.bamgrid.com/images/logos/team/${abbreviation.toLowerCase()}/light.svg`
          )
        }
        patterns.push(`https://cms.nhl.bamgrid.com/images/logos/team/${cleanName}/dark.svg`)
        break

      case 'soccer':
        // Soccer-specific patterns
        if (abbreviation) {
          patterns.push(
            `https://logos-world.net/wp-content/uploads/2020/06/${abbreviation.toLowerCase()}-Logo.png`
          )
          patterns.push(
            `https://logos-world.net/wp-content/uploads/2020/06/${abbreviation.toLowerCase()}-Logo.svg`
          )
        }
        patterns.push(`https://logos-world.net/wp-content/uploads/2020/06/${cleanName}-Logo.png`)
        break

      default:
        // Generic patterns for unknown sports
        if (abbreviation) {
          patterns.push(
            `https://logos-world.net/wp-content/uploads/2020/06/${abbreviation.toLowerCase()}-Logo.png`
          )
        }
        patterns.push(`https://logos-world.net/wp-content/uploads/2020/06/${cleanName}-Logo.png`)
    }

    return patterns
  }

  /**
   * LogosWorld logo URL generation - Generic fallback source
   */
  private async getLogosWorldUrl(teamName: string, sport: string): Promise<string | null> {
    try {
      const cleanName = teamName
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '')
      const abbreviation = this.generateTeamAbbreviation(teamName)

      const patterns: string[] = []

      if (abbreviation) {
        patterns.push(
          `https://logos-world.net/wp-content/uploads/2020/06/${abbreviation.toLowerCase()}-Logo.png`
        )
        patterns.push(
          `https://logos-world.net/wp-content/uploads/2020/06/${abbreviation.toLowerCase()}-Logo.svg`
        )
      }

      patterns.push(`https://logos-world.net/wp-content/uploads/2020/06/${cleanName}-Logo.png`)
      patterns.push(`https://logos-world.net/wp-content/uploads/2020/06/${cleanName}-Logo.svg`)

      // Test each pattern
      for (const url of patterns) {
        if (await this.validateLogoUrl(url)) {
          return url
        }
      }

      return null
    } catch (error) {
      structuredLogger.debug('LogosWorld logo URL generation failed', {
        teamName,
        sport,
        error: error instanceof Error ? error.message : String(error),
      })
      return null
    }
  }

  /**
   * TeamLogos.com logo URL generation - Another generic source
   */
  private async getTeamLogosUrl(teamName: string, sport: string): Promise<string | null> {
    try {
      const cleanName = teamName
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '')
      const abbreviation = this.generateTeamAbbreviation(teamName)

      const patterns: string[] = []

      if (abbreviation) {
        patterns.push(`https://team-logos.com/${abbreviation.toLowerCase()}.png`)
        patterns.push(`https://team-logos.com/${abbreviation.toLowerCase()}.svg`)
      }

      patterns.push(`https://team-logos.com/${cleanName}.png`)
      patterns.push(`https://team-logos.com/${cleanName}.svg`)

      // Test each pattern
      for (const url of patterns) {
        if (await this.validateLogoUrl(url)) {
          return url
        }
      }

      return null
    } catch (error) {
      structuredLogger.debug('TeamLogos logo URL generation failed', {
        teamName,
        sport,
        error: error instanceof Error ? error.message : String(error),
      })
      return null
    }
  }

  /**
   * Validate that a logo URL is accessible
   */
  private async validateLogoUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(2000), // Reduced from 5s to 2s
      })
      return response.ok
    } catch (error) {
      return false
    }
  }

  /**
   * Get logo population statistics
   */
  async getLogoStats(): Promise<{
    totalTeams: number
    teamsWithLogos: number
    teamsWithoutLogos: number
    coverageBySport: Record<string, { total: number; withLogos: number; percentage: number }>
  }> {
    const statsQuery = `
      SELECT 
        sport,
        COUNT(*) as total_teams,
        COUNT(CASE WHEN logo_url IS NOT NULL AND logo_url != '' THEN 1 END) as teams_with_logos
      FROM teams 
      WHERE is_active = true
      GROUP BY sport
      ORDER BY total_teams DESC
    `

    const result = await databaseService.executeSQL(statsQuery)

    if (!result.success) {
      throw new Error('Failed to fetch logo statistics')
    }

    const coverageBySport: Record<
      string,
      { total: number; withLogos: number; percentage: number }
    > = {}
    let totalTeams = 0
    let teamsWithLogos = 0

    result.data.forEach((row: any) => {
      const { sport, total_teams, teams_with_logos } = row
      const percentage = total_teams > 0 ? (teams_with_logos / total_teams) * 100 : 0

      coverageBySport[sport] = {
        total: total_teams,
        withLogos: teams_with_logos,
        percentage: Math.round(percentage * 100) / 100,
      }

      totalTeams += total_teams
      teamsWithLogos += teams_with_logos
    })

    return {
      totalTeams,
      teamsWithLogos,
      teamsWithoutLogos: totalTeams - teamsWithLogos,
      coverageBySport,
    }
  }
}

export const logoPopulationService = LogoPopulationService.getInstance()
