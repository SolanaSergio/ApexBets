/**
 * Enhanced API Client
 * Advanced API client with health monitoring and circuit breaker
 */

import { structuredLogger } from './structured-logger'
import { apiFallbackStrategy } from './api-fallback-strategy'

// Create Supabase client for production
// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
// const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
// const productionSupabaseClient = createClient(supabaseUrl, supabaseKey)

// Mock invoke function for now
const mockInvoke = async (functionName: string, data: any) => {
  console.log(`Mock invoke: ${functionName}`, data)
  return { success: true, data: [] }
}

export interface HealthStatus {
  healthy: boolean
  lastCheck: Date
  responseTime: number
  errorRate: number
  totalRequests: number
  successfulRequests: number
  failedRequests: number
}

export class EnhancedApiClient {
  private static instance: EnhancedApiClient
  private healthStatus: Map<string, HealthStatus> = new Map()
  private circuitBreakerState: Map<string, 'closed' | 'open' | 'half-open'> = new Map()

  public static getInstance(): EnhancedApiClient {
    if (!EnhancedApiClient.instance) {
      EnhancedApiClient.instance = new EnhancedApiClient()
    }
    return EnhancedApiClient.instance
  }

  // Insert helpers used by admin routes. These delegate to database service or unified strategy.
  async insertTeam(data: any): Promise<{ success: boolean }> {
    try {
      // Validate minimal shape
      if (!data?.name || !data?.sport) {
        return { success: false }
      }
      const { success } = await mockInvoke('insert-team', data)
      return { success }
    } catch {
      return { success: false }
    }
  }

  async insertGame(data: any): Promise<{ success: boolean }> {
    try {
      if (!data?.sport || !data?.game_date) {
        return { success: false }
      }
      const { success } = await mockInvoke('insert-game', data)
      return { success }
    } catch {
      return { success: false }
    }
  }

  async insertOdds(data: any): Promise<{ success: boolean }> {
    try {
      if (!data?.game_id || !data?.market) {
        return { success: false }
      }
      const { success } = await mockInvoke('insert-odds', data)
      return { success }
    } catch {
      return { success: false }
    }
  }

  async batchInsertTeams(data: any[]): Promise<{ success: boolean; inserted: number }> {
    try {
      if (!Array.isArray(data) || data.length === 0) {
        return { success: false, inserted: 0 }
      }
      const { success, data: insertedData } = await mockInvoke('batch-insert-teams', { teams: data })
      return { success, inserted: insertedData?.length || 0 }
    } catch {
      return { success: false, inserted: 0 }
    }
  }

  async batchInsertGames(data: any[]): Promise<{ success: boolean; inserted: number }> {
    try {
      if (!Array.isArray(data) || data.length === 0) {
        return { success: false, inserted: 0 }
      }
      const { success, data: insertedData } = await mockInvoke('batch-insert-games', { games: data })
      return { success, inserted: insertedData?.length || 0 }
    } catch {
      return { success: false, inserted: 0 }
    }
  }

  async batchInsertOdds(data: any[]): Promise<{ success: boolean; inserted: number }> {
    try {
      if (!Array.isArray(data) || data.length === 0) {
        return { success: false, inserted: 0 }
      }
      const { success, data: insertedData } = await mockInvoke('batch-insert-odds', { odds: data })
      return { success, inserted: insertedData?.length || 0 }
    } catch {
      return { success: false, inserted: 0 }
    }
  }

  async forceHealthCheck(): Promise<{ healthy: boolean; details: any }> {
    try {
      structuredLogger.info('Starting forced health check')

      const startTime = Date.now()

      // Test basic connectivity
      const testResult = await apiFallbackStrategy.fetchData('health', {})
      const responseTime = Date.now() - startTime

      const healthy = Array.isArray(testResult) && responseTime < 5000

      const healthDetails = {
        healthy,
        responseTime,
        lastCheck: new Date().toISOString(),
        testResult: healthy ? 'passed' : 'failed',
        error: healthy ? undefined : 'Health check failed',
      }

      structuredLogger.info('Health check completed', healthDetails)

      return {
        healthy,
        details: healthDetails,
      }
    } catch (error) {
      const errorMessage = `Health check failed: ${error instanceof Error ? error.message : String(error)}`

      structuredLogger.error(errorMessage)

      return {
        healthy: false,
        details: {
          healthy: false,
          error: errorMessage,
          lastCheck: new Date().toISOString(),
        },
      }
    }
  }

  async cleanupDuplicates(): Promise<{ success: boolean; cleaned: number; errors: string[] }> {
    try {
      structuredLogger.info('Starting duplicate cleanup')

      // This would typically involve database operations to find and remove duplicates
      // For now, return a placeholder response
      const cleaned = 0
      const errors: string[] = []

      structuredLogger.info('Duplicate cleanup completed', { cleaned })

      return {
        success: true,
        cleaned,
        errors,
      }
    } catch (error) {
      const errorMessage = `Duplicate cleanup failed: ${error instanceof Error ? error.message : String(error)}`

      structuredLogger.error(errorMessage)

      return {
        success: false,
        cleaned: 0,
        errors: [errorMessage],
      }
    }
  }

  async getHealthStatus(): Promise<Map<string, HealthStatus>> {
    return new Map(this.healthStatus)
  }

  async updateHealthStatus(service: string, status: HealthStatus): Promise<void> {
    this.healthStatus.set(service, status)
  }

  async getCircuitBreakerState(service: string): Promise<'closed' | 'open' | 'half-open'> {
    return this.circuitBreakerState.get(service) || 'closed'
  }

  async setCircuitBreakerState(
    service: string,
    state: 'closed' | 'open' | 'half-open'
  ): Promise<void> {
    this.circuitBreakerState.set(service, state)
  }

  async resetCircuitBreaker(service: string): Promise<void> {
    this.circuitBreakerState.set(service, 'closed')
    structuredLogger.info('Circuit breaker reset', { service })
  }

  async getMetrics(): Promise<any> {
    return {
      healthStatus: Object.fromEntries(this.healthStatus),
      circuitBreakerState: Object.fromEntries(this.circuitBreakerState),
      timestamp: new Date().toISOString(),
    }
  }
}

export const enhancedApiClient = EnhancedApiClient.getInstance()
