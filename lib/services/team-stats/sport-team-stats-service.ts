/**
 * SPORT TEAM STATISTICS SERVICE
 * Comprehensive team statistics for all sports
 */

import { BaseService, ServiceConfig } from '../core/base-service'
import { serviceFactory, SupportedSport } from '../core/service-factory'
import { SportConfigManager } from '../core/sport-config'

export interface TeamStats {
  teamId: string
  name: string
  abbreviation: string
  sport: string
  league: string
  season: string
  conference?: string
  division?: string
  gamesPlayed: number
  wins: number
  losses: number
  ties?: number
  winPercentage: number
  stats: Record<string, number>
  rankings: Record<string, number>
  lastUpdated: string
}

export interface TeamStandings {
  league: string
  season: string
  standings: {
    conference?: string
    division?: string
    teams: TeamStats[]
  }[]
  lastUpdated: string
}

export interface TeamPerformance {
  teamId: string
  teamName: string
  recentForm: string // e.g., "WWLWW"
  homeRecord: { wins: number; losses: number; ties?: number }
  awayRecord: { wins: number; losses: number; ties?: number }
  streak: {
    type: 'win' | 'loss' | 'tie'
    count: number
  }
  last10Games: TeamStats[]
  seasonHighlights: {
    longestWinStreak: number
    longestLossStreak: number
    bestMonth: string
    worstMonth: string
  }
}

export interface TeamComparison {
  teams: TeamStats[]
  comparison: {
    stat: string
    values: Record<string, number>
    leader: string
    difference: Record<string, number>
  }[]
}

export class SportTeamStatsService extends BaseService {
  private sport: SupportedSport
  private league: string

  constructor(sport: SupportedSport, league?: string) {
    const config: ServiceConfig = {
      name: `team-stats-${sport}`,
      cacheTTL: 30 * 60 * 1000, // 30 minutes
      rateLimitService: 'team-stats',
      retryAttempts: 2,
      retryDelay: 1000
    }
    super(config)
    this.sport = sport
    this.league = league || ''
  }

  /**
   * Initialize the service with the default league
   */
  async initialize(): Promise<void> {
    if (!this.league) {
      this.league = await serviceFactory.getDefaultLeague(this.sport)
    }
  }

  /**
   * Get team standings for a specific league and season
   */
  async getTeamStandings(season?: string): Promise<TeamStandings | null> {
    const key = this.getCacheKey('team-standings', this.sport, this.league, season || 'current')
    
    return this.getCachedOrFetch(key, async () => {
      try {
        // Get team standings directly from database
        const teamStats = await this.getTeamStatsFromDatabase(season)

        // Sort teams by win percentage
        teamStats.sort((a, b) => b.winPercentage - a.winPercentage)

        // Group by conference/division if applicable
        const standings = this.groupStandings(teamStats)

        return {
          league: this.league,
          season: season || await this.getCurrentSeason(),
          standings,
          lastUpdated: new Date().toISOString()
        }
      } catch (error) {
        console.error(`Error fetching team standings for ${this.sport}:`, error)
        return null
      }
    })
  }

  /**
   * Get statistics for a specific team
   */
  async getTeamStats(teamId: string, season?: string): Promise<TeamStats | null> {
    const key = this.getCacheKey('team-stats-by-id', this.sport, this.league, teamId, season || 'current')
    
    return this.getCachedOrFetch(key, async () => {
      try {
        return await this.fetchTeamStats(teamId, season)
      } catch (error) {
        console.error(`Error fetching team stats for ${teamId}:`, error)
        return null
      }
    })
  }

  /**
   * Get team performance analysis
   */
  async getTeamPerformance(teamId: string, season?: string): Promise<TeamPerformance | null> {
    const key = this.getCacheKey('team-performance', this.sport, this.league, teamId, season || 'current')
    
    return this.getCachedOrFetch(key, async () => {
      try {
        const service = await serviceFactory.getService(this.sport, this.league)
        const team = await service.getTeamById(teamId)
        
        if (!team) {
          return null
        }

        // Get recent games
        const recentGames = await service.getGames({
          teamId,
          status: 'finished',
          limit: 20
        })

        // Calculate performance metrics
        const recentForm = this.calculateRecentForm(recentGames, teamId)
        const homeRecord = this.calculateHomeRecord(recentGames, teamId)
        const awayRecord = this.calculateAwayRecord(recentGames, teamId)
        const streak = this.calculateStreak(recentGames, teamId)
        const seasonHighlights = this.calculateSeasonHighlights(recentGames, teamId)

        return {
          teamId,
          teamName: team.name,
          recentForm,
          homeRecord,
          awayRecord,
          streak,
          last10Games: await Promise.all(recentGames.slice(0, 10).map((game: any) => this.mapGameToTeamStats(game, teamId))),
          seasonHighlights
        }
      } catch (error) {
        console.error(`Error fetching team performance for ${teamId}:`, error)
        return null
      }
    })
  }

