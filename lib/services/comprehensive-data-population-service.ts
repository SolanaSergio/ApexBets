/**
 * Comprehensive Data Population Service
 * Handles comprehensive data population for all sports
 */

import { structuredLogger } from './structured-logger'
import { dataSyncService } from './data-sync-service'
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
          const syncResult = await dataSyncService.performSync(sport)
          
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
      if (typeof (dataSyncService as any).getRecordCounts === 'function') {
        const result = await (dataSyncService as any).getRecordCounts(sport)
        if (result && typeof result.total === 'number') return result.total
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
      if (typeof (dataSyncService as any).getSupportedSports === 'function') {
        const res = await (dataSyncService as any).getSupportedSports()
        if (Array.isArray(res) && res.length > 0) {
          return res as SupportedSport[]
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

      const syncResult = await dataSyncService.performSync(sport)
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
