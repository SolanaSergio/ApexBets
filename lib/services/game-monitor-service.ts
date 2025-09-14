/**
 * GAME MONITOR SERVICE
 * Monitors games in real-time and updates their status automatically
 * Ensures instant updates when games start, progress, and finish
 */

import { createClient } from '@/lib/supabase/server'
// import { dataSyncService } from './data-sync-service'

export interface GameMonitorConfig {
  enabled: boolean
  checkInterval: number // milliseconds
  liveGameTimeout: number // hours after start to mark as completed
  maxConcurrentChecks: number
}

export interface GameMonitorStats {
  lastCheck: Date
  gamesChecked: number
  statusUpdates: number
  errors: number
  activeConnections: number
}

export class GameMonitorService {
  private config: GameMonitorConfig
  private stats: GameMonitorStats
  private monitorInterval: NodeJS.Timeout | null = null
  private isRunning: boolean = false
  private activeConnections: Set<string> = new Set()

  constructor(config: Partial<GameMonitorConfig> = {}) {
    this.config = {
      enabled: true,
      checkInterval: 30000, // 30 seconds
      liveGameTimeout: 3, // 3 hours
      maxConcurrentChecks: 10,
      ...config
    }

    this.stats = {
      lastCheck: new Date(0),
      gamesChecked: 0,
      statusUpdates: 0,
      errors: 0,
      activeConnections: 0
    }
  }

  /**
   * Start the game monitoring service
   */
  start(): void {
    if (this.isRunning) {
      console.log('Game monitor service is already running')
      return
    }

    if (!this.config.enabled) {
      console.log('Game monitor service is disabled')
      return
    }

    console.log('Starting game monitor service...')
    this.isRunning = true

    // Run initial check immediately
    this.performGameCheck()

    // Set up interval for regular checks
    this.monitorInterval = setInterval(() => {
      this.performGameCheck()
    }, this.config.checkInterval)
  }

  /**
   * Stop the game monitoring service
   */
  stop(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval)
      this.monitorInterval = null
    }
    this.isRunning = false
    console.log('Game monitor service stopped')
  }

  /**
   * Perform a comprehensive game status check
   */
  async performGameCheck(): Promise<void> {
    if (!this.isRunning) return

    const startTime = Date.now()
    let gamesChecked = 0
    let statusUpdates = 0
    let errors = 0

    try {
      const supabase = await createClient()
      if (!supabase) {
        console.error('Supabase client not available for game monitoring')
        return
      }

      // Check and update game statuses using database function
      const { error: updateError } = await supabase.rpc('check_and_update_game_status')
      
      if (updateError) {
        console.error('Error updating game statuses:', updateError)
        errors++
      } else {
        // Get updated games count
        const { data: updatedGames } = await supabase
          .from('games')
          .select('id, status, updated_at')
          .gte('updated_at', new Date(Date.now() - this.config.checkInterval).toISOString())
        
        gamesChecked = updatedGames?.length || 0
        statusUpdates = updatedGames?.filter(g => g.status === 'in_progress' || g.status === 'completed').length || 0
      }

      // Check for games that need live data updates
      await this.updateLiveGameData(supabase)

      // Notify connected clients of updates
      await this.notifyClients(supabase)

      // Update stats
      this.stats.lastCheck = new Date()
      this.stats.gamesChecked += gamesChecked
      this.stats.statusUpdates += statusUpdates
      this.stats.errors += errors
      this.stats.activeConnections = this.activeConnections.size

      const duration = Date.now() - startTime
      if (statusUpdates > 0) {
        console.log(`Game monitor: ${statusUpdates} status updates, ${gamesChecked} games checked in ${duration}ms`)
      }

    } catch (error) {
      console.error('Critical error during game monitoring:', error)
      this.stats.errors++
    }
  }

  /**
   * Update live game data from external APIs
   */
  private async updateLiveGameData(supabase: any): Promise<void> {
    try {
      // Get all live games
      const { data: liveGames, error } = await supabase
        .from('games')
        .select('id, sport, league, home_team_id, away_team_id, home_score, away_score, status')
        .in('status', ['in_progress', 'live'])

      if (error) {
        console.error('Error fetching live games:', error)
        return
      }

      if (!liveGames || liveGames.length === 0) return

      // Update each live game with fresh data
      for (const game of liveGames) {
        try {
          await this.updateSingleGameData(supabase, game)
        } catch (error) {
          console.error(`Error updating game ${game.id}:`, error)
        }
      }

    } catch (error) {
      console.error('Error updating live game data:', error)
    }
  }

  /**
   * Update data for a single live game
   */
  private async updateSingleGameData(supabase: any, game: any): Promise<void> {
    // This would integrate with your live data APIs
    // For now, we'll just ensure the game status is correct
    
    const now = new Date()
    const gameStartTime = new Date(game.game_date)
    const hoursSinceStart = (now.getTime() - gameStartTime.getTime()) / (1000 * 60 * 60)

    // If game has been running too long, mark as completed
    if (hoursSinceStart > this.config.liveGameTimeout) {
      await supabase
        .from('games')
        .update({ 
          status: 'completed',
          updated_at: now.toISOString()
        })
        .eq('id', game.id)
    }
  }

  /**
   * Notify connected clients of game updates
   */
  private async notifyClients(supabase: any): Promise<void> {
    try {
      // Get recent updates
      const { data: recentUpdates } = await supabase
        .from('games')
        .select(`
          *,
          home_team_data:teams!games_home_team_id_fkey(name, logo_url, abbreviation),
          away_team_data:teams!games_away_team_id_fkey(name, logo_url, abbreviation)
        `)
        .gte('updated_at', new Date(Date.now() - this.config.checkInterval).toISOString())
        .in('status', ['in_progress', 'live', 'completed'])

      if (recentUpdates && recentUpdates.length > 0) {
        // Send updates to live stream endpoint
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/live-stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sport: 'all', // Send to all sports
            data: recentUpdates
          })
        }).catch(error => {
          console.warn('Failed to notify clients:', error)
        })
      }

    } catch (error) {
      console.error('Error notifying clients:', error)
    }
  }

  /**
   * Add a client connection
   */
  addConnection(connectionId: string): void {
    this.activeConnections.add(connectionId)
  }

  /**
   * Remove a client connection
   */
  removeConnection(connectionId: string): void {
    this.activeConnections.delete(connectionId)
  }

  /**
   * Get current monitoring statistics
   */
  getStats(): GameMonitorStats {
    return { ...this.stats }
  }

  /**
   * Get monitoring configuration
   */
  getConfig(): GameMonitorConfig {
    return { ...this.config }
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(newConfig: Partial<GameMonitorConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Check if monitoring service is running
   */
  isServiceRunning(): boolean {
    return this.isRunning
  }

  /**
   * Force a game status check
   */
  async forceCheck(): Promise<void> {
    await this.performGameCheck()
  }
}

// Export singleton instance
export const gameMonitorService = new GameMonitorService()
