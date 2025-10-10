/**
 * Optimized Sports Data Storage Service
 * Efficiently stores and retrieves sports API data for fast access
 */

import { productionSupabaseClient } from '../supabase/production-client'
import { databaseCacheService } from '../services/database-cache-service'
import { structuredLogger } from './structured-logger'
// Removed unused enhancedRateLimiter import

export interface SportsDataConfig {
  sport: string
  league: string
  season: string
  dataType: 'games' | 'teams' | 'players' | 'standings' | 'odds' | 'stats'
  ttl: number
  priority: 'low' | 'medium' | 'high' | 'critical'
}

export interface StorageResult<T> {
  data: T
  cached: boolean
  source: 'database' | 'api' | 'cache'
  responseTime: number
  lastUpdated: string
}

export class OptimizedSportsStorage {
  private static instance: OptimizedSportsStorage
  // Reserved for future in-memory cache; currently unused to ensure DB-first storage
  // Keeping declaration removed to avoid unused field while preserving API surface

  private constructor() {}

  static getInstance(): OptimizedSportsStorage {
    if (!OptimizedSportsStorage.instance) {
      OptimizedSportsStorage.instance = new OptimizedSportsStorage()
    }
    return OptimizedSportsStorage.instance
  }

  async storeGames(sport: string, league: string, games: any[]): Promise<void> {
    try {
      const batchSize = 100
      const batches = this.chunkArray(games, batchSize)

      for (const batch of batches) {
        const values = batch.map(game => ({
          id: game.id || this.generateId(),
          sport,
          league,
          season: game.season || this.getCurrentSeason(sport),
          home_team_id: game.home_team_id || null,
          away_team_id: game.away_team_id || null,
          game_date: game.game_date || game.date || new Date().toISOString(),
          status: game.status || 'scheduled',
          home_score: game.home_score || game.homeScore || null,
          away_score: game.away_score || game.awayScore || null,
          venue: game.venue || null,
          last_updated: new Date().toISOString()
        }))

        const insertQuery = `
          INSERT INTO games (id, sport, league_id, season, home_team_id, away_team_id, game_date, status, home_score, away_score, venue, last_updated)
          VALUES ${values.map(v => `('${v.id}', '${v.sport}', '${v.league_id}', '${v.season}', ${v.home_team_id ? `'${v.home_team_id}'` : 'NULL'}, ${v.away_team_id ? `'${v.away_team_id}'` : 'NULL'}, '${v.game_date}', '${v.status}', ${v.home_score || 'NULL'}, ${v.away_score || 'NULL'}, ${v.venue ? `'${v.venue}'` : 'NULL'}, '${v.last_updated}')`).join(', ')}
        `

        await productionSupabaseClient.executeSQL(insertQuery)
      }

      // Invalidate cache keys related to this sport after writes
      try {
        await databaseCacheService.clearBySport(sport)
      } catch {}

      structuredLogger.info('Stored games', { count: games.length, sport, league })
    } catch (error) {
      structuredLogger.error('Failed to store games', { error: error instanceof Error ? error.message : String(error), sport, league })
      throw error
    }
  }