  /**
   * Compare multiple teams
   */
  async compareTeams(teamIds: string[], season?: string): Promise<TeamComparison | null> {
    const key = this.getCacheKey('team-comparison', this.sport, this.league, teamIds.join(','), season || 'current')
    
    return this.getCachedOrFetch(key, async () => {
      try {
        const teams: TeamStats[] = []
        
        for (const teamId of teamIds) {
          const stats = await this.getTeamStats(teamId, season)
          if (stats) {
            teams.push(stats)
          }
        }

        if (teams.length === 0) {
          return null
        }

        // Get common statistics for comparison
        const commonStats = this.getCommonStats(teams)
        const comparison = this.buildComparison(teams, commonStats)

        return {
          teams,
          comparison
        }
      } catch (error) {
        console.error('Error comparing teams:', error)
        return null
      }
    })
  }

  /**
   * Get league leaders for specific statistics
   */
  async getLeagueLeaders(stat: string, season?: string, limit: number = 10): Promise<TeamStats[]> {
    const key = this.getCacheKey('league-leaders', this.sport, this.league, stat, season || 'current')
    
    return this.getCachedOrFetch(key, async () => {
      try {
        const standings = await this.getTeamStandings(season)
        if (!standings) {
          return []
        }

        const allTeams = standings.standings.flatMap(division => division.teams)
        
        return allTeams
          .filter(team => team.stats[stat] !== undefined)
          .sort((a, b) => (b.stats[stat] as number) - (a.stats[stat] as number))
          .slice(0, limit)
      } catch (error) {
        console.error(`Error fetching league leaders for ${stat}:`, error)
        return []
      }
    })
  }

  /**
   * Get team statistics from database
   */
  private async getTeamStatsFromDatabase(season?: string): Promise<TeamStats[]> {
    try {
      const { createClient } = await import('../../supabase/server')
      const supabase = await createClient()
      
      if (!supabase) {
        throw new Error('Database connection failed')
      }

      // Get team standings from league_standings table
      const { data, error } = await supabase
        .from('league_standings')
        .select(`
          *,
          team:teams!league_standings_team_id_fkey(name, abbreviation, conference, division)
        `)
        .eq('sport', this.sport)
        .eq('league', this.league)
        .eq('season', season || this.getCurrentSeason())

      if (error) {
        console.error('Database error:', error)
        return []
      }

      // Get current season if not provided
      const currentSeason = season || (await this.getCurrentSeason())
      
      // Convert to TeamStats format
      const teamStats: TeamStats[] = (data || []).map(standing => ({
        teamId: standing.team_id,
        name: standing.team?.name ?? null,
        abbreviation: standing.team?.abbreviation || 'UNK',
        sport: this.sport,
        league: this.league,
        season: currentSeason,
        conference: standing.team?.conference,
        division: standing.team?.division,
        gamesPlayed: (standing.wins || 0) + (standing.losses || 0) + (standing.ties || 0),
        wins: standing.wins || 0,
        losses: standing.losses || 0,
        ties: standing.ties || 0,
        winPercentage: standing.win_percentage || 0,
        stats: {
          wins: standing.wins || 0,
          losses: standing.losses || 0,
          ties: standing.ties || 0,
          winPercentage: standing.win_percentage || 0,
          pointsFor: standing.points_for || 0,
          pointsAgainst: standing.points_against || 0,
          gamesBack: standing.games_back || 0,
          streak: standing.streak || 'N/A',
          homeWins: standing.home_wins || 0,
          homeLosses: standing.home_losses || 0,
          awayWins: standing.away_wins || 0,
          awayLosses: standing.away_losses || 0,
          pointDifferential: standing.point_differential || 0
        },
        rankings: {},
        lastUpdated: standing.last_updated || new Date().toISOString()
      }))

      return teamStats
    } catch (error) {
      console.error('Error getting team stats from database:', error)
      return []
    }
  }

