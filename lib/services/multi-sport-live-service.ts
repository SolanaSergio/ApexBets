/**
 * MULTI-SPORT LIVE SERVICE
 * Dynamically handles live updates for all sports without hardcoded values
 * Uses database configuration to determine which sports to monitor
 */

import { createClient } from '@/lib/supabase/server'
import { dataValidationService } from './data-validation-service'
import { normalizeGameData, normalizeTeamData } from '@/lib/utils/data-utils'

export interface MultiSportLiveConfig {
  enabled: boolean
  checkInterval: number
  maxConcurrentSports: number
  validationEnabled: boolean
  realTimeUpdates: boolean
}

export interface SportLiveData {
  sport: string
  displayName: string
  liveGames: any[]
  recentGames: any[]
  upcomingGames: any[]
  lastUpdated: Date
  dataSource: string
  error?: string
}

export class MultiSportLiveService {
  private config: MultiSportLiveConfig
  private isRunning: boolean = false
  private monitorInterval: NodeJS.Timeout | null = null
  private activeConnections: Map<string, Set<string>> = new Map() // sport -> connection IDs

  constructor(config: Partial<MultiSportLiveConfig> = {}) {
    this.config = {
      enabled: true,
      checkInterval: 30000, // 30 seconds
      maxConcurrentSports: 10,
      validationEnabled: true,
      realTimeUpdates: true,
      ...config
    }
  }

  /**
   * Start monitoring all active sports
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Multi-sport live service is already running')
      return
    }

    if (!this.config.enabled) {
      console.log('Multi-sport live service is disabled')
      return
    }

    console.log('Starting multi-sport live service...')
    this.isRunning = true

    // Run initial check immediately
    await this.performMultiSportCheck()

    // Set up interval for regular checks
    this.monitorInterval = setInterval(() => {
      this.performMultiSportCheck()
    }, this.config.checkInterval)
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval)
      this.monitorInterval = null
    }
    this.isRunning = false
    console.log('Multi-sport live service stopped')
  }

  /**
   * Perform comprehensive check for all sports
   */
  async performMultiSportCheck(): Promise<void> {
    if (!this.isRunning) return

    try {
      const supabase = await createClient()
      if (!supabase) {
        console.error('Supabase client not available for multi-sport monitoring')
        return
      }

      // Get all active sports from database
      const { data: activeSports, error: sportsError } = await supabase
        .from('sports')
        .select('name, display_name, data_source, update_frequency, is_active')
        .eq('is_active', true)
        .order('name')

      if (sportsError) {
        console.error('Error fetching active sports:', sportsError)
        return
      }

      if (!activeSports || activeSports.length === 0) {
        console.warn('No active sports found')
        return
      }

      // Process each sport concurrently (with limit)
      const sportPromises = activeSports.slice(0, this.config.maxConcurrentSports).map(sport => 
        this.processSportLiveData(supabase, sport)
      )

      const results = await Promise.allSettled(sportPromises)
      
      // Notify connected clients
      await this.notifyAllClients(results)

      console.log(`Multi-sport check completed for ${activeSports.length} sports`)

    } catch (error) {
      console.error('Critical error during multi-sport check:', error)
    }
  }