  async storeTeams(sport: string, league: string, teams: any[]): Promise<void> {
    try {
      const batchSize = 50
      const batches = this.chunkArray(teams, batchSize)

      for (const batch of batches) {
        const values = batch.map(team => ({
          id: team.id || this.generateId(),
          name: this.escape(String(team.name || team.teamName || team.full_name || '')),
          sport: this.escape(String(sport)),
          league: this.escape(String(league)),
          abbreviation: this.escape(String(team.abbreviation || team.abbr || team.teamAbbreviation || '')),
          city: this.escape(String(team.city || team.homeTeam || '')),
          logo_url: team.logo_url ? this.escape(String(team.logo_url)) : (team.logoUrl ? this.escape(String(team.logoUrl)) : (team.logo ? this.escape(String(team.logo)) : null)),
          conference: team.conference ? this.escape(String(team.conference)) : null,
          division: team.division ? this.escape(String(team.division)) : null,
          founded_year: team.foundedYear || team.founded || null,
          stadium_name: team.stadiumName ? this.escape(String(team.stadiumName)) : (team.stadium ? this.escape(String(team.stadium)) : null),
          stadium_capacity: team.stadiumCapacity || team.capacity || null,
          primary_color: team.primaryColor ? this.escape(String(team.primaryColor)) : (team.primary_color ? this.escape(String(team.primary_color)) : null),
          secondary_color: team.secondaryColor ? this.escape(String(team.secondaryColor)) : (team.secondary_color ? this.escape(String(team.secondary_color)) : null),
          country: team.country ? this.escape(String(team.country)) : null,
          is_active: team.isActive !== false,
          last_updated: new Date().toISOString()
        }))

        const insertQuery = `
          INSERT INTO teams (id, name, sport, league_id, abbreviation, city, logo_url, conference, division, founded_year, venue, venue_capacity, colors, country, is_active, last_updated)
          VALUES ${values.map(v => `('${v.id}', '${v.name}', '${v.sport}', '${v.league_id}', '${v.abbreviation}', '${v.city}', ${v.logo_url ? `'${v.logo_url}'` : 'NULL'}, ${v.conference ? `'${v.conference}'` : 'NULL'}, ${v.division ? `'${v.division}'` : 'NULL'}, ${v.founded_year || 'NULL'}, ${v.venue ? `'${v.venue}'` : 'NULL'}, ${v.venue_capacity || 'NULL'}, ${v.colors ? `'${JSON.stringify(v.colors)}'` : 'NULL'}, ${v.country ? `'${v.country}'` : 'NULL'}, ${v.is_active}, '${v.last_updated}')`).join(', ')}
        `

        await productionSupabaseClient.executeSQL(insertQuery)
      }

      // Invalidate cache keys related to this sport after writes
      try {
        await databaseCacheService.clearBySport(sport)
      } catch {}

      structuredLogger.info('Stored teams', { count: teams.length, sport, league })
    } catch (error) {
      structuredLogger.error('Failed to store teams', { error: error instanceof Error ? error.message : String(error), sport, league })
      throw error
    }
  }

  async storePlayers(sport: string, league: string, players: any[]): Promise<void> {
    try {
      const batchSize = 50
      const batches = this.chunkArray(players, batchSize)

      for (const batch of batches) {
        const values = batch.map(player => ({
          id: player.id || this.generateId(),
          name: player.name || player.fullName || player.full_name,
          sport,
          position: player.position || null,
          team_id: player.team_id || player.teamId || null,
          team_name: player.team_name || player.teamName || null,
          height: player.height || null,
          weight: player.weight || null,
          age: player.age || null,
          experience_years: player.experienceYears || player.experience || null,
          college: player.college || null,
          country: player.country || null,
          jersey_number: player.jerseyNumber || player.jersey_number || null,
          is_active: player.isActive !== false,
          headshot_url: player.headshotUrl || player.headshot_url || player.headshot || null,
          last_updated: new Date().toISOString()
        }))

        const insertQuery = `
          INSERT INTO players (id, name, sport, position, team_id, league, jersey_number, height, weight, age, birth_date, nationality, salary, contract_end_date, is_active, external_id, created_at, updated_at)
          VALUES ${values.map(v => `('${v.id}', '${v.name}', '${v.sport}', ${v.position ? `'${v.position}'` : 'NULL'}, ${v.team_id ? `'${v.team_id}'` : 'NULL'}, ${v.league ? `'${v.league}'` : 'NULL'}, ${v.jersey_number || 'NULL'}, ${v.height ? `'${v.height}'` : 'NULL'}, ${v.weight || 'NULL'}, ${v.age || 'NULL'}, ${v.birth_date ? `'${v.birth_date}'` : 'NULL'}, ${v.nationality ? `'${v.nationality}'` : 'NULL'}, ${v.salary || 'NULL'}, ${v.contract_end_date ? `'${v.contract_end_date}'` : 'NULL'}, ${v.is_active}, ${v.external_id ? `'${v.external_id}'` : 'NULL'}, '${v.created_at}', '${v.updated_at}')`).join(', ')}
        `

        await productionSupabaseClient.executeSQL(insertQuery)
      }

      // Invalidate cache keys related to this sport after writes
      try {
        await databaseCacheService.clearBySport(sport)
      } catch {}

      structuredLogger.info('Stored players', { count: players.length, sport, league })
    } catch (error) {
      structuredLogger.error('Failed to store players', { error: error instanceof Error ? error.message : String(error), sport, league })
      throw error
    }
  }

