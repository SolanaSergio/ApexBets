/**
 * Database Query Optimization
 * Provides optimized queries and caching strategies for better performance
 */

import { createClient } from '../supabase/server'

export class DatabaseOptimizer {
  private static instance: DatabaseOptimizer
  private queryCache = new Map<string, { data: any, timestamp: number, ttl: number }>()
  private readonly CACHE_TTL = 30000 // 30 seconds default

  static getInstance(): DatabaseOptimizer {
    if (!DatabaseOptimizer.instance) {
      DatabaseOptimizer.instance = new DatabaseOptimizer()
    }
    return DatabaseOptimizer.instance
  }

  /**
   * Optimized live games query with proper indexing hints
   */
  async getLiveGames(sport: string = 'all', limit: number = 50) {
    const cacheKey = `live-games-${sport}-${limit}`
    const cached = this.queryCache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data
    }

    try {
      const supabase = await createClient()
      if (!supabase) throw new Error('Database connection failed')

      let query = supabase
        .from('games')
        .select(`
          id,
          home_team_id,
          away_team_id,
          game_date,
          season,
          overtime_periods,
          home_score,
          away_score,
          status,
          venue,
          league_id,
          sport,
          attendance,
          game_type,
          created_at,
          updated_at,
          home_team_data:teams!games_home_team_id_fkey(name, logo_url, abbreviation),
          away_team_data:teams!games_away_team_id_fkey(name, logo_url, abbreviation)
        `)
        .in('status', ['live', 'in_progress', 'in progress'])
        .order('game_date', { ascending: true })
        .limit(limit)

      if (sport !== 'all') {
        query = query.eq('sport', sport)
      }

      const { data, error } = await query

      if (error) {
        console.error('Live games query error:', error)
        throw error
      }

      const result = data || []
      
      // Cache the result
      this.queryCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
        ttl: this.CACHE_TTL
      })

      return result
    } catch (error) {
      console.error('Failed to fetch live games:', error)
      return []
    }
  }

  /**
   * Optimized recent games query
   */
  async getRecentGames(sport: string = 'all', hours: number = 24, limit: number = 20) {
    const cacheKey = `recent-games-${sport}-${hours}-${limit}`
    const cached = this.queryCache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data
    }

    try {
      const supabase = await createClient()
      if (!supabase) throw new Error('Database connection failed')

      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

      let query = supabase
        .from('games')
        .select(`
          id,
          home_team_id,
          away_team_id,
          game_date,
          season,
          overtime_periods,
          home_score,
          away_score,
          status,
          venue,
          league_id,
          sport,
          attendance,
          game_type,
          created_at,
          updated_at,
          home_team_data:teams!games_home_team_id_fkey(name, logo_url, abbreviation),
          away_team_data:teams!games_away_team_id_fkey(name, logo_url, abbreviation)
        `)
        .eq('status', 'completed')
        .gte('created_at', cutoffTime)
        .order('game_date', { ascending: false })
        .limit(limit)

      if (sport !== 'all') {
        query = query.eq('sport', sport)
      }

      const { data, error } = await query

      if (error) {
        console.error('Recent games query error:', error)
        throw error
      }

      const result = data || []
      
      // Cache the result
      this.queryCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
        ttl: this.CACHE_TTL
      })

      return result
    } catch (error) {
      console.error('Failed to fetch recent games:', error)
      return []
    }
  }

  /**
   * Optimized upcoming games query
   */
  async getUpcomingGames(sport: string = 'all', days: number = 7, limit: number = 20) {
    const cacheKey = `upcoming-games-${sport}-${days}-${limit}`
    const cached = this.queryCache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data
    }

    try {
      const supabase = await createClient()
      if (!supabase) throw new Error('Database connection failed')

      const now = new Date().toISOString()
      const futureTime = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

      let query = supabase
        .from('games')
        .select(`
          id,
          home_team_id,
          away_team_id,
          game_date,
          season,
          overtime_periods,
          home_score,
          away_score,
          status,
          venue,
          league_id,
          sport,
          attendance,
          game_type,
          created_at,
          updated_at,
          home_team_data:teams!games_home_team_id_fkey(name, logo_url, abbreviation),
          away_team_data:teams!games_away_team_id_fkey(name, logo_url, abbreviation)
        `)
        .eq('status', 'scheduled')
        .gte('game_date', now)
        .lte('game_date', futureTime)
        .order('game_date', { ascending: true })
        .limit(limit)

      if (sport !== 'all') {
        query = query.eq('sport', sport)
      }

      const { data, error } = await query

      if (error) {
        console.error('Upcoming games query error:', error)
        throw error
      }

      const result = data || []
      
      // Cache the result
      this.queryCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
        ttl: this.CACHE_TTL
      })

      return result
    } catch (error) {
      console.error('Failed to fetch upcoming games:', error)
      return []
    }
  }

  /**
   * Batch query for multiple game types
   */
  async getGamesBatch(sport: string = 'all', options: {
    live?: boolean
    recent?: boolean
    upcoming?: boolean
    liveLimit?: number
    recentLimit?: number
    upcomingLimit?: number
  } = {}) {
    const {
      live = true,
      recent = true,
      upcoming = true,
      liveLimit = 20,
      recentLimit = 10,
      upcomingLimit = 10
    } = options

    const promises = []

    if (live) {
      promises.push(this.getLiveGames(sport, liveLimit))
    }
    if (recent) {
      promises.push(this.getRecentGames(sport, 24, recentLimit))
    }
    if (upcoming) {
      promises.push(this.getUpcomingGames(sport, 7, upcomingLimit))
    }

    try {
      const results = await Promise.allSettled(promises)
      
      return {
        live: live ? (results[0]?.status === 'fulfilled' ? results[0].value : []) : [],
        recent: recent ? (results[1]?.status === 'fulfilled' ? results[1].value : []) : [],
        upcoming: upcoming ? (results[2]?.status === 'fulfilled' ? results[2].value : []) : []
      }
    } catch (error) {
      console.error('Batch query failed:', error)
      return {
        live: [],
        recent: [],
        upcoming: []
      }
    }
  }

  /**
   * Clear cache for specific pattern or all
   */
  clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.queryCache.keys()) {
        if (key.includes(pattern)) {
          this.queryCache.delete(key)
        }
      }
    } else {
      this.queryCache.clear()
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.queryCache.size,
      keys: Array.from(this.queryCache.keys()),
      memoryUsage: JSON.stringify(Array.from(this.queryCache.values())).length
    }
  }

  /**
   * Clean up expired cache entries
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.queryCache) {
      if (now - entry.timestamp > entry.ttl) {
        this.queryCache.delete(key)
      }
    }
  }
}

// Auto-cleanup every 5 minutes
const optimizer = DatabaseOptimizer.getInstance()
setInterval(() => optimizer.cleanup(), 300000)

export const databaseOptimizer = optimizer