  /**
   * Process live data for a specific sport
   */
  private async processSportLiveData(supabase: any, sportConfig: any): Promise<SportLiveData> {
    const sport = sportConfig.name
    const startTime = Date.now()

    try {
      // Get live games for this sport
      const { data: liveGames, error: liveError } = await supabase
        .from('games')
        .select(`
          *,
          home_team_data:teams!games_home_team_id_fkey(name, logo_url, abbreviation),
          away_team_data:teams!games_away_team_id_fkey(name, logo_url, abbreviation)
        `)
        .eq('sport', sport)
        .in('status', ['live', 'in_progress', 'in progress'])
        .order('game_date', { ascending: true })

      if (liveError) {
        console.error(`Error fetching live games for ${sport}:`, liveError)
        return {
          sport,
          displayName: sportConfig.display_name,
          liveGames: [],
          recentGames: [],
          upcomingGames: [],
          lastUpdated: new Date(),
          dataSource: 'database',
          error: liveError.message
        }
      }

      // Get recent games (last 24 hours)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data: recentGames } = await supabase
        .from('games')
        .select(`
          *,
          home_team_data:teams!games_home_team_id_fkey(name, logo_url, abbreviation),
          away_team_data:teams!games_away_team_id_fkey(name, logo_url, abbreviation)
        `)
        .eq('sport', sport)
        .in('status', ['finished', 'completed', 'final'])
        .gte('game_date', oneDayAgo)
        .order('game_date', { ascending: false })
        .limit(5)

      // Get upcoming games (next 7 days)
      const now = new Date().toISOString()
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data: upcomingGames } = await supabase
        .from('games')
        .select(`
          *,
          home_team_data:teams!games_home_team_id_fkey(name, logo_url, abbreviation),
          away_team_data:teams!games_away_team_id_fkey(name, logo_url, abbreviation)
        `)
        .eq('sport', sport)
        .in('status', ['scheduled', 'not_started', 'upcoming'])
        .gte('game_date', now)
        .lte('game_date', nextWeek)
        .order('game_date', { ascending: true })
        .limit(5)

      // Normalize and validate data
      const normalizedLiveGames = this.normalizeGames(liveGames || [], sport)
      const normalizedRecentGames = this.normalizeGames(recentGames || [], sport)
      const normalizedUpcomingGames = this.normalizeGames(upcomingGames || [], sport)

      // Validate live games if enabled
      let validatedLiveGames = normalizedLiveGames
      if (this.config.validationEnabled) {
        const validationResult = dataValidationService.validateGame(normalizedLiveGames)
        if (validationResult.isValid) {
          validatedLiveGames = validationResult.data
        } else {
          console.warn(`Validation failed for ${sport} live games:`, validationResult.errors)
        }
      }

      const duration = Date.now() - startTime
      if (validatedLiveGames.length > 0) {
        console.log(`${sport}: ${validatedLiveGames.length} live games found in ${duration}ms`)
      }

      return {
        sport,
        displayName: sportConfig.display_name,
        liveGames: validatedLiveGames,
        recentGames: normalizedRecentGames,
        upcomingGames: normalizedUpcomingGames,
        lastUpdated: new Date(),
        dataSource: 'database'
      }

    } catch (error) {
      console.error(`Error processing ${sport}:`, error)
      return {
        sport,
        displayName: sportConfig.display_name,
        liveGames: [],
        recentGames: [],
        upcomingGames: [],
        lastUpdated: new Date(),
        dataSource: 'database',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Normalize games data for a specific sport
   */
  private normalizeGames(games: any[], sport: string): any[] {
    return games.map(game => {
      const homeTeam = game.home_team_data || { 
        name: game.home_team || 'Home Team', 
        logo_url: null, 
        abbreviation: null 
      }
      const awayTeam = game.away_team_data || { 
        name: game.away_team || 'Away Team', 
        logo_url: null, 
        abbreviation: null 
      }
      
      // Normalize team data with sport context
      const normalizedHomeTeam = normalizeTeamData(homeTeam, sport, game.league)
      const normalizedAwayTeam = normalizeTeamData(awayTeam, sport, game.league)
      
      const gameData = {
        id: game.id,
        home_team_id: game.home_team_id,
        away_team_id: game.away_team_id,
        game_date: game.game_date,
        season: game.season,
        week: game.week,
        home_score: game.home_score,
        away_score: game.away_score,
        status: game.status,
        venue: game.venue,
        league: game.league,
        sport: game.sport,
        broadcast: game.broadcast,
        attendance: game.attendance,
        game_time: game.game_time,
        time_remaining: game.time_remaining,
        quarter: game.quarter,
        period: game.period,
        possession: game.possession,
        last_play: game.last_play,
        home_team: normalizedHomeTeam,
        away_team: normalizedAwayTeam,
        created_at: game.created_at,
        updated_at: game.updated_at
      }
      
      // Normalize and return the game data with sport-specific normalization
      return normalizeGameData(gameData, sport, game.league)
    })
  }

  /**
   * Notify all connected clients of updates
   */
  private async notifyAllClients(results: PromiseSettledResult<SportLiveData>[]): Promise<void> {
    const successfulResults = results
      .filter((result): result is PromiseFulfilledResult<SportLiveData> => result.status === 'fulfilled')
      .map(result => result.value)

    if (successfulResults.length === 0) return

    // Send updates to live stream endpoint
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/live-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sport: 'all',
          data: successfulResults
        })
      })
    } catch (error) {
      console.warn('Failed to notify clients:', error)
    }
  }

  /**
   * Add a client connection for a specific sport
   */
  addConnection(connectionId: string, sport: string): void {
    if (!this.activeConnections.has(sport)) {
      this.activeConnections.set(sport, new Set())
    }
    this.activeConnections.get(sport)!.add(connectionId)
  }

  /**
   * Remove a client connection
   */
  removeConnection(connectionId: string, sport?: string): void {
    if (sport) {
      this.activeConnections.get(sport)?.delete(connectionId)
    } else {
      // Remove from all sports
      for (const [_sportName, connections] of this.activeConnections) {
        connections.delete(connectionId)
      }
    }
  }

  /**
   * Get active connections count
   */
  getActiveConnectionsCount(): number {
    let total = 0
    for (const connections of this.activeConnections.values()) {
      total += connections.size
    }
    return total
  }

  /**
   * Get configuration
   */
  getConfig(): MultiSportLiveConfig {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<MultiSportLiveConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Check if service is running
   */
  isServiceRunning(): boolean {
    return this.isRunning
  }

  /**
   * Force a multi-sport check
   */
  async forceCheck(): Promise<void> {
    await this.performMultiSportCheck()
  }
}

// Export singleton instance
export const multiSportLiveService = new MultiSportLiveService()