  async getGames(sport: string, league?: string, date?: string, status?: string): Promise<StorageResult<any[]>> {
    const startTime = Date.now()
    
    try {
      let query = `
        SELECT g.*, 
               ht.name as home_team_name, ht.abbreviation as home_team_abbr, ht.logo_url as home_team_logo,
               at.name as away_team_name, at.abbreviation as away_team_abbr, at.logo_url as away_team_logo
        FROM games g
        LEFT JOIN teams ht ON g.home_team_id = ht.id
        LEFT JOIN teams at ON g.away_team_id = at.id
        WHERE g.sport = '${sport}'
      `

      if (league) {
        query += ` AND g.league = '${league}'`
      }

      if (date) {
        query += ` AND DATE(g.game_date) = '${date}'`
      }

      if (status) {
        query += ` AND g.status = '${status}'`
      }

      query += ` ORDER BY g.game_date DESC LIMIT 100`

      const result = await productionSupabaseClient.executeSQL(query)
      const responseTime = Date.now() - startTime

      return {
        data: result.success ? result.data : [],
        cached: false,
        source: 'database',
        responseTime,
        lastUpdated: new Date().toISOString()
      }
    } catch (error) {
      console.error('Failed to get games:', error)
      return {
        data: [],
        cached: false,
        source: 'database',
        responseTime: Date.now() - startTime,
        lastUpdated: new Date().toISOString()
      }
    }
  }

  async getTeams(sport: string, league?: string): Promise<StorageResult<any[]>> {
    const startTime = Date.now()
    
    try {
      let query = `SELECT * FROM teams WHERE sport = '${sport}'`
      
      if (league) {
        query += ` AND league = '${league}'`
      }

      query += ` ORDER BY name LIMIT 100`

      const result = await productionSupabaseClient.executeSQL(query)
      const responseTime = Date.now() - startTime

      return {
        data: result.success ? result.data : [],
        cached: false,
        source: 'database',
        responseTime,
        lastUpdated: new Date().toISOString()
      }
    } catch (error) {
      structuredLogger.error('Failed to get teams', { error: error instanceof Error ? error.message : String(error), sport, league })
      return {
        data: [],
        cached: false,
        source: 'database',
        responseTime: Date.now() - startTime,
        lastUpdated: new Date().toISOString()
      }
    }
  }

  async getPlayers(sport: string, teamId?: string, limit: number = 100): Promise<StorageResult<any[]>> {
    const startTime = Date.now()
    
    try {
      let query = `SELECT * FROM players WHERE sport = '${sport}'`
      
      if (teamId) {
        query += ` AND team_id = '${teamId}'`
      }

      query += ` ORDER BY name LIMIT ${limit}`

      const result = await productionSupabaseClient.executeSQL(query)
      const responseTime = Date.now() - startTime

      return {
        data: result.success ? result.data : [],
        cached: false,
        source: 'database',
        responseTime,
        lastUpdated: new Date().toISOString()
      }
    } catch (error) {
      structuredLogger.error('Failed to get players', { error: error instanceof Error ? error.message : String(error), sport, teamId })
      return {
        data: [],
        cached: false,
        source: 'database',
        responseTime: Date.now() - startTime,
        lastUpdated: new Date().toISOString()
      }
    }
  }

  async storeStandings(sport: string, league: string, standings: any[]): Promise<void> {
    try {
      const batchSize = 50
      const batches = this.chunkArray(standings, batchSize)

      for (const batch of batches) {
        const values = batch.map((standing, index) => ({
          id: standing.id || this.generateId(),
          sport,
          league,
          season: standing.season || this.getCurrentSeason(sport),
          team_id: standing.team_id || standing.teamId || null,
          team_name: standing.team_name || standing.teamName || standing.name,
          position: standing.position || index + 1,
          wins: standing.wins || standing.w || 0,
          losses: standing.losses || standing.l || 0,
          ties: standing.ties || standing.t || 0,
          win_percentage: standing.win_percentage || standing.winPercentage || null,
          games_behind: standing.games_behind || standing.gamesBehind || null,
          points_for: standing.points_for || standing.pointsFor || 0,
          points_against: standing.points_against || standing.pointsAgainst || 0,
          last_updated: new Date().toISOString()
        }))

        const insertQuery = `
          INSERT INTO league_standings (id, sport, league_id, season, team_id, team_name, position, wins, losses, ties, win_percentage, games_back, points_for, points_against, last_updated)
          VALUES ${values.map(v => `('${v.id}', '${v.sport}', '${v.league_id}', '${v.season}', ${v.team_id ? `'${v.team_id}'` : 'NULL'}, '${v.team_name}', ${v.position}, ${v.wins}, ${v.losses}, ${v.ties}, ${v.win_percentage || 'NULL'}, ${v.games_back || 'NULL'}, ${v.points_for}, ${v.points_against}, '${v.last_updated}')`).join(', ')}
        `

        await productionSupabaseClient.executeSQL(insertQuery)
      }

      structuredLogger.info('Stored standings', { count: standings.length, sport, league })
    } catch (error) {
      structuredLogger.error('Failed to store standings', { error: error instanceof Error ? error.message : String(error), sport, league })
      throw error
    }
  }

