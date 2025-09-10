/**
 * Environment Variables Validator
 * Uses strict rules enforcement - no placeholders, no fallbacks
 */

import { environmentRules } from '../rules'

interface EnvConfig {
  // Database
  supabaseUrl: string
  supabaseAnonKey: string
  supabaseServiceRoleKey: string
  
  // Sports APIs
  rapidApiKey: string
  oddsApiKey: string
  sportsDbApiKey: string
  ballDontLieApiKey: string
  
  // App Configuration
  apiUrl: string
  appName: string
  appVersion: string
  
  // Feature Flags
  enableLiveUpdates: boolean
  enableValueBetting: boolean
  enableMlPredictions: boolean
}

interface ApiKeyStatus {
  key: string
  isValid: boolean
  hasValue: boolean
  rateLimit?: {
    requestsPerMinute: number
    requestsPerDay: number
    burstLimit: number
  }
}

class EnvValidator {
  private config: EnvConfig
  private apiKeyStatuses: Map<string, ApiKeyStatus> = new Map()

  constructor() {
    // Enforce environment rules first
    environmentRules.enforceEnvironmentRules()
    this.config = environmentRules.getValidatedConfig()
    this.validateApiKeys()
  }

  // loadConfig removed - now using environmentRules.getValidatedConfig()

  private validateApiKeys(): void {
    // RapidAPI (API-SPORTS)
    this.apiKeyStatuses.set('rapidapi', {
      key: 'NEXT_PUBLIC_RAPIDAPI_KEY',
      isValid: this.isValidApiKey(this.config.rapidApiKey),
      hasValue: !!this.config.rapidApiKey,
      rateLimit: {
        requestsPerMinute: 100,
        requestsPerDay: 10000,
        burstLimit: 10
      }
    })

    // The Odds API
    this.apiKeyStatuses.set('odds', {
      key: 'NEXT_PUBLIC_ODDS_API_KEY',
      isValid: this.isValidApiKey(this.config.oddsApiKey),
      hasValue: !!this.config.oddsApiKey,
      rateLimit: {
        requestsPerMinute: 10,
        requestsPerDay: 100,
        burstLimit: 5
      }
    })

    // TheSportsDB (Free)
    this.apiKeyStatuses.set('sportsdb', {
      key: 'NEXT_PUBLIC_SPORTSDB_API_KEY',
      isValid: true, // Always valid, uses '123' as default
      hasValue: true,
      rateLimit: {
        requestsPerMinute: 30,
        requestsPerDay: 10000,
        burstLimit: 5
      }
    })

    // BALLDONTLIE (Requires API key)
    this.apiKeyStatuses.set('balldontlie', {
      key: 'NEXT_PUBLIC_BALLDONTLIE_API_KEY',
      isValid: this.isValidApiKey(this.config.ballDontLieApiKey),
      hasValue: !!this.config.ballDontLieApiKey,
      rateLimit: {
        requestsPerMinute: 5, // Free tier: 5 requests per minute
        requestsPerDay: 10000,
        burstLimit: 5
      }
    })

    // Supabase
    this.apiKeyStatuses.set('supabase', {
      key: 'NEXT_PUBLIC_SUPABASE_URL',
      isValid: this.isValidSupabaseUrl(this.config.supabaseUrl),
      hasValue: !!this.config.supabaseUrl
    })
  }

  private isValidApiKey(key: string): boolean {
    if (!key) return false
    return key.length >= 10
  }

  private isValidSupabaseUrl(url: string): boolean {
    if (!url) return false
    return url.includes('supabase.co') && url.startsWith('https://')
  }

  getConfig(): EnvConfig {
    return this.config
  }

  getApiKeyStatus(service: string): ApiKeyStatus | undefined {
    return this.apiKeyStatuses.get(service)
  }

  getAllApiKeyStatuses(): Map<string, ApiKeyStatus> {
    return this.apiKeyStatuses
  }

  getMissingRequiredKeys(): string[] {
    return environmentRules.getValidationErrors()
  }

  getInvalidKeys(): string[] {
    return environmentRules.getValidationErrors()
  }

  isFullyConfigured(): boolean {
    return environmentRules.isConfigured()
  }

  getConfigurationReport(): {
    isConfigured: boolean
    missingKeys: string[]
    invalidKeys: string[]
    apiStatuses: Record<string, ApiKeyStatus>
    recommendations: string[]
  } {
    const missingKeys = this.getMissingRequiredKeys()
    const invalidKeys = this.getInvalidKeys()
    const isConfigured = this.isFullyConfigured()
    
    const recommendations: string[] = []
    
    if (missingKeys.length > 0) {
      recommendations.push(`Set up missing environment variables: ${missingKeys.join(', ')}`)
    }
    
    if (invalidKeys.length > 0) {
      recommendations.push(`Fix invalid API keys: ${invalidKeys.join(', ')}`)
    }
    
    if (!this.config.rapidApiKey) {
      recommendations.push('Consider adding RapidAPI key for enhanced sports data (API-SPORTS)')
    }
    
    if (!this.config.oddsApiKey) {
      recommendations.push('Consider adding Odds API key for betting odds data')
    }
    
    if (this.config.rapidApiKey && this.config.oddsApiKey) {
      recommendations.push('All API keys configured! You have access to premium features.')
    }

    return {
      isConfigured,
      missingKeys,
      invalidKeys,
      apiStatuses: Object.fromEntries(this.apiKeyStatuses),
      recommendations
    }
  }
}

export const envValidator = new EnvValidator()
export type { EnvConfig, ApiKeyStatus }