  /**
   * Fetch team statistics from the appropriate data source
   */
  private async fetchTeamStats(teamId: string, season?: string): Promise<TeamStats | null> {
    try {
      const service = await serviceFactory.getService(this.sport, this.league)
      const team = await service.getTeamById(teamId)
      
      if (!team) {
        return null
      }

      // Get team's games for the season
      const games = await service.getGames({
        teamId,
        status: 'finished',
        limit: 100
      })

      // Calculate team statistics
      const stats = await this.calculateTeamStats(games, teamId)
      const winPercentage = stats.gamesPlayed > 0 ? stats.wins / stats.gamesPlayed : 0

      return {
        teamId: team.id,
        name: team.name,
        abbreviation: team.abbreviation || team.name.substring(0, 3).toUpperCase(),
        sport: this.sport,
        league: this.league,
        season: season || await this.getCurrentSeason(),
        gamesPlayed: stats.gamesPlayed,
        wins: stats.wins,
        losses: stats.losses,
        ties: stats.ties,
        winPercentage: Math.round(winPercentage * 1000) / 1000,
        stats: stats.rawStats,
        rankings: {}, // Will be calculated separately
        lastUpdated: new Date().toISOString()
      }
    } catch (error) {
      console.error(`Error fetching stats for team ${teamId}:`, error)
      return null
    }
  }

  /**
   * Calculate team statistics from games
   */
  private async calculateTeamStats(games: any[], teamId: string): Promise<any> {
    let wins = 0
    let losses = 0
    let ties = 0
    const rawStats: Record<string, number> = {}

    for (const game of games) {
      const isHomeTeam = game.homeTeam === teamId || game.homeTeamId === teamId
      const homeScore = game.homeScore || 0
      const awayScore = game.awayScore || 0

      if (isHomeTeam) {
        if (homeScore > awayScore) wins++
        else if (homeScore < awayScore) losses++
        else ties++
      } else {
        if (awayScore > homeScore) wins++
        else if (awayScore < homeScore) losses++
        else ties++
      }

      // Add sport-specific statistics from real game data
      await this.addSportSpecificStats(rawStats, game, teamId, isHomeTeam)
    }

    return {
      gamesPlayed: games.length,
      wins,
      losses,
      ties,
      rawStats
    }
  }

  /**
   * Add sport-specific statistics from real game data
   */
  private async addSportSpecificStats(rawStats: Record<string, number>, game: any, _teamId: string, isHomeTeam: boolean): Promise<void> {
    try {
      // Get sport configuration to determine scoring field names
      const sportConfig = await SportConfigManager.getSportConfig(this.sport)
      
      if (sportConfig?.scoringFields) {
        // Use configured scoring fields
        const scoring = sportConfig.scoringFields
        const scoreField = (typeof scoring === 'object' && 'primary' in scoring) ? scoring.primary : 'score'
        const scoreForField = (typeof scoring === 'object' && 'for' in scoring) ? scoring.for : `${scoreField}For`
        const scoreAgainstField = (typeof scoring === 'object' && 'against' in scoring) ? scoring.against : `${scoreField}Against`
        
        const score = isHomeTeam ? game.homeScore : game.awayScore
        rawStats[scoreForField] = (rawStats[scoreForField] || 0) + score
        rawStats[scoreAgainstField] = (rawStats[scoreAgainstField] || 0) + (isHomeTeam ? game.awayScore : game.homeScore)
      } else {
        // Fallback to generic scoring
        const score = isHomeTeam ? game.homeScore : game.awayScore
        rawStats.scoreFor = (rawStats.scoreFor || 0) + score
        rawStats.scoreAgainst = (rawStats.scoreAgainst || 0) + (isHomeTeam ? game.awayScore : game.homeScore)
      }
    } catch (error) {
      console.warn(`Failed to get sport config for ${this.sport}:`, error)
      // Fallback to generic scoring
      const score = isHomeTeam ? game.homeScore : game.awayScore
      rawStats.scoreFor = (rawStats.scoreFor || 0) + score
      rawStats.scoreAgainst = (rawStats.scoreAgainst || 0) + (isHomeTeam ? game.awayScore : game.homeScore)
    }
  }