  async getStandings(sport: string, league: string, season?: string): Promise<StorageResult<any[]>> {
    const startTime = Date.now()
    
    try {
      let query = `
        SELECT s.*, t.name as team_name, t.abbreviation, t.logo_url
        FROM standings s
        LEFT JOIN teams t ON s.team_id = t.id
        WHERE s.sport = '${sport}' AND s.league = '${league}'
      `

      if (season) {
        query += ` AND s.season = '${season}'`
      }

      query += ` ORDER BY s.position ASC`

      const result = await productionSupabaseClient.executeSQL(query)
      const responseTime = Date.now() - startTime

      return {
        data: result.success ? result.data : [],
        cached: false,
        source: 'database',
        responseTime,
        lastUpdated: new Date().toISOString()
      }
    } catch (error) {
      console.error('Failed to get standings:', error)
      return {
        data: [],
        cached: false,
        source: 'database',
        responseTime: Date.now() - startTime,
        lastUpdated: new Date().toISOString()
      }
    }
  }

  private escape(value: string): string {
    return value.replace(/'/g, "''")
  }

  async clearOldData(sport: string, daysToKeep: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

      // Clear old games
      await productionSupabaseClient.executeSQL(`
        DELETE FROM games 
        WHERE sport = '${sport}' 
        AND game_date < '${cutoffDate.toISOString()}'
        AND status = 'finished'
      `)

      // Clear old cache entries
      await productionSupabaseClient.executeSQL(`
        DELETE FROM cache_entries 
        WHERE sport = '${sport}' 
        AND expires_at < '${new Date().toISOString()}'
      `)

      console.log(`✅ Cleared old data for ${sport} (older than ${daysToKeep} days)`)
    } catch (error) {
      console.error('Failed to clear old data:', error)
    }
  }

  async getStorageStats(): Promise<{
    totalGames: number
    totalTeams: number
    totalPlayers: number
    totalStandings: number
    cacheEntries: number
    lastUpdated: string
  }> {
    try {
      const [gamesResult, teamsResult, playersResult, standingsResult, cacheResult] = await Promise.all([
        productionSupabaseClient.executeSQL('SELECT COUNT(*) as count FROM games'),
        productionSupabaseClient.executeSQL('SELECT COUNT(*) as count FROM teams'),
        productionSupabaseClient.executeSQL('SELECT COUNT(*) as count FROM players'),
        productionSupabaseClient.executeSQL('SELECT COUNT(*) as count FROM standings'),
        productionSupabaseClient.executeSQL('SELECT COUNT(*) as count FROM cache_entries')
      ])

      return {
        totalGames: parseInt(gamesResult.success && gamesResult.data && gamesResult.data[0] ? gamesResult.data[0].count : 0) || 0,
        totalTeams: parseInt(teamsResult.success && teamsResult.data && teamsResult.data[0] ? teamsResult.data[0].count : 0) || 0,
        totalPlayers: parseInt(playersResult.success && playersResult.data && playersResult.data[0] ? playersResult.data[0].count : 0) || 0,
        totalStandings: parseInt(standingsResult.success && standingsResult.data && standingsResult.data[0] ? standingsResult.data[0].count : 0) || 0,
        cacheEntries: parseInt(cacheResult.success && cacheResult.data && cacheResult.data[0] ? cacheResult.data[0].count : 0) || 0,
        lastUpdated: new Date().toISOString()
      }
    } catch (error) {
      console.error('Failed to get storage stats:', error)
      return {
        totalGames: 0,
        totalTeams: 0,
        totalPlayers: 0,
        totalStandings: 0,
        cacheEntries: 0,
        lastUpdated: new Date().toISOString()
      }
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getCurrentSeason(_sport: string): string {
    const year = new Date().getFullYear()
    const month = new Date().getMonth()
    
    // Most sports seasons start in fall/winter
    if (month >= 8) {
      return `${year}-${(year + 1).toString().slice(-2)}`
    } else {
      return `${year - 1}-${year.toString().slice(-2)}`
    }
  }
}

export const optimizedSportsStorage = OptimizedSportsStorage.getInstance()
