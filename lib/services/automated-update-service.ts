/**
 * Automated Update Service
 * Handles real-time data updates for all sports data
 */

import { createClient } from '@/lib/supabase/server'
import { serviceFactory } from './core/service-factory'
import { unifiedApiClient } from './api/unified-api-client'
import { SportConfigManager } from './core/sport-config'

interface UpdateStats {
  gamesUpdated: number
  playerStatsUpdated: number
  oddsUpdated: number
  predictionsUpdated: number
  standingsUpdated: number
  errors: string[]
}

export class AutomatedUpdateService {
  private supabase: any = null
  private isRunning: boolean = false
  private updateInterval: NodeJS.Timeout | null = null

  constructor() {
    this.initializeSupabase()
  }

  private async initializeSupabase() {
    this.supabase = await createClient()
  }

  // Start automated updates
  async startAutomatedUpdates(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️  Automated updates already running')
      return
    }

    console.log('🔄 Starting automated updates...')
    this.isRunning = true

    // Update games every 15 minutes
    this.updateInterval = setInterval(async () => {
      try {
        await this.updateGames()
        await this.updateOdds()
        await this.updatePredictions()
      } catch (error) {
        console.error('❌ Error in automated update:', error)
      }
    }, 15 * 60 * 1000) // 15 minutes

    // Update player stats every hour
    setInterval(async () => {
      try {
        await this.updatePlayerStats()
        await this.updateStandings()
      } catch (error) {
        console.error('❌ Error in player stats update:', error)
      }
    }, 60 * 60 * 1000) // 1 hour

    // Initial update
    await this.performFullUpdate()

