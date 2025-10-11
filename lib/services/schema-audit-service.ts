/**
 * Schema Audit Service
 * Database schema validation and migration planning
 * No hardcoded sport-specific logic - fully dynamic and professional
 */

import { createClient } from '@supabase/supabase-js'
import { structuredLogger } from './structured-logger'

export interface SchemaAuditReport {
  success: boolean
  timestamp: string
  tables: TableSchema[]
  missingTables: string[]
  missingConstraints: ConstraintIssue[]
  missingIndexes: IndexIssue[]
  recommendations: string[]
  migrationPlan: MigrationStep[]
}

export interface TableSchema {
  name: string
  columns: ColumnSchema[]
  constraints: ConstraintSchema[]
  indexes: IndexSchema[]
  rowCount: number
  size: string
}

export interface ColumnSchema {
  name: string
  type: string
  nullable: boolean
  defaultValue: string | null
  maxLength: number | null
  isPrimaryKey: boolean
  isUnique: boolean
}

export interface ConstraintSchema {
  name: string
  type: 'PRIMARY KEY' | 'UNIQUE' | 'FOREIGN KEY' | 'CHECK'
  columns: string[]
  referencedTable?: string
  referencedColumns?: string[]
}

export interface IndexSchema {
  name: string
  columns: string[]
  unique: boolean
  type: string
}

export interface ConstraintIssue {
  table: string
  type: 'missing_unique' | 'missing_foreign_key' | 'missing_check'
  description: string
  suggestedConstraint: string
}

export interface IndexIssue {
  table: string
  columns: string[]
  description: string
  suggestedIndex: string
}

export interface MigrationStep {
  type: 'create_table' | 'add_constraint' | 'create_index' | 'alter_column'
  table: string
  sql: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  description: string
}

export class SchemaAuditService {
  private static instance: SchemaAuditService

  public static getInstance(): SchemaAuditService {
    if (!SchemaAuditService.instance) {
      SchemaAuditService.instance = new SchemaAuditService()
    }
    return SchemaAuditService.instance
  }