  /**
   * Group standings by conference/division
   */
  private groupStandings(teams: TeamStats[]): any[] {
    const standings: any = {}

    teams.forEach(team => {
      const conference = team.conference || 'N/A'
      const division = team.division || 'N/A'

      if (!standings[conference]) {
        standings[conference] = {}
      }
      if (!standings[conference][division]) {
        standings[conference][division] = []
      }
      standings[conference][division].push(team)
    })

    return Object.keys(standings).map(conference => ({
      conference,
      divisions: Object.keys(standings[conference]).map(division => ({
        division,
        teams: standings[conference][division]
      }))
    }))
  }

  /**
   * Calculate recent form (e.g., "WWLWW")
   */
  private calculateRecentForm(games: any[], teamId: string): string {
    const recentGames = games.slice(0, 5) // Last 5 games
    return recentGames.map(game => {
      const isHomeTeam = game.homeTeam === teamId || game.homeTeamId === teamId
      const homeScore = game.homeScore || 0
      const awayScore = game.awayScore || 0

      if (isHomeTeam) {
        return homeScore > awayScore ? 'W' : homeScore < awayScore ? 'L' : 'T'
      } else {
        return awayScore > homeScore ? 'W' : awayScore < homeScore ? 'L' : 'T'
      }
    }).join('')
  }

  /**
   * Calculate home record
   */
  private calculateHomeRecord(games: any[], teamId: string): { wins: number; losses: number; ties?: number } {
    const homeGames = games.filter(game => game.homeTeam === teamId || game.homeTeamId === teamId)
    let wins = 0
    let losses = 0
    let ties = 0

    homeGames.forEach(game => {
      const homeScore = game.homeScore || 0
      const awayScore = game.awayScore || 0

      if (homeScore > awayScore) wins++
      else if (homeScore < awayScore) losses++
      else ties++
    })

    return { wins, losses, ties }
  }

  /**
   * Calculate away record
   */
  private calculateAwayRecord(games: any[], teamId: string): { wins: number; losses: number; ties?: number } {
    const awayGames = games.filter(game => game.awayTeam === teamId || game.awayTeamId === teamId)
    let wins = 0
    let losses = 0
    let ties = 0

    awayGames.forEach(game => {
      const homeScore = game.homeScore || 0
      const awayScore = game.awayScore || 0

      if (awayScore > homeScore) wins++
      else if (awayScore < homeScore) losses++
      else ties++
    })

    return { wins, losses, ties }
  }

  /**
   * Calculate current streak
   */
  private calculateStreak(games: any[], teamId: string): { type: 'win' | 'loss' | 'tie'; count: number } {
    const recentGames = games.slice(0, 10) // Check last 10 games
    let streakType: 'win' | 'loss' | 'tie' = 'win'
    let count = 0

    for (const game of recentGames) {
      const isHomeTeam = game.homeTeam === teamId || game.homeTeamId === teamId
      const homeScore = game.homeScore || 0
      const awayScore = game.awayScore || 0

      let result: 'win' | 'loss' | 'tie'
      if (isHomeTeam) {
        result = homeScore > awayScore ? 'win' : homeScore < awayScore ? 'loss' : 'tie'
      } else {
        result = awayScore > homeScore ? 'win' : awayScore < homeScore ? 'loss' : 'tie'
      }

      if (count === 0) {
        streakType = result
        count = 1
      } else if (result === streakType) {
        count++
      } else {
        break
      }
    }

    return { type: streakType, count }
  }

