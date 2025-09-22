/**
 * Database Repository Service
 * Centralized database operations for all entities
 * Sport-agnostic and professional implementation
 */

import { databaseService } from './database-service'
import { structuredLogger } from './structured-logger'

export interface RepositoryResult<T> {
  success: boolean
  data: T[]
  count: number
  error?: string
}

export interface PaginationOptions {
  limit?: number
  offset?: number
  orderBy?: string
  orderDirection?: 'ASC' | 'DESC'
}

export interface FilterOptions {
  [key: string]: any
}

export class DatabaseRepository {
  private static instance: DatabaseRepository

  public static getInstance(): DatabaseRepository {
    if (!DatabaseRepository.instance) {
      DatabaseRepository.instance = new DatabaseRepository()
    }
    return DatabaseRepository.instance
  }

  /**
   * Generic find method for any table
   */
  async find<T>(
    table: string, 
    filters: FilterOptions = {}, 
    pagination: PaginationOptions = {}
  ): Promise<RepositoryResult<T>> {
    try {
      let query = `SELECT * FROM ${table} WHERE 1=1`
      const params: any[] = []
      let paramCount = 0

      // Add filters
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          paramCount++
          query += ` AND ${key} = $${paramCount}`
          params.push(value)
        }
      }

      // Add ordering
      if (pagination.orderBy) {
        const direction = pagination.orderDirection || 'ASC'
        query += ` ORDER BY ${pagination.orderBy} ${direction}`
      }

      // Add pagination
      if (pagination.limit) {
        paramCount++
        query += ` LIMIT $${paramCount}`
        params.push(pagination.limit)
      }

      if (pagination.offset) {
        paramCount++
        query += ` OFFSET $${paramCount}`
        params.push(pagination.offset)
      }

      const result = await databaseService.executeSQL(query, params)

      if (!result.success) {
        structuredLogger.error('Repository find failed', {
          table,
          error: result.error,
          filters,
          pagination
        })
        return {
          success: false,
          data: [],
          count: 0,
          ...(result.error ? { error: result.error } : {})
        }
      }

