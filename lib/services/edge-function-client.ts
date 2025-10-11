/**
 * Edge Function Client Utility
 * Centralized client for calling Supabase Edge Functions
 * Type-safe interfaces with error handling and retries
 */

export interface EdgeFunctionResponse<T = any> {
  success: boolean
  data: T[]
  meta: {
    count: number
    [key: string]: any
  }
  error?: string
}

export interface EdgeFunctionError {
  success: false
  error: string
  details?: string
}

export interface QueryGamesParams {
  sport?: string
  league?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
}

export interface QueryTeamsParams {
  sport?: string
  league?: string
  search?: string
  limit?: number
  offset?: number
}

export interface QueryPlayersParams {
  sport?: string
  teamId?: string
  teamName?: string
  search?: string
  position?: string
  limit?: number
  offset?: number
}

export interface QueryOddsParams {
  sport?: string
  gameId?: string
  bookmaker?: string
  market?: string
  limit?: number
  offset?: number
}

export interface QueryStandingsParams {
  sport?: string
  league?: string
  season?: string
  limit?: number
  offset?: number
}

export interface QueryPredictionsParams {
  sport?: string
  gameId?: string
  model?: string
  status?: string
  limit?: number
  offset?: number
}

class EdgeFunctionClient {
  private static instance: EdgeFunctionClient
  private baseUrl: string
  private retryAttempts: number = 3
  private retryDelay: number = 1000

  private constructor() {
    // Get Supabase URL from environment
    this.baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    if (!this.baseUrl) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is required')
    }
  }

  public static getInstance(): EdgeFunctionClient {
    if (!EdgeFunctionClient.instance) {
      EdgeFunctionClient.instance = new EdgeFunctionClient()
    }
    return EdgeFunctionClient.instance
  }

  /**
   * Generic method to call Edge Functions with retry logic
   */
  private async callEdgeFunction<T>(
    functionName: string,
    params: Record<string, any> = {}
  ): Promise<EdgeFunctionResponse<T> | EdgeFunctionError> {
    const url = new URL(`${this.baseUrl}/functions/v1/${functionName}`)
    
    // Add parameters to URL
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, value.toString())
      }
    })

    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`HTTP ${response.status}: ${errorText}`)
        }

        const data = await response.json()
        return data as EdgeFunctionResponse<T>
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        if (attempt < this.retryAttempts) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt))
        }
      }
    }

    return {
      success: false,
      error: 'Edge function call failed after retries',
      ...(lastError?.message && { details: lastError.message }),
    }
  }

  /**
   * Query games from Edge Function
   */
  async queryGames(params: QueryGamesParams = {}): Promise<EdgeFunctionResponse | EdgeFunctionError> {
    return this.callEdgeFunction('query-games', params)
  }

  /**
   * Query teams from Edge Function
   */
  async queryTeams(params: QueryTeamsParams = {}): Promise<EdgeFunctionResponse | EdgeFunctionError> {
    return this.callEdgeFunction('query-teams', params)
  }

  /**
   * Query players from Edge Function
   */
  async queryPlayers(params: QueryPlayersParams = {}): Promise<EdgeFunctionResponse | EdgeFunctionError> {
    return this.callEdgeFunction('query-players', params)
  }

  /**
   * Query odds from Edge Function
   */
  async queryOdds(params: QueryOddsParams = {}): Promise<EdgeFunctionResponse | EdgeFunctionError> {
    return this.callEdgeFunction('query-odds', params)
  }

  /**
   * Query standings from Edge Function
   */
  async queryStandings(params: QueryStandingsParams = {}): Promise<EdgeFunctionResponse | EdgeFunctionError> {
    return this.callEdgeFunction('query-standings', params)
  }

  /**
   * Query predictions from Edge Function
   */
  async queryPredictions(params: QueryPredictionsParams = {}): Promise<EdgeFunctionResponse | EdgeFunctionError> {
    return this.callEdgeFunction('query-predictions', params)
  }

  /**
   * Set retry configuration
   */
  setRetryConfig(attempts: number, delay: number): void {
    this.retryAttempts = Math.max(1, attempts)
    this.retryDelay = Math.max(100, delay)
  }

  /**
   * Get current configuration
   */
  getConfig(): { baseUrl: string; retryAttempts: number; retryDelay: number } {
    return {
      baseUrl: this.baseUrl,
      retryAttempts: this.retryAttempts,
      retryDelay: this.retryDelay,
    }
  }
}

// Export singleton instance
export const edgeFunctionClient = EdgeFunctionClient.getInstance()

// Export convenience functions
export const queryGames = (params?: QueryGamesParams) => edgeFunctionClient.queryGames(params)
export const queryTeams = (params?: QueryTeamsParams) => edgeFunctionClient.queryTeams(params)
export const queryPlayers = (params?: QueryPlayersParams) => edgeFunctionClient.queryPlayers(params)
export const queryOdds = (params?: QueryOddsParams) => edgeFunctionClient.queryOdds(params)
export const queryStandings = (params?: QueryStandingsParams) => edgeFunctionClient.queryStandings(params)
export const queryPredictions = (params?: QueryPredictionsParams) => edgeFunctionClient.queryPredictions(params)
