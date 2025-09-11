/**
 * DATABASE SCHEMA VALIDATOR
 * Comprehensive database schema validation and data integrity checks
 */

import { createClient } from '@/lib/supabase/server'

export interface SchemaValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  tables: TableValidationResult[]
  lastChecked: string
}

export interface TableValidationResult {
  tableName: string
  exists: boolean
  hasRequiredColumns: boolean
  hasIndexes: boolean
  rowCount: number
  dataIntegrity: boolean
  errors: string[]
  warnings: string[]
}

export interface DataIntegrityCheck {
  checkName: string
  passed: boolean
  message: string
  affectedRows?: number
}

export class DatabaseSchemaValidator {
  private supabase: any = null

  constructor() {
    // Don't initialize Supabase at construction time
  }

  private async initializeSupabase() {
    if (this.supabase) {
      return this.supabase
    }
    
    try {
      this.supabase = await createClient()
      return this.supabase
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error)
      return null
    }
  }

  /**
   * Validate entire database schema
   */
  async validateSchema(): Promise<SchemaValidationResult> {
    const result: SchemaValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      tables: [],
      lastChecked: new Date().toISOString()
    }

    const supabase = await this.initializeSupabase()
    if (!supabase) {
      result.isValid = false
      result.errors.push('Database connection failed')
      return result
    }

    try {
      // Define required tables and their schemas
      const requiredTables = this.getRequiredTables()
      
      for (const table of requiredTables) {
        const tableResult = await this.validateTable(table)
        result.tables.push(tableResult)
        
        if (!tableResult.exists) {
          result.isValid = false
          result.errors.push(`Required table '${table.name}' does not exist`)
        }
        
        if (!tableResult.hasRequiredColumns) {
          result.isValid = false
          result.errors.push(`Table '${table.name}' is missing required columns`)
        }
        
        if (!tableResult.dataIntegrity) {
          result.warnings.push(`Table '${table.name}' has data integrity issues`)
        }
      }

      // Run data integrity checks
      const integrityChecks = await this.runDataIntegrityChecks()
      for (const check of integrityChecks) {
        if (!check.passed) {
          result.warnings.push(check.message)
        }
      }

    } catch (error) {
      result.isValid = false
      result.errors.push(`Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return result
  }

  /**
   * Validate a specific table
   */
  async validateTable(tableConfig: TableConfig): Promise<TableValidationResult> {
    const result: TableValidationResult = {
      tableName: tableConfig.name,
      exists: false,
      hasRequiredColumns: false,
      hasIndexes: false,
      rowCount: 0,
      dataIntegrity: true,
      errors: [],
      warnings: []
    }

    const supabase = await this.initializeSupabase()
    if (!supabase) {
      result.errors.push('Database connection failed')
      return result
    }

    try {
      // Check if table exists
      const { data: tableData, error: tableError } = await supabase
        .from(tableConfig.name)
        .select('*')
        .limit(1)

      if (tableError) {
        result.errors.push(`Table access error: ${tableError.message}`)
        return result
      }

      result.exists = true
      result.rowCount = tableData?.length || 0

      // Check required columns
      if (tableData && tableData.length > 0) {
        const sampleRow = tableData[0]
        const hasAllColumns = tableConfig.requiredColumns.every(col => 
          sampleRow.hasOwnProperty(col.name)
        )
        result.hasRequiredColumns = hasAllColumns

        if (!hasAllColumns) {
          const missingColumns = tableConfig.requiredColumns.filter(col => 
            !sampleRow.hasOwnProperty(col.name)
          )
          result.errors.push(`Missing columns: ${missingColumns.map(col => col.name).join(', ')}`)
        }
      }

      // Check data integrity
      const integrityResult = await this.checkTableDataIntegrity(tableConfig)
      result.dataIntegrity = integrityResult.passed
      if (!integrityResult.passed) {
        result.errors.push(integrityResult.message)
      }

    } catch (error) {
      result.errors.push(`Table validation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return result
  }

  /**
   * Run comprehensive data integrity checks
   */
  async runDataIntegrityChecks(): Promise<DataIntegrityCheck[]> {
    const checks: DataIntegrityCheck[] = []

    try {
      // Check for orphaned records
      const orphanedGames = await this.checkOrphanedGames()
      checks.push(orphanedGames)

      const orphanedPlayers = await this.checkOrphanedPlayers()
      checks.push(orphanedPlayers)

      // Check for duplicate records
      const duplicateGames = await this.checkDuplicateGames()
      checks.push(duplicateGames)

      // Check for invalid data
      const invalidScores = await this.checkInvalidScores()
      checks.push(invalidScores)

      const invalidDates = await this.checkInvalidDates()
      checks.push(invalidDates)

    } catch (error) {
      checks.push({
        checkName: 'Data Integrity Check',
        passed: false,
        message: `Data integrity check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    }

    return checks
  }

  /**
   * Check for orphaned games (games without valid team references)
   */
  private async checkOrphanedGames(): Promise<DataIntegrityCheck> {
    const supabase = await this.initializeSupabase()
    if (!supabase) {
      return {
        checkName: 'Orphaned Games Check',
        passed: false,
        message: 'Database connection failed'
      }
    }

    try {
      const { data, error } = await supabase
        .from('games')
        .select(`
          id,
          home_team_id,
          away_team_id,
          teams!games_home_team_id_fkey(id),
          teams!games_away_team_id_fkey(id)
        `)
        .is('home_team_id', null)
        .or('away_team_id.is.null')

      if (error) {
        return {
          checkName: 'Orphaned Games Check',
          passed: false,
          message: `Error checking orphaned games: ${error.message}`
        }
      }

      const orphanedCount = data?.length || 0
      return {
        checkName: 'Orphaned Games Check',
        passed: orphanedCount === 0,
        message: orphanedCount === 0 ? 'No orphaned games found' : `Found ${orphanedCount} orphaned games`,
        affectedRows: orphanedCount
      }
    } catch (error) {
      return {
        checkName: 'Orphaned Games Check',
        passed: false,
        message: `Orphaned games check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Check for orphaned players (players without valid team references)
   */
  private async checkOrphanedPlayers(): Promise<DataIntegrityCheck> {
    const supabase = await this.initializeSupabase()
    if (!supabase) {
      return {
        checkName: 'Orphaned Players Check',
        passed: false,
        message: 'Database connection failed'
      }
    }

    try {
      const { data, error } = await supabase
        .from('players')
        .select(`
          id,
          team_id,
          teams!players_team_id_fkey(id)
        `)
        .is('team_id', null)

      if (error) {
        return {
          checkName: 'Orphaned Players Check',
          passed: false,
          message: `Error checking orphaned players: ${error.message}`
        }
      }

      const orphanedCount = data?.length || 0
      return {
        checkName: 'Orphaned Players Check',
        passed: orphanedCount === 0,
        message: orphanedCount === 0 ? 'No orphaned players found' : `Found ${orphanedCount} orphaned players`,
        affectedRows: orphanedCount
      }
    } catch (error) {
      return {
        checkName: 'Orphaned Players Check',
        passed: false,
        message: `Orphaned players check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Check for duplicate games
   */
  private async checkDuplicateGames(): Promise<DataIntegrityCheck> {
    const supabase = await this.initializeSupabase()
    if (!supabase) {
      return {
        checkName: 'Duplicate Games Check',
        passed: false,
        message: 'Database connection failed'
      }
    }

    try {
      const { data, error } = await supabase
        .from('games')
        .select('home_team, away_team, date, sport')
        .not('date', 'is', null)

      if (error) {
        return {
          checkName: 'Duplicate Games Check',
          passed: false,
          message: `Error checking duplicate games: ${error.message}`
        }
      }

      // Group by potential duplicate keys
      const gameGroups = new Map<string, any[]>()
      data?.forEach((game: any) => {
        const key = `${game.home_team}-${game.away_team}-${game.date}-${game.sport}`
        if (!gameGroups.has(key)) {
          gameGroups.set(key, [])
        }
        gameGroups.get(key)!.push(game)
      })

      const duplicates = Array.from(gameGroups.values()).filter(group => group.length > 1)
      const duplicateCount = duplicates.reduce((sum, group) => sum + group.length - 1, 0)

      return {
        checkName: 'Duplicate Games Check',
        passed: duplicateCount === 0,
        message: duplicateCount === 0 ? 'No duplicate games found' : `Found ${duplicateCount} duplicate games`,
        affectedRows: duplicateCount
      }
    } catch (error) {
      return {
        checkName: 'Duplicate Games Check',
        passed: false,
        message: `Duplicate games check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Check for invalid scores (negative scores, etc.)
   */
  private async checkInvalidScores(): Promise<DataIntegrityCheck> {
    const supabase = await this.initializeSupabase()
    if (!supabase) {
      return {
        checkName: 'Invalid Scores Check',
        passed: false,
        message: 'Database connection failed'
      }
    }

    try {
      const { data, error } = await supabase
        .from('games')
        .select('id, home_score, away_score')
        .or('home_score.lt.0,away_score.lt.0')

      if (error) {
        return {
          checkName: 'Invalid Scores Check',
          passed: false,
          message: `Error checking invalid scores: ${error.message}`
        }
      }

      const invalidCount = data?.length || 0
      return {
        checkName: 'Invalid Scores Check',
        passed: invalidCount === 0,
        message: invalidCount === 0 ? 'No invalid scores found' : `Found ${invalidCount} games with invalid scores`,
        affectedRows: invalidCount
      }
    } catch (error) {
      return {
        checkName: 'Invalid Scores Check',
        passed: false,
        message: `Invalid scores check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Check for invalid dates (future dates for finished games, etc.)
   */
  private async checkInvalidDates(): Promise<DataIntegrityCheck> {
    const supabase = await this.initializeSupabase()
    if (!supabase) {
      return {
        checkName: 'Invalid Dates Check',
        passed: false,
        message: 'Database connection failed'
      }
    }

    try {
      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from('games')
        .select('id, date, status')
        .eq('status', 'finished')
        .gt('date', now)

      if (error) {
        return {
          checkName: 'Invalid Dates Check',
          passed: false,
          message: `Error checking invalid dates: ${error.message}`
        }
      }

      const invalidCount = data?.length || 0
      return {
        checkName: 'Invalid Dates Check',
        passed: invalidCount === 0,
        message: invalidCount === 0 ? 'No invalid dates found' : `Found ${invalidCount} finished games with future dates`,
        affectedRows: invalidCount
      }
    } catch (error) {
      return {
        checkName: 'Invalid Dates Check',
        passed: false,
        message: `Invalid dates check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Check table data integrity
   */
  private async checkTableDataIntegrity(tableConfig: TableConfig): Promise<{ passed: boolean; message: string }> {
    const supabase = await this.initializeSupabase()
    if (!supabase) {
      return {
        passed: false,
        message: 'Database connection failed'
      }
    }

    try {
      // Check for null values in required fields
      for (const column of tableConfig.requiredColumns) {
        if (column.nullable === false) {
          const { data, error } = await supabase
            .from(tableConfig.name)
            .select('id')
            .is(column.name, null)
            .limit(1)

          if (error) {
            return {
              passed: false,
              message: `Error checking null values in ${column.name}: ${error.message}`
            }
          }

          if (data && data.length > 0) {
            return {
              passed: false,
              message: `Found null values in required column ${column.name}`
            }
          }
        }
      }

      return {
        passed: true,
        message: 'Data integrity check passed'
      }
    } catch (error) {
      return {
        passed: false,
        message: `Data integrity check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Get required tables configuration
   */
  private getRequiredTables(): TableConfig[] {
    return [
      {
        name: 'games',
        requiredColumns: [
          { name: 'id', type: 'uuid', nullable: false },
          { name: 'sport', type: 'text', nullable: false },
          { name: 'home_team', type: 'text', nullable: false },
          { name: 'away_team', type: 'text', nullable: false },
          { name: 'date', type: 'timestamp', nullable: false },
          { name: 'status', type: 'text', nullable: false }
        ]
      },
      {
        name: 'teams',
        requiredColumns: [
          { name: 'id', type: 'uuid', nullable: false },
          { name: 'name', type: 'text', nullable: false },
          { name: 'sport', type: 'text', nullable: false },
          { name: 'league', type: 'text', nullable: false }
        ]
      },
      {
        name: 'players',
        requiredColumns: [
          { name: 'id', type: 'uuid', nullable: false },
          { name: 'name', type: 'text', nullable: false },
          { name: 'sport', type: 'text', nullable: false },
          { name: 'team_id', type: 'uuid', nullable: true }
        ]
      },
      {
        name: 'odds',
        requiredColumns: [
          { name: 'id', type: 'uuid', nullable: false },
          { name: 'game_id', type: 'uuid', nullable: false },
          { name: 'sport', type: 'text', nullable: false },
          { name: 'bet_type', type: 'text', nullable: false }
        ]
      }
    ]
  }
}

interface TableConfig {
  name: string
  requiredColumns: ColumnConfig[]
}

interface ColumnConfig {
  name: string
  type: string
  nullable: boolean
}

export const databaseSchemaValidator = new DatabaseSchemaValidator()