  /**
   * Calculate season highlights
   */
  private calculateSeasonHighlights(games: any[], teamId: string): any {
    // Analyze the entire season's games for real data
    let longestWinStreak = 0
    let longestLossStreak = 0
    let currentWinStreak = 0
    let currentLossStreak = 0
    const monthlyRecords: Record<string, { wins: number; losses: number }> = {}

    games.forEach(game => {
      const isHomeTeam = game.homeTeam === teamId || game.homeTeamId === teamId
      const homeScore = game.homeScore || 0
      const awayScore = game.awayScore || 0
      const gameDate = new Date(game.date)
      const month = gameDate.toLocaleString('default', { month: 'long' })

      if (!monthlyRecords[month]) {
        monthlyRecords[month] = { wins: 0, losses: 0 }
      }

      let won = false
      if (isHomeTeam) {
        won = homeScore > awayScore
      } else {
        won = awayScore > homeScore
      }

      if (won) {
        currentWinStreak++
        currentLossStreak = 0
        longestWinStreak = Math.max(longestWinStreak, currentWinStreak)
        monthlyRecords[month].wins++
      } else {
        currentLossStreak++
        currentWinStreak = 0
        longestLossStreak = Math.max(longestLossStreak, currentLossStreak)
        monthlyRecords[month].losses++
      }
    })

    // Find best and worst months
    let bestMonth = ''
    let worstMonth = ''
    let bestWinRate = 0
    let worstWinRate = 1

    Object.entries(monthlyRecords).forEach(([month, record]) => {
      const totalGames = record.wins + record.losses
      if (totalGames > 0) {
        const winRate = record.wins / totalGames
        if (winRate > bestWinRate) {
          bestWinRate = winRate
          bestMonth = month
        }
        if (winRate < worstWinRate) {
          worstWinRate = winRate
          worstMonth = month
        }
      }
    })

    return {
      longestWinStreak,
      longestLossStreak,
      bestMonth: bestMonth || 'N/A',
      worstMonth: worstMonth || 'N/A'
    }
  }

  /**
   * Map game to team stats
   */
  private async mapGameToTeamStats(game: any, teamId: string): Promise<TeamStats> {
    const isHomeTeam = game.homeTeam === teamId || game.homeTeamId === teamId
    const homeScore = game.homeScore || 0
    const awayScore = game.awayScore || 0

    let result: 'win' | 'loss' | 'tie'
    if (isHomeTeam) {
      result = homeScore > awayScore ? 'win' : homeScore < awayScore ? 'loss' : 'tie'
    } else {
      result = awayScore > homeScore ? 'win' : awayScore < homeScore ? 'loss' : 'tie'
    }

    return {
      teamId,
      name: isHomeTeam ? game.homeTeam : game.awayTeam,
      abbreviation: (isHomeTeam ? game.homeTeam : game.awayTeam).substring(0, 3).toUpperCase(),
      sport: this.sport,
      league: this.league,
      season: await this.getCurrentSeason(),
      gamesPlayed: 1,
      wins: result === 'win' ? 1 : 0,
      losses: result === 'loss' ? 1 : 0,
      ties: result === 'tie' ? 1 : 0,
      winPercentage: result === 'win' ? 1 : 0,
      stats: {},
      rankings: {},
      lastUpdated: new Date().toISOString()
    }
  }

  /**
   * Get common statistics across teams
   */
  private getCommonStats(teams: TeamStats[]): string[] {
    if (teams.length === 0) return []

    const allStats = new Set<string>()
    teams.forEach(team => {
      Object.keys(team.stats).forEach(stat => allStats.add(stat))
    })

    return Array.from(allStats)
  }

  /**
   * Build comparison data
   */
  private buildComparison(teams: TeamStats[], commonStats: string[]): any[] {
    return commonStats.map(stat => {
      const values: Record<string, number> = {}
      const numericValues: number[] = []

      teams.forEach(team => {
        const value = team.stats[stat] as number || 0
        values[team.name] = value
        numericValues.push(value)
      })

      const maxValue = Math.max(...numericValues)
      const leader = teams.find(t => (t.stats[stat] as number || 0) === maxValue)?.name || ''

      const difference: Record<string, number> = {}
      teams.forEach(team => {
        const value = team.stats[stat] as number || 0
        difference[team.name] = value - maxValue
      })

      return {
        stat,
        values,
        leader,
        difference
      }
    })
  }

  /**
   * Get current season dynamically based on sport configuration
   */
  private async getCurrentSeason(): Promise<string> {
    try {
      const { SportConfigManager } = await import('../core/sport-config')
      return await SportConfigManager.getCurrentSeason(this.sport)
    } catch (error) {
      console.error(`Error getting current season for ${this.sport}:`, error)
      // Fallback to current year
      return new Date().getFullYear().toString()
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.getTeamStandings()
      return true
    } catch (error) {
      console.error(`${this.sport} team stats service health check failed:`, error)
      return false
    }
  }
}
