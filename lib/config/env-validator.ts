/**
 * Environment Variables Validator
 * Validates and provides fallbacks for all required environment variables
 */

interface EnvConfig {
  // Database
  supabaseUrl: string
  supabaseAnonKey: string
  supabaseServiceRoleKey: string
  
  // Sports APIs
  rapidApiKey: string
  oddsApiKey: string
  sportsDbApiKey: string
  
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
  fallback?: string
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
    this.config = this.loadConfig()
    this.validateApiKeys()
  }

  private loadConfig(): EnvConfig {
    return {
      // Database
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      
      // Sports APIs
      rapidApiKey: process.env.NEXT_PUBLIC_RAPIDAPI_KEY || '',
      oddsApiKey: process.env.NEXT_PUBLIC_ODDS_API_KEY || '',
      sportsDbApiKey: process.env.NEXT_PUBLIC_SPORTSDB_API_KEY || '123',
      
      // App Configuration
      apiUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
      appName: process.env.NEXT_PUBLIC_APP_NAME || 'ApexBets',
      appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      
      // Feature Flags
      enableLiveUpdates: process.env.NEXT_PUBLIC_ENABLE_LIVE_UPDATES === 'true',
      enableValueBetting: process.env.NEXT_PUBLIC_ENABLE_VALUE_BETTING === 'true',
      enableMlPredictions: process.env.NEXT_PUBLIC_ENABLE_ML_PREDICTIONS === 'true'
    }
  }

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
      fallback: '123',
      rateLimit: {
        requestsPerMinute: 30,
        requestsPerDay: 10000,
        burstLimit: 5
      }
    })

    // BALLDONTLIE (Free, no key required)
    this.apiKeyStatuses.set('balldontlie', {
      key: 'NONE_REQUIRED',
      isValid: true,
      hasValue: true,
      rateLimit: {
        requestsPerMinute: 60,
        requestsPerDay: 10000,
        burstLimit: 10
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
    if (!key || key === 'your_rapidapi_key' || key === 'your_odds_api_key') {
      return false
    }
    return key.length >= 10
  }

  private isValidSupabaseUrl(url: string): boolean {
    if (!url || url === 'your_supabase_url') {
      return false
    }
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
    const missing: string[] = []
    
    if (!this.config.supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL')
    if (!this.config.supabaseAnonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    if (!this.config.supabaseServiceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY')
    
    return missing
  }

  getInvalidKeys(): string[] {
    const invalid: string[] = []
    
    if (this.config.rapidApiKey && !this.isValidApiKey(this.config.rapidApiKey)) {
      invalid.push('NEXT_PUBLIC_RAPIDAPI_KEY')
    }
    if (this.config.oddsApiKey && !this.isValidApiKey(this.config.oddsApiKey)) {
      invalid.push('NEXT_PUBLIC_ODDS_API_KEY')
    }
    if (this.config.supabaseUrl && !this.isValidSupabaseUrl(this.config.supabaseUrl)) {
      invalid.push('NEXT_PUBLIC_SUPABASE_URL')
    }
    
    return invalid
  }

  isFullyConfigured(): boolean {
    return this.getMissingRequiredKeys().length === 0 && this.getInvalidKeys().length === 0
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
