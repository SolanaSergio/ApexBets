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

          // Use data sync service to populate data
          // Data sync service was removed
          const syncResult = { success: false, message: 'Data sync service was removed' }
          
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

  private async getRecordCount(sport: SupportedSport): Promise<number> {
    try {
      // Data sync service was removed
      if (false) {
        const result = { message: 'Data sync service was removed' }
        if (result && typeof (result as any).total === 'number') return (result as any).total
      }
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
      // Data sync service was removed
      if (false) {
        const res = { message: 'Data sync service was removed' }
        if (Array.isArray(res) && (res as any).length > 0) {
          return (res as any) as SupportedSport[]
        }
      }
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

      // Data sync service was removed
      const syncResult = { success: false, message: 'Data sync service was removed' }
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
          errors: [syncResult.message],
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
