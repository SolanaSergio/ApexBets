/**
 * Comprehensive Data Population Service
 * Handles comprehensive data population for all sports
 */

import { structuredLogger } from './structured-logger'
// Removed data-sync-service import - service was deleted as unnecessary
import { SupportedSport } from './core/sport-config'

export interface PopulationResult {
  success: boolean
  message: string
  sportsProcessed: number
  totalRecords: number
  errors: string[]
  executionTime: number
}

export class ComprehensiveDataPopulationService {
  private static instance: ComprehensiveDataPopulationService

  public static getInstance(): ComprehensiveDataPopulationService {
    if (!ComprehensiveDataPopulationService.instance) {
      ComprehensiveDataPopulationService.instance = new ComprehensiveDataPopulationService()
    }
    return ComprehensiveDataPopulationService.instance
  }

  async populateAllData(sports?: SupportedSport[]): Promise<PopulationResult> {
    const startTime = Date.now()
    const errors: string[] = []
    let sportsProcessed = 0
    let totalRecords = 0

    try {
      structuredLogger.info('Starting comprehensive data population', { sports })

      const sportsToProcess = sports && sports.length > 0
        ? sports
        : await this.getSupportedSportsFromDb()

      for (const sport of sportsToProcess) {
        try {
          structuredLogger.info(`Populating data for ${sport}`)

          // Invoke Supabase Edge Function for data sync (authoritative source)
          const syncResult = await this.invokeEdgeFunction(sport)
          
          if (syncResult.success) {
            sportsProcessed++
            totalRecords += await this.getRecordCount(sport)
            structuredLogger.info(`Successfully populated data for ${sport}`)
          } else {
            errors.push(`Failed to populate data for ${sport}: ${syncResult.message}`)
          }

        } catch (error) {
          const errorMessage = `Error populating data for ${sport}: ${error instanceof Error ? error.message : String(error)}`
          errors.push(errorMessage)
          structuredLogger.error(errorMessage)
        }
      }

      const executionTime = Date.now() - startTime

      const result: PopulationResult = {
        success: errors.length === 0,
        message: errors.length === 0 
          ? `Successfully populated data for ${sportsProcessed} sports` 
          : `Completed with ${errors.length} errors`,
        sportsProcessed,
        totalRecords,
        errors,
        executionTime
      }

      structuredLogger.info('Comprehensive data population completed', result)

      return result

    } catch (error) {
      const executionTime = Date.now() - startTime
      const errorMessage = `Comprehensive data population failed: ${error instanceof Error ? error.message : String(error)}`
      
      structuredLogger.error(errorMessage)

      return {
        success: false,
        message: errorMessage,
        sportsProcessed,
        totalRecords,
        errors: [errorMessage, ...errors],
        executionTime
      }
    }
  }

  private getEdgeFunctionConfig(): { url: string; key: string } {
    const supabaseUrl = process.env.SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
      throw new Error('Missing SUPABASE_URL environment variable')
    }
    if (!serviceRoleKey) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
    }

    return { url: `${supabaseUrl}/functions/v1/sync-sports-data`, key: serviceRoleKey }
  }

  private async invokeEdgeFunction(sport: SupportedSport): Promise<{ success: boolean; message?: string }> {
    const { url, key } = this.getEdgeFunctionConfig()

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sport, dataTypes: ['games', 'teams', 'players', 'standings'] })
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      return { success: false, message: `Edge function failed (${response.status}): ${text}` }
    }

    const result = await response.json().catch(() => ({}))
    const success = !!result?.success
    return { success, message: result?.message }
  }

  private async getRecordCount(sport: SupportedSport): Promise<number> {
    try {
      // Optionally aggregate counts by sport from key tables (kept lightweight)
      return 0
    } catch (error) {
      structuredLogger.error('Failed to get record count', {
        sport,
        error: error instanceof Error ? error.message : String(error)
      })
      return 0
    }
  }

  private async getSupportedSportsFromDb(): Promise<SupportedSport[]> {
    try {
      // Prefer explicit environment configuration to remain sport-agnostic
      const configured = process.env.SUPPORTED_SPORTS
      if (configured && configured.trim().length > 0) {
        return configured.split(',').map(s => s.trim()).filter(Boolean) as SupportedSport[]
      }
      // If not configured, return empty to let caller decide per-request
      return []
    } catch (error) {
      structuredLogger.error('Failed to load supported sports', { error: error instanceof Error ? error.message : String(error) })
      return []
    }
  }

  async populateSportData(sport: SupportedSport): Promise<PopulationResult> {
    const startTime = Date.now()

    try {
      structuredLogger.info(`Populating data for ${sport}`)

      const syncResult = await this.invokeEdgeFunction(sport)
      const executionTime = Date.now() - startTime

      if (syncResult.success) {
        return {
          success: true,
          message: `Successfully populated data for ${sport}`,
          sportsProcessed: 1,
          totalRecords: await this.getRecordCount(sport),
          errors: [],
          executionTime
        }
      } else {
        return {
          success: false,
          message: `Failed to populate data for ${sport}: ${syncResult.message}`,
          sportsProcessed: 0,
          totalRecords: 0,
          errors: [syncResult.message || 'Unknown error'],
          executionTime
        }
      }

    } catch (error) {
      const executionTime = Date.now() - startTime
      const errorMessage = `Error populating data for ${sport}: ${error instanceof Error ? error.message : String(error)}`

      structuredLogger.error(errorMessage)

      return {
        success: false,
        message: errorMessage,
        sportsProcessed: 0,
        totalRecords: 0,
        errors: [errorMessage],
        executionTime
      }
    }
  }
}

export const getComprehensiveDataPopulationService = () => 
  ComprehensiveDataPopulationService.getInstance()