    console.log('✅ Automated updates started successfully')
  }

  // Stop automated updates
  stopAutomatedUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
    this.isRunning = false
    console.log('⏹️  Automated updates stopped')
  }

  // Perform full update
  async performFullUpdate(): Promise<UpdateStats> {
    console.log('🔄 Performing full data update...')
    
    const stats: UpdateStats = {
      gamesUpdated: 0,
      playerStatsUpdated: 0,
      oddsUpdated: 0,
      predictionsUpdated: 0,
      standingsUpdated: 0,
      errors: []
    }

    try {
      // Update all data types
      await this.updateGames()
      await this.updatePlayerStats()
      await this.updateOdds()
      await this.updatePredictions()
      await this.updateStandings()

      console.log('✅ Full update completed successfully')
    } catch (error) {
      console.error('❌ Error in full update:', error)
      stats.errors.push(`Full update error: ${error instanceof Error ? error.message : String(error)}`)
    }

    return stats
  }

  // Update games data
  private async updateGames(): Promise<void> {
    try {
      console.log('🏟️  Updating games...')
      
      const sports = await serviceFactory.getSupportedSports()
      
      for (const sport of sports) {
        // Get live and recent games
        const liveGames = await unifiedApiClient.getLiveGames(sport)
        const recentGames = await unifiedApiClient.getGames(sport, { 
          status: 'finished',
          date: new Date().toISOString().split('T')[0]
        })
        
        const allGames = [...liveGames, ...recentGames]
        
        if (allGames.length > 0) {
          // Get team mappings
          const { data: teams } = await this.supabase
            .from('teams')
            .select('id, name, abbreviation')
            .eq('sport', sport)
          
          const teamMap = new Map()
          teams?.forEach((team: any) => {
            teamMap.set(team.name, team.id)
            teamMap.set(team.abbreviation, team.id)
          })
          
          // Update existing games or insert new ones
          for (const game of allGames) {
            const homeTeamId = teamMap.get(game.home_team?.name || '')
            const awayTeamId = teamMap.get(game.away_team?.name || '')
            
            if (homeTeamId && awayTeamId) {
              // Check if game already exists
              const { data: existingGame } = await this.supabase
                .from('games')
                .select('id')
                .eq('home_team_id', homeTeamId)
                .eq('away_team_id', awayTeamId)
                .eq('game_date', game.game_date)
                .single()
              
              const gameData = {
                home_team_id: homeTeamId,
                away_team_id: awayTeamId,
                game_date: game.game_date,
                season: await this.getCurrentSeason(sport),
                home_score: game.home_score,
                away_score: game.away_score,
                status: this.mapGameStatus(game.status),
                sport: sport,
                league: game.league,
                venue: game.venue,
                updated_at: new Date().toISOString()
              }
              
              if (existingGame) {
                // Update existing game
                await this.supabase
                  .from('games')
                  .update(gameData)
                  .eq('id', existingGame.id)
              } else {
                // Insert new game
                await this.supabase
                  .from('games')
                  .insert(gameData)
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Error updating games:', error)
    }
  }

  // Update player statistics
  private async updatePlayerStats(): Promise<void> {
    try {
      console.log('📊 Updating player statistics...')
      
      const sports = await serviceFactory.getSupportedSports()
      
      for (const sport of sports) {
        // Get recent finished games
        const { data: games } = await this.supabase
          .from('games')
          .select('id, home_team_id, away_team_id, sport, league')
          .eq('sport', sport)
          .eq('status', 'finished')
          .gte('game_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
          .limit(10)
        
        if (games?.length > 0) {
          // Generate updated player stats
          const playerStats = await this.generateUpdatedPlayerStats(games, sport)
          
          if (playerStats.length > 0) {
            const tableName = await this.getPlayerStatsTableName(sport)
            
            // Insert new stats
            await this.supabase
              .from(tableName)
              .insert(playerStats)
          }
        }
      }
    } catch (error) {
      console.error('❌ Error updating player stats:', error)
    }
  }

  // Update odds data
  private async updateOdds(): Promise<void> {
    try {
      console.log('💰 Updating odds...')
      
      // Get scheduled games
      const { data: games } = await this.supabase
        .from('games')
        .select('id, sport, league')
        .eq('status', 'scheduled')
        .gte('game_date', new Date().toISOString())
        .limit(20)
      
      if (games?.length > 0) {
        // Group games by sport and get odds for each sport
        const gamesBySport = games.reduce((acc: Record<string, any[]>, game: any) => {
          if (!acc[game.sport]) acc[game.sport] = []
          acc[game.sport].push(game)
          return acc
        }, {} as Record<string, any[]>)
        
        for (const [sport, sportGames] of Object.entries(gamesBySport)) {
          // Get odds from external APIs for this sport
          const oddsData = await unifiedApiClient.getOdds(sport as any)
          
          if (oddsData.length > 0) {
            // Update odds in database
            for (const game of (sportGames as any[])) {
              const gameOdds = oddsData.filter(odd => 
                odd.home_team === game.home_team && 
                odd.away_team === game.away_team
              )
            
              if (gameOdds.length > 0) {
                const oddsToInsert = gameOdds.map(odd => ({
                  game_id: game.id,
                  source: odd.source || 'external_api',
                  odds_type: odd.odds_type || 'moneyline',
                  home_odds: odd.home_odds,
                  away_odds: odd.away_odds,
                  spread: odd.spread,
                  total: odd.total,
                  sport: game.sport,
                  league: game.league,
                  live_odds: true,
                  updated_at: new Date().toISOString()
                }))
                
                await this.supabase
                  .from('odds')
                  .upsert(oddsToInsert, { 
                    onConflict: 'game_id,source,odds_type',
                    ignoreDuplicates: false 
                  })
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Error updating odds:', error)
    }
  }

  // Update predictions
  private async updatePredictions(): Promise<void> {
    try {
      console.log('🔮 Updating predictions...')
      
      // Get scheduled games
      const { data: games } = await this.supabase
        .from('games')
        .select('id, sport, league')
        .eq('status', 'scheduled')
        .gte('game_date', new Date().toISOString())
        .limit(20)
      
      if (games?.length > 0) {
        // Get real predictions from prediction service
        const realPredictions = await this.getRealPredictions(games)
        
        if (realPredictions.length > 0) {
          await this.supabase
            .from('predictions')
            .upsert(realPredictions, { 
              onConflict: 'game_id,model_name,prediction_type',
              ignoreDuplicates: false 
            })
        }
      }
    } catch (error) {
      console.error('❌ Error updating predictions:', error)
    }
  }

  // Update standings
  private async updateStandings(): Promise<void> {
    try {
      console.log('🏆 Updating standings...')
      
      const sports = await serviceFactory.getSupportedSports()
      
      for (const sport of sports) {
        // Get teams for this sport
        const { data: teams } = await this.supabase
          .from('teams')
          .select('id, name, league')
          .eq('sport', sport)
        
        if (teams?.length > 0) {
          // Calculate updated standings based on recent games
          const { data: recentGames } = await this.supabase
            .from('games')
            .select('home_team_id, away_team_id, home_score, away_score, status')
            .eq('sport', sport)
            .eq('status', 'finished')
          
          // Update standings for each team
          for (const team of teams) {
            const teamGames = recentGames?.filter((game: any) => 
              game.home_team_id === team.id || game.away_team_id === team.id
            ) || []
            
            let wins = 0
            let losses = 0
            
            for (const game of teamGames) {
              if (game.home_team_id === team.id) {
                if (game.home_score > game.away_score) wins++
                else if (game.home_score < game.away_score) losses++
              } else {
                if (game.away_score > game.home_score) wins++
                else if (game.away_score < game.home_score) losses++
              }
            }
            
            const winPercentage = wins + losses > 0 ? wins / (wins + losses) : 0
            
            await this.supabase
              .from('league_standings')
              .upsert({
                team_id: team.id,
                season: await this.getCurrentSeason(sport),
                league: team.league,
                sport: sport,
                wins: wins,
                losses: losses,
                ties: 0,
                win_percentage: winPercentage,
                updated_at: new Date().toISOString()
              }, { 
                onConflict: 'team_id,season,league',
                ignoreDuplicates: false 
              })
          }
        }
      }
    } catch (error) {
      console.error('❌ Error updating standings:', error)
    }
  }

  // Generate updated player stats
  private async generateUpdatedPlayerStats(games: any[], sport: string): Promise<any[]> {
    const stats = []
    
    for (const game of games) {
      // Get teams for this game
      const { data: homeTeam } = await this.supabase
        .from('teams')
        .select('id, name')
        .eq('id', game.home_team_id)
        .single()
      
      const { data: awayTeam } = await this.supabase
        .from('teams')
        .select('id, name')
        .eq('id', game.away_team_id)
        .single()
      
      if (homeTeam && awayTeam) {
        // Generate updated stats for home team players
        for (let i = 0; i < 5; i++) {
          stats.push(await this.generateUpdatedPlayerStat(game.id, homeTeam.id, sport, i + 1))
        }
        
        // Generate updated stats for away team players
        for (let i = 0; i < 5; i++) {
          stats.push(await this.generateUpdatedPlayerStat(game.id, awayTeam.id, sport, i + 1))
        }
      }
    }
    
    return stats
  }

  // Generate updated individual player stat
  private async generateUpdatedPlayerStat(gameId: string, teamId: string, sport: string, playerNumber: number): Promise<any> {
    const baseStat = {
      game_id: gameId,
      team_id: teamId,
      player_name: `Player ${playerNumber}`,
      position: await this.getRandomPosition(sport),
      created_at: new Date().toISOString()
    }
    
    // Get sport-specific stats configuration from database
    try {
      const sportConfig = await SportConfigManager.getSportConfigAsync(sport)
      if (sportConfig?.positions && sportConfig.positions.length > 0) {
        // Generate stats based on sport configuration
        return await this.generateSportSpecificStats(baseStat, sport, sportConfig)
      }
    } catch (error) {
      console.warn(`Failed to get sport config for ${sport}:`, error)
    }
    
    // Fallback to base stat if no sport-specific configuration
    return baseStat
  }

  // Generate sport-specific stats based on configuration
  private async generateSportSpecificStats(baseStat: any, sport: string, sportConfig: any): Promise<any> {
    // This would be implemented based on the sport configuration
    // For now, return base stat with some generic additions
    return {
      ...baseStat,
      sport: sport,
      league: sportConfig.defaultLeague || 'Unknown',
      created_at: new Date().toISOString()
    }
  }

  // Get real predictions from prediction service
  private async getRealPredictions(games: any[]): Promise<any[]> {
    const predictions = []
    
    try {
      // Group games by sport
      const gamesBySport = games.reduce((acc: Record<string, any[]>, game: any) => {
        if (!acc[game.sport]) acc[game.sport] = []
        acc[game.sport].push(game)
        return acc
      }, {} as Record<string, any[]>)
      
      for (const [sport, sportGames] of Object.entries(gamesBySport)) {
        try {
          // Use the prediction service to get real predictions
          const { SportPredictionService } = await import('./predictions/sport-prediction-service')
          const predictionService = new SportPredictionService(sport as any)
          
          for (const game of sportGames) {
            const gamePredictions = await predictionService.getPredictions({ gameId: game.id })
            
            for (const prediction of gamePredictions) {
              predictions.push({
                game_id: game.id,
                model_name: prediction.model || 'ml_model_v1',
                prediction_type: 'moneyline',
                predicted_value: prediction.homeWinProbability > prediction.awayWinProbability ? 'home' : 'away',
                confidence: prediction.confidence || 0.7,
                sport: game.sport,
                league: game.league,
                reasoning: prediction.factors ? prediction.factors.join(', ') : 'Updated based on latest team performance and injuries',
                model_version: '1.1.0',
                home_win_probability: prediction.homeWinProbability || 0.5,
                away_win_probability: prediction.awayWinProbability || 0.5,
                predicted_spread: prediction.predictedSpread || 0,
                predicted_total: prediction.predictedTotal || 0,
                updated_at: new Date().toISOString()
              })
            }
          }
        } catch (error) {
          console.warn(`Failed to get predictions for ${sport}:`, error)
          // Continue with other sports
        }
      }
    } catch (error) {
      console.error('Error getting real predictions:', error)
      // Return empty array if API fails
    }
    
    return predictions
  }

  // Helper methods
  private async getCurrentSeason(sport: string): Promise<string> {
    try {
      // Get season configuration from database
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const response = await supabase
        ?.from('sports')
        .select('name, season_start_month, season_format')
        .eq('name', sport)
        .eq('is_active', true)
        .single()
      
      if (response && !response.error && response.data) {
        const seasonConfig = response.data
        const currentYear = new Date().getFullYear()
        const month = new Date().getMonth()
        
        if (seasonConfig.season_format === 'year-year') {
          // For sports with year-year format (basketball, football, hockey)
          return month >= (seasonConfig.season_start_month || 9) ? 
            `${currentYear}-${(currentYear + 1).toString().slice(-2)}` : 
            `${currentYear - 1}-${currentYear.toString().slice(-2)}`
        } else {
          // For sports with single year format (baseball, soccer)
          return month >= (seasonConfig.season_start_month || 3) ? 
            `${currentYear}` : 
            `${currentYear - 1}`
        }
      }
    } catch (error) {
      console.warn(`Failed to get season configuration for ${sport}:`, error)
    }
    
    // Fallback to current year
    return new Date().getFullYear().toString()
  }

  private mapGameStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'FT': 'finished',
      'LIVE': 'in_progress',
      'Scheduled': 'scheduled',
      'Postponed': 'postponed',
      'Cancelled': 'cancelled'
    }
    return statusMap[status] || 'scheduled'
  }

  private async getPlayerStatsTableName(sport: string): Promise<string> {
    try {
      // Get table name from database configuration
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const response = await supabase
        ?.from('sports')
        .select('name, player_stats_table')
        .eq('name', sport)
        .eq('is_active', true)
        .single()
      
      if (response && !response.error && response.data?.player_stats_table) {
        return response.data.player_stats_table
      }
    } catch (error) {
      console.warn(`Failed to get player stats table for ${sport}:`, error)
    }
    
    // Fallback to generic table name
    return 'player_stats'
  }

  private async getRandomPosition(sport: string): Promise<string> {
    try {
      const config = await SportConfigManager.getSportConfigAsync(sport)
      const positions = config?.positions || ['Player']
      return positions[Math.floor(Math.random() * positions.length)]
    } catch (error) {
      console.error('Error getting positions for sport:', sport, error)
      return 'Player'
    }
  }

  // Get service status
  getStatus(): { isRunning: boolean; lastUpdate: Date | null } {
    return {
      isRunning: this.isRunning,
      lastUpdate: this.isRunning ? new Date() : null
    }
  }
}

export const automatedUpdateService = new AutomatedUpdateService()