      return {
        success: true,
        data: result.data || [],
        count: result.data?.length || 0
      }

    } catch (error) {
      structuredLogger.error('Repository find error', {
        table,
        error: error instanceof Error ? error.message : String(error),
        filters,
        pagination
      })
      return {
        success: false,
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Find by ID
   */
  async findById<T>(table: string, id: string): Promise<RepositoryResult<T>> {
    return this.find<T>(table, { id })
  }

  /**
   * Find one record
   */
  async findOne<T>(table: string, filters: FilterOptions = {}): Promise<T | null> {
    const result = await this.find<T>(table, filters, { limit: 1 })
    return result.success && result.data.length > 0 ? result.data[0] : null
  }

  /**
   * Count records
   */
  async count(table: string, filters: FilterOptions = {}): Promise<number> {
    try {
      let query = `SELECT COUNT(*) as count FROM ${table} WHERE 1=1`
      const params: any[] = []
      let paramCount = 0

      // Add filters
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          paramCount++
          query += ` AND ${key} = $${paramCount}`
          params.push(value)
        }
      }

      const result = await databaseService.executeSQL(query, params)

      if (!result.success) {
        structuredLogger.error('Repository count failed', {
          table,
          error: result.error,
          filters
        })
        return 0
      }

      return parseInt(result.data?.[0]?.count) || 0

    } catch (error) {
      structuredLogger.error('Repository count error', {
        table,
        error: error instanceof Error ? error.message : String(error),
        filters
      })
      return 0
    }
  }

  /**
   * Insert single record
   */
  async insert<T>(table: string, data: Partial<T>): Promise<RepositoryResult<T>> {
    try {
      const columns = Object.keys(data).filter(key => data[key as keyof T] !== undefined)
      const values = columns.map(key => data[key as keyof T])
      const placeholders = columns.map((_, index) => `$${index + 1}`)

      const query = `
        INSERT INTO ${table} (${columns.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING *
      `

      const result = await databaseService.executeSQL(query, values)

      if (!result.success) {
        structuredLogger.error('Repository insert failed', {
          table,
          error: result.error,
          data
        })
        return {
          success: false,
          data: [],
          count: 0,
          ...(result.error ? { error: result.error } : {})
        }
      }

      return {
        success: true,
        data: result.data || [],
        count: result.data?.length || 0
      }

    } catch (error) {
      structuredLogger.error('Repository insert error', {
        table,
        error: error instanceof Error ? error.message : String(error),
        data
      })
      return {
        success: false,
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Insert multiple records
   */
  async insertMany<T>(table: string, dataArray: Partial<T>[]): Promise<RepositoryResult<T>> {
    if (dataArray.length === 0) {
      return { success: true, data: [], count: 0 }
    }

    try {
      const columns = Object.keys(dataArray[0]).filter(key => 
        dataArray[0][key as keyof T] !== undefined
      )

      const values: any[] = []
      const placeholders: string[] = []
      let paramCount = 0

      for (const data of dataArray) {
        const rowPlaceholders: string[] = []
        for (const column of columns) {
          paramCount++
          rowPlaceholders.push(`$${paramCount}`)
          values.push(data[column as keyof T])
        }
        placeholders.push(`(${rowPlaceholders.join(', ')})`)
      }

      const query = `
        INSERT INTO ${table} (${columns.join(', ')})
        VALUES ${placeholders.join(', ')}
        RETURNING *
      `

      const result = await databaseService.executeSQL(query, values)

      if (!result.success) {
        structuredLogger.error('Repository insertMany failed', {
          table,
          error: result.error,
          count: dataArray.length
        })
        return {
          success: false,
          data: [],
          count: 0,
          ...(result.error ? { error: result.error } : {})
        }
      }

      return {
        success: true,
        data: result.data || [],
        count: result.data?.length || 0
      }

    } catch (error) {
      structuredLogger.error('Repository insertMany error', {
        table,
        error: error instanceof Error ? error.message : String(error),
        count: dataArray.length
      })
      return {
        success: false,
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Update records
   */
  async update<T>(
    table: string, 
    data: Partial<T>, 
    filters: FilterOptions
  ): Promise<RepositoryResult<T>> {
    try {
      const updateColumns = Object.keys(data).filter(key => data[key as keyof T] !== undefined)
      const updateValues = updateColumns.map(key => data[key as keyof T])
      const updatePlaceholders = updateColumns.map((_, index) => `${updateColumns[index]} = $${index + 1}`)

      let query = `UPDATE ${table} SET ${updatePlaceholders.join(', ')} WHERE 1=1`
      const params = [...updateValues]
      let paramCount = updateValues.length

      // Add filters
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          paramCount++
          query += ` AND ${key} = $${paramCount}`
          params.push(value)
        }
      }

      query += ' RETURNING *'

      const result = await databaseService.executeSQL(query, params)

      if (!result.success) {
        structuredLogger.error('Repository update failed', {
          table,
          error: result.error,
          data,
          filters
        })
        return {
          success: false,
          data: [],
          count: 0,
          ...(result.error ? { error: result.error } : {})
        }
      }

      return {
        success: true,
        data: result.data || [],
        count: result.data?.length || 0
      }

    } catch (error) {
      structuredLogger.error('Repository update error', {
        table,
        error: error instanceof Error ? error.message : String(error),
        data,
        filters
      })
      return {
        success: false,
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Upsert (insert or update) records
   */
  async upsert<T>(
    table: string, 
    data: Partial<T>[], 
    conflictColumns: string[]
  ): Promise<RepositoryResult<T>> {
    if (data.length === 0) {
      return { success: true, data: [], count: 0 }
    }

    try {
      const columns = Object.keys(data[0]).filter(key => 
        data[0][key as keyof T] !== undefined
      )

      const values: any[] = []
      const placeholders: string[] = []
      let paramCount = 0

      for (const record of data) {
        const rowPlaceholders: string[] = []
        for (const column of columns) {
          paramCount++
          rowPlaceholders.push(`$${paramCount}`)
          values.push(record[column as keyof T])
        }
        placeholders.push(`(${rowPlaceholders.join(', ')})`)
      }

      const updateColumns = columns.filter(col => !conflictColumns.includes(col))
      const updatePlaceholders = updateColumns.map(col => `${col} = EXCLUDED.${col}`)

      const query = `
        INSERT INTO ${table} (${columns.join(', ')})
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (${conflictColumns.join(', ')})
        DO UPDATE SET ${updatePlaceholders.join(', ')}
        RETURNING *
      `

      const result = await databaseService.executeSQL(query, values)

      if (!result.success) {
        structuredLogger.error('Repository upsert failed', {
          table,
          error: result.error,
          count: data.length,
          conflictColumns
        })
        return {
          success: false,
          data: [],
          count: 0,
          ...(result.error ? { error: result.error } : {})
        }
      }

      return {
        success: true,
        data: result.data || [],
        count: result.data?.length || 0
      }

    } catch (error) {
      structuredLogger.error('Repository upsert error', {
        table,
        error: error instanceof Error ? error.message : String(error),
        count: data.length,
        conflictColumns
      })
      return {
        success: false,
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Delete records
   */
  async delete(table: string, filters: FilterOptions): Promise<RepositoryResult<any>> {
    try {
      let query = `DELETE FROM ${table} WHERE 1=1`
      const params: any[] = []
      let paramCount = 0

      // Add filters
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          paramCount++
          query += ` AND ${key} = $${paramCount}`
          params.push(value)
        }
      }

      query += ' RETURNING *'

      const result = await databaseService.executeSQL(query, params)

      if (!result.success) {
        structuredLogger.error('Repository delete failed', {
          table,
          error: result.error,
          filters
        })
        return {
          success: false,
          data: [],
          count: 0,
          ...(result.error ? { error: result.error } : {})
        }
      }

      return {
        success: true,
        data: result.data || [],
        count: result.data?.length || 0
      }

    } catch (error) {
      structuredLogger.error('Repository delete error', {
        table,
        error: error instanceof Error ? error.message : String(error),
        filters
      })
      return {
        success: false,
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Execute raw SQL query
   */
  async executeQuery<T>(query: string, params: any[] = []): Promise<RepositoryResult<T>> {
    try {
      const result = await databaseService.executeSQL(query, params)

      if (!result.success) {
        structuredLogger.error('Repository executeQuery failed', {
          error: result.error,
          query: query.substring(0, 100)
        })
        return {
          success: false,
          data: [],
          count: 0,
          ...(result.error ? { error: result.error } : {})
        }
      }

      return {
        success: true,
        data: result.data || [],
        count: result.data?.length || 0
      }

    } catch (error) {
      structuredLogger.error('Repository executeQuery error', {
        error: error instanceof Error ? error.message : String(error),
        query: query.substring(0, 100)
      })
      return {
        success: false,
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Sport-specific methods
   */

  /**
   * Get teams by sport
   */
  async getTeamsBySport(sport: string, league?: string): Promise<RepositoryResult<any>> {
    const filters: FilterOptions = { sport }
    if (league) {
      filters.league = league
    }
    return this.find('teams', filters, { orderBy: 'name' })
  }

  /**
   * Get games by sport and date range
   */
  async getGamesBySport(
    sport: string, 
    dateFrom?: string, 
    dateTo?: string, 
    status?: string
  ): Promise<RepositoryResult<any>> {
    const filters: FilterOptions = { sport }
    
    if (dateFrom) {
      filters.game_date = { gte: dateFrom }
    }
    if (dateTo) {
      filters.game_date = { ...filters.game_date, lte: dateTo }
    }
    if (status) {
      filters.status = status
    }

    return this.find('games', filters, { orderBy: 'game_date', orderDirection: 'DESC' })
  }

  /**
   * Get players by sport and team
   */
  async getPlayersBySport(sport: string, teamId?: string): Promise<RepositoryResult<any>> {
    const filters: FilterOptions = { sport }
    if (teamId) {
      filters.team_id = teamId
    }
    return this.find('players', filters, { orderBy: 'name' })
  }

  /**
   * Get odds by game
   */
  async getOddsByGame(gameId: string): Promise<RepositoryResult<any>> {
    return this.find('odds', { game_id: gameId }, { orderBy: 'updated_at', orderDirection: 'DESC' })
  }

  /**
   * Get standings by league
   */
  async getStandingsByLeague(league: string, season?: string): Promise<RepositoryResult<any>> {
    const filters: FilterOptions = { league }
    if (season) {
      filters.season = season
    }
    return this.find('league_standings', filters, { orderBy: 'position' })
  }
}

export const databaseRepository = DatabaseRepository.getInstance()