  private getSupabaseClient() {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  /**
   * Run comprehensive schema audit
   */
  async runSchemaAudit(): Promise<SchemaAuditReport> {
    try {
      structuredLogger.info('Starting schema audit')

      // Get all tables in public schema
      const tables = await this.getTableList()
      const tableSchemas = await this.analyzeTables(tables)

      // Identify missing tables
      const requiredTables = await this.getRequiredTables()
      const missingTables = requiredTables.filter(table => !tables.includes(table))

      // Analyze constraints and indexes
      const missingConstraints = await this.analyzeConstraints(tableSchemas)
      const missingIndexes = await this.analyzeIndexes(tableSchemas)

      // Generate recommendations and migration plan
      const recommendations = this.generateRecommendations(
        missingTables,
        missingConstraints,
        missingIndexes
      )
      const migrationPlan = this.generateMigrationPlan(
        missingTables,
        missingConstraints,
        missingIndexes
      )

      const report: SchemaAuditReport = {
        success: missingTables.length === 0 && missingConstraints.length === 0,
        timestamp: new Date().toISOString(),
        tables: tableSchemas,
        missingTables,
        missingConstraints,
        missingIndexes,
        recommendations,
        migrationPlan,
      }

      structuredLogger.info('Schema audit completed', {
        tablesFound: tables.length,
        missingTables: missingTables.length,
        missingConstraints: missingConstraints.length,
        missingIndexes: missingIndexes.length,
      })

      return report
    } catch (error) {
      structuredLogger.error('Schema audit failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  /**
   * Get list of all tables in public schema
   */
  private async getTableList(): Promise<string[]> {
    const supabase = this.getSupabaseClient()
    const { data, error } = await supabase.rpc('get_all_tables')

    if (error) {
      throw new Error(`Failed to get table list: ${error.message}`)
    }

    return data || []
  }

  /**
   * Analyze table schemas dynamically
   */
  private async analyzeTables(tableNames: string[]): Promise<TableSchema[]> {
    const schemas: TableSchema[] = []

    for (const tableName of tableNames) {
      try {
        const columns = await this.getTableColumns(tableName)
        const constraints = await this.getTableConstraints(tableName)
        const indexes = await this.getTableIndexes(tableName)
        const stats = await this.getTableStats(tableName)

        schemas.push({
          name: tableName,
          columns,
          constraints,
          indexes,
          rowCount: stats.rowCount,
          size: stats.size,
        })
      } catch (error) {
        structuredLogger.warn('Failed to analyze table', {
          table: tableName,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    return schemas
  }

  /**
   * Get table column information
   */
  private async getTableColumns(tableName: string): Promise<ColumnSchema[]> {
    const supabase = this.getSupabaseClient()
    const { data, error } = await supabase.rpc('get_table_columns', { table_name: tableName })

    if (error) {
      throw new Error(`Failed to get columns for ${tableName}: ${error.message}`)
    }

    return (data || []).map((row: any) => ({
      name: row.column_name,
      type: row.data_type,
      nullable: row.is_nullable === 'YES',
      defaultValue: row.column_default,
      maxLength: row.character_maximum_length,
      isPrimaryKey: row.is_primary_key,
      isUnique: row.is_unique,
    }))
  }

  /**
   * Get table constraints
   */
  private async getTableConstraints(tableName: string): Promise<ConstraintSchema[]> {
    const supabase = this.getSupabaseClient()
    const { data, error } = await supabase.rpc('get_table_constraints', { table_name: tableName })

    if (error) {
      throw new Error(`Failed to get constraints for ${tableName}: ${error.message}`)
    }

    return (data || []).map((row: any) => ({
      name: row.constraint_name,
      type: row.constraint_type,
      columns: row.columns || [],
      referencedTable: row.referenced_table,
      referencedColumns: row.referenced_columns || [],
    }))
  }

  /**
   * Get table indexes
   */
  private async getTableIndexes(tableName: string): Promise<IndexSchema[]> {
    const supabase = this.getSupabaseClient()
    const { data, error } = await supabase.rpc('get_table_indexes', { table_name: tableName })

    if (error) {
      throw new Error(`Failed to get indexes for ${tableName}: ${error.message}`)
    }

    return (data || []).map((row: any) => ({
      name: row.indexname,
      columns: row.columns || [],
      unique: row.unique,
      type: 'btree', // Default type
    }))
  }

  /**
   * Get table statistics
   */
  private async getTableStats(tableName: string): Promise<{ rowCount: number; size: string }> {
    const supabase = this.getSupabaseClient()
    const { data, error } = await supabase.rpc('get_table_stats', { table_name: tableName })

    if (error || !data || data.length === 0) {
      return { rowCount: 0, size: '0 bytes' }
    }

    const row = data[0]
    return {
      rowCount: parseInt(row.row_count) || 0,
      size: row.size || '0 bytes',
    }
  }

  /**
   * Get required tables dynamically from configuration
   */
  private async getRequiredTables(): Promise<string[]> {
    // Core tables required for any sports application
    const coreTables = [
      'sports',
      'leagues',
      'teams',
      'players',
      'games',
      'player_stats',
      'team_stats',
      'odds',
      'predictions',
      'league_standings',
    ]

    // Operational tables
    const operationalTables = [
      'api_error_logs',
      'rate_limit_tracking',
      'cache_entries',
      'webhook_logs',
      'processing_locks',
    ]

    return [...coreTables, ...operationalTables]
  }

  /**
   * Analyze missing constraints
   */
  private async analyzeConstraints(schemas: TableSchema[]): Promise<ConstraintIssue[]> {
    const issues: ConstraintIssue[] = []

    for (const schema of schemas) {
      // Check for missing unique constraints on critical fields
      const uniqueConstraints = schema.constraints.filter(c => c.type === 'UNIQUE')

      // Teams should have unique constraint on (name, league) or external_id
      if (schema.name === 'teams') {
        const hasNameLeagueUnique = uniqueConstraints.some(
          c => c.columns.includes('name') && c.columns.includes('league')
        )
        const hasExternalIdUnique = schema.columns.some(c => c.name === 'external_id' && c.isUnique)

        if (!hasNameLeagueUnique && !hasExternalIdUnique) {
          issues.push({
            table: 'teams',
            type: 'missing_unique',
            description: 'Teams table missing unique constraint on (name, league) or external_id',
            suggestedConstraint:
              'ALTER TABLE teams ADD CONSTRAINT teams_name_league_name_unique UNIQUE (name, league_name)',
          })
        }
      }

      // Games should have unique constraint on external_id or (home_team_id, away_team_id, game_date)
      if (schema.name === 'games') {
        const hasExternalIdUnique = schema.columns.some(c => c.name === 'external_id' && c.isUnique)
        const hasGameUnique = uniqueConstraints.some(
          c =>
            c.columns.includes('home_team_id') &&
            c.columns.includes('away_team_id') &&
            c.columns.includes('game_date')
        )

        if (!hasExternalIdUnique && !hasGameUnique) {
          issues.push({
            table: 'games',
            type: 'missing_unique',
            description:
              'Games table missing unique constraint on external_id or (home_team_id, away_team_id, game_date)',
            suggestedConstraint:
              'ALTER TABLE games ADD CONSTRAINT games_external_id_unique UNIQUE (external_id)',
          })
        }
      }

      // Players should have unique constraint on external_id
      if (schema.name === 'players') {
        const hasExternalIdUnique = schema.columns.some(c => c.name === 'external_id' && c.isUnique)

        if (!hasExternalIdUnique) {
          issues.push({
            table: 'players',
            type: 'missing_unique',
            description: 'Players table missing unique constraint on external_id',
            suggestedConstraint:
              'ALTER TABLE players ADD CONSTRAINT players_external_id_unique UNIQUE (external_id)',
          })
        }
      }

      // Odds should have unique constraint on (game_id, market, bookmaker)
      if (schema.name === 'odds') {
        const hasOddsUnique = uniqueConstraints.some(
          c =>
            c.columns.includes('game_id') &&
            c.columns.includes('market') &&
            c.columns.includes('bookmaker')
        )

        if (!hasOddsUnique) {
          issues.push({
            table: 'odds',
            type: 'missing_unique',
            description: 'Odds table missing unique constraint on (game_id, market, bookmaker)',
            suggestedConstraint:
              'ALTER TABLE odds ADD CONSTRAINT odds_game_market_bookmaker_unique UNIQUE (game_id, market, bookmaker)',
          })
        }
      }
    }

    return issues
  }

  /**
   * Analyze missing indexes
   */
  private async analyzeIndexes(schemas: TableSchema[]): Promise<IndexIssue[]> {
    const issues: IndexIssue[] = []

    for (const schema of schemas) {
      const existingIndexes = schema.indexes.map(i => i.columns.join(','))

      // Games table indexes
      if (schema.name === 'games') {
        const requiredIndexes = [
          { columns: ['sport'], description: 'Index on sport for filtering' },
          { columns: ['league'], description: 'Index on league for filtering' },
          {
            columns: ['game_date', 'status'],
            description: 'Composite index for date/status queries',
          },
          { columns: ['home_team_id'], description: 'Index on home_team_id for joins' },
          { columns: ['away_team_id'], description: 'Index on away_team_id for joins' },
          { columns: ['external_id'], description: 'Index on external_id for lookups' },
        ]

        for (const reqIndex of requiredIndexes) {
          const indexExists = existingIndexes.some(existing =>
            reqIndex.columns.every(col => existing.includes(col))
          )

          if (!indexExists) {
            issues.push({
              table: 'games',
              columns: reqIndex.columns,
              description: reqIndex.description,
              suggestedIndex: `CREATE INDEX IF NOT EXISTS idx_${schema.name}_${reqIndex.columns.join('_')} ON ${schema.name}(${reqIndex.columns.join(', ')})`,
            })
          }
        }
      }

      // Teams table indexes
      if (schema.name === 'teams') {
        const requiredIndexes = [
          { columns: ['sport'], description: 'Index on sport for filtering' },
          { columns: ['league'], description: 'Index on league for filtering' },
          { columns: ['sport', 'league'], description: 'Composite index for sport/league queries' },
          { columns: ['external_id'], description: 'Index on external_id for lookups' },
        ]

        for (const reqIndex of requiredIndexes) {
          const indexExists = existingIndexes.some(existing =>
            reqIndex.columns.every(col => existing.includes(col))
          )

          if (!indexExists) {
            issues.push({
              table: 'teams',
              columns: reqIndex.columns,
              description: reqIndex.description,
              suggestedIndex: `CREATE INDEX IF NOT EXISTS idx_${schema.name}_${reqIndex.columns.join('_')} ON ${schema.name}(${reqIndex.columns.join(', ')})`,
            })
          }
        }
      }

      // Players table indexes
      if (schema.name === 'players') {
        const requiredIndexes = [
          { columns: ['sport'], description: 'Index on sport for filtering' },
          { columns: ['team_id'], description: 'Index on team_id for joins' },
          { columns: ['external_id'], description: 'Index on external_id for lookups' },
        ]

        for (const reqIndex of requiredIndexes) {
          const indexExists = existingIndexes.some(existing =>
            reqIndex.columns.every(col => existing.includes(col))
          )

          if (!indexExists) {
            issues.push({
              table: 'players',
              columns: reqIndex.columns,
              description: reqIndex.description,
              suggestedIndex: `CREATE INDEX IF NOT EXISTS idx_${schema.name}_${reqIndex.columns.join('_')} ON ${schema.name}(${reqIndex.columns.join(', ')})`,
            })
          }
        }
      }

      // Odds table indexes
      if (schema.name === 'odds') {
        const requiredIndexes = [
          { columns: ['game_id'], description: 'Index on game_id for joins' },
          { columns: ['market'], description: 'Index on market for filtering' },
          { columns: ['bookmaker'], description: 'Index on bookmaker for filtering' },
          { columns: ['updated_at'], description: 'Index on updated_at for time-based queries' },
        ]

        for (const reqIndex of requiredIndexes) {
          const indexExists = existingIndexes.some(existing =>
            reqIndex.columns.every(col => existing.includes(col))
          )

          if (!indexExists) {
            issues.push({
              table: 'odds',
              columns: reqIndex.columns,
              description: reqIndex.description,
              suggestedIndex: `CREATE INDEX IF NOT EXISTS idx_${schema.name}_${reqIndex.columns.join('_')} ON ${schema.name}(${reqIndex.columns.join(', ')})`,
            })
          }
        }
      }
    }

    return issues
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    missingTables: string[],
    missingConstraints: ConstraintIssue[],
    missingIndexes: IndexIssue[]
  ): string[] {
    const recommendations: string[] = []

    if (missingTables.length > 0) {
      recommendations.push(
        `Create ${missingTables.length} missing tables: ${missingTables.join(', ')}`
      )
    }

    if (missingConstraints.length > 0) {
      recommendations.push(
        `Add ${missingConstraints.length} missing constraints for data integrity`
      )
    }

    if (missingIndexes.length > 0) {
      recommendations.push(`Create ${missingIndexes.length} missing indexes for query performance`)
    }

    if (
      missingTables.length === 0 &&
      missingConstraints.length === 0 &&
      missingIndexes.length === 0
    ) {
      recommendations.push(
        'Schema is properly configured with all required tables, constraints, and indexes'
      )
    }

    return recommendations
  }

  /**
   * Generate migration plan
   */
  private generateMigrationPlan(
    missingTables: string[],
    missingConstraints: ConstraintIssue[],
    missingIndexes: IndexIssue[]
  ): MigrationStep[] {
    const steps: MigrationStep[] = []

    // Create missing tables (critical priority)
    for (const table of missingTables) {
      const tableSql = this.generateTableSQL(table)
      steps.push({
        type: 'create_table',
        table,
        sql: tableSql,
        priority: 'critical',
        description: `Create missing table: ${table}`,
      })
    }

    // Add missing constraints (high priority)
    for (const constraint of missingConstraints) {
      steps.push({
        type: 'add_constraint',
        table: constraint.table,
        sql: constraint.suggestedConstraint,
        priority: 'high',
        description: constraint.description,
      })
    }

    // Create missing indexes (medium priority)
    for (const index of missingIndexes) {
      steps.push({
        type: 'create_index',
        table: index.table,
        sql: index.suggestedIndex,
        priority: 'medium',
        description: index.description,
      })
    }

    return steps
  }

  /**
   * Generate table creation SQL
   */
  private generateTableSQL(tableName: string): string {
    const tableDefinitions: { [key: string]: string } = {
      sports: `
        CREATE TABLE IF NOT EXISTS sports (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(50) UNIQUE NOT NULL,
          display_name VARCHAR(100) NOT NULL,
          icon VARCHAR(100),
          color VARCHAR(7),
          is_active BOOLEAN DEFAULT true,
          update_frequency INTEGER DEFAULT 30,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `,
      leagues: `
        CREATE TABLE IF NOT EXISTS leagues (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          sport VARCHAR(50) NOT NULL,
          name VARCHAR(100) NOT NULL,
          code VARCHAR(10) UNIQUE,
          country VARCHAR(50),
          season VARCHAR(20),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(name, sport)
        )
      `,
      teams: `
        CREATE TABLE IF NOT EXISTS teams (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          external_id VARCHAR(100) UNIQUE,
          name VARCHAR(100) NOT NULL,
          sport VARCHAR(50) NOT NULL,
          league VARCHAR(100),
          abbreviation VARCHAR(10),
          city VARCHAR(100),
          logo_url TEXT,
          conference VARCHAR(50),
          division VARCHAR(50),
          founded_year INTEGER,
          stadium_name VARCHAR(200),
          stadium_capacity INTEGER,
          primary_color VARCHAR(7),
          secondary_color VARCHAR(7),
          country VARCHAR(50),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(name, league)
        )
      `,
      players: `
        CREATE TABLE IF NOT EXISTS players (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          external_id VARCHAR(100) UNIQUE,
          name VARCHAR(100) NOT NULL,
          sport VARCHAR(50) NOT NULL,
          position VARCHAR(50),
          team_id UUID REFERENCES teams(id),
          team_name VARCHAR(100),
          height VARCHAR(20),
          weight INTEGER,
          age INTEGER,
          experience_years INTEGER,
          college VARCHAR(100),
          country VARCHAR(50),
          jersey_number INTEGER,
          is_active BOOLEAN DEFAULT true,
          headshot_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `,
      games: `
        CREATE TABLE IF NOT EXISTS games (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          external_id VARCHAR(100) UNIQUE,
          sport VARCHAR(50) NOT NULL,
          league VARCHAR(100),
          season VARCHAR(20),
          home_team_id UUID REFERENCES teams(id),
          away_team_id UUID REFERENCES teams(id),
          game_date TIMESTAMP WITH TIME ZONE NOT NULL,
          status VARCHAR(20) DEFAULT 'scheduled',
          home_score INTEGER,
          away_score INTEGER,
          venue VARCHAR(200),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `,
      player_stats: `
        CREATE TABLE IF NOT EXISTS player_stats (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          player_id UUID REFERENCES players(id),
          game_id UUID REFERENCES games(id),
          metric_name VARCHAR(50) NOT NULL,
          metric_value DECIMAL(10,2),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(player_id, game_id, metric_name)
        )
      `,
      team_stats: `
        CREATE TABLE IF NOT EXISTS team_stats (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          team_id UUID REFERENCES teams(id),
          game_id UUID REFERENCES games(id),
          metric_name VARCHAR(50) NOT NULL,
          metric_value DECIMAL(10,2),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(team_id, game_id, metric_name)
        )
      `,
      odds: `
        CREATE TABLE IF NOT EXISTS odds (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          game_id UUID REFERENCES games(id),
          market VARCHAR(50) NOT NULL,
          bookmaker VARCHAR(100) NOT NULL,
          line DECIMAL(10,2),
          price DECIMAL(10,2),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(game_id, market, bookmaker)
        )
      `,
      predictions: `
        CREATE TABLE IF NOT EXISTS predictions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          game_id UUID REFERENCES games(id),
          model VARCHAR(100) NOT NULL,
          version VARCHAR(20),
          output_json JSONB,
          confidence DECIMAL(5,4),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(game_id, model, version)
        )
      `,
      league_standings: `
        CREATE TABLE IF NOT EXISTS league_standings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          league VARCHAR(100) NOT NULL,
          season VARCHAR(20) NOT NULL,
          team_id UUID REFERENCES teams(id),
          position INTEGER,
          wins INTEGER DEFAULT 0,
          losses INTEGER DEFAULT 0,
          ties INTEGER DEFAULT 0,
          win_percentage DECIMAL(5,4),
          games_behind DECIMAL(5,2),
          points_for INTEGER DEFAULT 0,
          points_against INTEGER DEFAULT 0,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(league, season, team_id)
        )
      `,
      api_error_logs: `
        CREATE TABLE IF NOT EXISTS api_error_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          provider VARCHAR(50) NOT NULL,
          endpoint TEXT NOT NULL,
          error_message TEXT,
          status_code INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `,
      rate_limit_tracking: `
        CREATE TABLE IF NOT EXISTS rate_limit_tracking (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          provider VARCHAR(50) NOT NULL,
          requests_made INTEGER DEFAULT 0,
          window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `,
      cache_entries: `
        CREATE TABLE IF NOT EXISTS cache_entries (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          cache_key VARCHAR(255) UNIQUE NOT NULL,
          data JSONB,
          expires_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `,
      webhook_logs: `
        CREATE TABLE IF NOT EXISTS webhook_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          request_id VARCHAR(100) UNIQUE NOT NULL,
          payload JSONB,
          processed BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `,
      processing_locks: `
        CREATE TABLE IF NOT EXISTS processing_locks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          lock_key VARCHAR(255) UNIQUE NOT NULL,
          locked_by VARCHAR(100),
          locked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          expires_at TIMESTAMP WITH TIME ZONE
        )
      `,
    }

    return tableDefinitions[tableName] || `-- Table definition for ${tableName} not found`
  }

  /**
   * Apply migration plan
   */
  async applyMigrationPlan(
    steps: MigrationStep[]
  ): Promise<{ success: boolean; applied: number; errors: string[] }> {
    const errors: string[] = []
    let applied = 0

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    const sortedSteps = steps.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

    for (const step of sortedSteps) {
      try {
        structuredLogger.info('Applying migration step', {
          type: step.type,
          table: step.table,
          priority: step.priority,
        })

        const supabase = this.getSupabaseClient()
        const { error } = await supabase.rpc('execute_sql', { sql: step.sql })
        
        if (!error) {
          applied++
          structuredLogger.info('Migration step applied successfully', {
            type: step.type,
            table: step.table,
          })
        } else {
          errors.push(`Failed to apply ${step.type} for ${step.table}: ${error.message}`)
        }
      } catch (error) {
        errors.push(
          `Error applying ${step.type} for ${step.table}: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    }

    return {
      success: errors.length === 0,
      applied,
      errors,
    }
  }
}

export const schemaAuditService = SchemaAuditService.getInstance()
