/**
 * API Key Rotation Service
 * Manages API key rotation, backup keys, and automatic failover
 */

import { structuredLogger as logger } from './structured-logger'

interface ApiKeyConfig {
  provider: string
  primaryKey: string
  backupKeys: string[]
  maxRequestsPerHour: number
  maxRequestsPerDay: number
  currentUsage: {
    hourly: number
    daily: number
    lastReset: {
      hour: number
      day: number
    }
  }
  status: 'active' | 'rate_limited' | 'invalid' | 'suspended'
  lastValidated: number
  priority: number
}

interface KeyRotationEvent {
  timestamp: string
  provider: string
  fromKey: string
  toKey: string
  reason: 'rate_limit' | 'invalid' | 'manual' | 'scheduled'
  success: boolean
}

export class ApiKeyRotationService {
  private keyConfigs = new Map<string, ApiKeyConfig[]>()
  private currentKeyIndex = new Map<string, number>()
  private rotationHistory: KeyRotationEvent[] = []
  private readonly maxHistorySize = 100

  constructor() {
    this.loadKeyConfigurations()
    this.startPeriodicValidation()
  }

  // Load API key configurations from environment with enhanced multi-key support
  private loadKeyConfigurations(): void {
    // API-Sports keys - support multiple keys separated by commas
    const apiSportsKeys = this.parseApiKeys(
      process.env.RAPIDAPI_KEY ||
      process.env.NEXT_PUBLIC_RAPIDAPI_KEY ||
      ''
    )
    if (apiSportsKeys.length > 0 && !apiSportsKeys.includes('your_rapidapi_key_here')) {
      this.keyConfigs.set('api-sports', apiSportsKeys.map((key, index) => ({
        provider: 'api-sports',
        primaryKey: key,
        backupKeys: [],
        maxRequestsPerHour: 100, // RapidAPI free tier limit
        maxRequestsPerDay: 500,  // Conservative daily limit
        currentUsage: {
          hourly: 0,
          daily: 0,
          lastReset: {
            hour: Date.now(),
            day: Date.now()
          }
        },
        status: 'active' as const,
        lastValidated: Date.now(),
        priority: index
      })))
      this.currentKeyIndex.set('api-sports', 0)

      console.log(`API-Sports: Loaded ${apiSportsKeys.length} API key(s) for rotation`)
    }

    // Odds API keys - support multiple keys for better rate limit management
    const oddsApiKeys = this.parseApiKeys(
      process.env.ODDS_API_KEY ||
      process.env.NEXT_PUBLIC_ODDS_API_KEY ||
      ''
    )
    if (oddsApiKeys.length > 0 && !oddsApiKeys.includes('your_odds_api_key_here')) {
      this.keyConfigs.set('odds-api', oddsApiKeys.map((key, index) => ({
        provider: 'odds-api',
        primaryKey: key,
        backupKeys: [],
        maxRequestsPerHour: 500,  // The Odds API free tier
        maxRequestsPerDay: 1000,  // Conservative daily limit
        currentUsage: {
          hourly: 0,
          daily: 0,
          lastReset: {
            hour: Date.now(),
            day: Date.now()
          }
        },
        status: 'active' as const,
        lastValidated: Date.now(),
        priority: index
      })))
      this.currentKeyIndex.set('odds-api', 0)

      console.log(`Odds API: Loaded ${oddsApiKeys.length} API key(s) for rotation`)
    }

    // SportsDB API keys
    const sportsDbKeys = this.parseApiKeys(
      process.env.SPORTSDB_API_KEY ||
      process.env.NEXT_PUBLIC_SPORTSDB_API_KEY ||
      '123'
    )
    if (sportsDbKeys.length > 0) {
      this.keyConfigs.set('sportsdb', sportsDbKeys.map((key, index) => ({
        provider: 'sportsdb',
        primaryKey: key,
        backupKeys: [],
        maxRequestsPerHour: 60,
        maxRequestsPerDay: 1000,
        currentUsage: {
          hourly: 0,
          daily: 0,
          lastReset: {
            hour: Date.now(),
            day: Date.now()
          }
        },
        status: 'active' as const,
        lastValidated: Date.now(),
        priority: index
      })))
      this.currentKeyIndex.set('sportsdb', 0)
    }

    // BallDontLie API keys
    const ballDontLieKeys = this.parseApiKeys(
      process.env.BALLDONTLIE_API_KEY ||
      process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY ||
      ''
    )
    if (ballDontLieKeys.length > 0 && !ballDontLieKeys.includes('your_balldontlie_api_key_here')) {
      this.keyConfigs.set('balldontlie', ballDontLieKeys.map((key, index) => ({
        provider: 'balldontlie',
        primaryKey: key,
        backupKeys: [],
        maxRequestsPerHour: 5,   // 5 requests per minute = very strict rate limit
        maxRequestsPerDay: 100,  // Conservative daily limit due to strict rate limiting
        currentUsage: {
          hourly: 0,
          daily: 0,
          lastReset: {
            hour: Date.now(),
            day: Date.now()
          }
        },
        status: 'active' as const,
        lastValidated: Date.now(),
        priority: index
      })))
      this.currentKeyIndex.set('balldontlie', 0)
    }

    // Log the configuration results
    logger.logBusinessEvent('api_key_rotation:key_configs_loaded', {
      providers: Array.from(this.keyConfigs.keys()),
      totalKeys: Array.from(this.keyConfigs.values()).reduce((sum, keys) => sum + keys.length, 0)
    })
  }

  // Parse comma-separated API keys
  private parseApiKeys(keysString: string): string[] {
    return keysString
      .split(',')
      .map(key => key.trim())
      .filter(key => key.length > 0)
  }

  // Get current active API key for a provider
  getCurrentKey(provider: string): string | null {
    const configs = this.keyConfigs.get(provider)
    if (!configs || configs.length === 0) {
      return null
    }

    const currentIndex = this.currentKeyIndex.get(provider) || 0
    const config = configs[currentIndex]
    
    // Check if current key is still valid
    if (config.status === 'active') {
      this.updateKeyUsage(provider, config)
      return config.primaryKey
    }

    // Try to rotate to next available key
    const nextKey = this.rotateToNextKey(provider, 'invalid')
    return nextKey
  }

  // Update usage statistics for a key
  private updateKeyUsage(provider: string, config: ApiKeyConfig): void {
    const now = Date.now()
    const oneHour = 60 * 60 * 1000
    const oneDay = 24 * oneHour

    // Reset hourly counter if an hour has passed
    if (now - config.currentUsage.lastReset.hour > oneHour) {
      config.currentUsage.hourly = 0
      config.currentUsage.lastReset.hour = now
      // Reset status if it was rate limited
      if (config.status === 'rate_limited') {
        config.status = 'active'
      }
    }

    // Reset daily counter if a day has passed
    if (now - config.currentUsage.lastReset.day > oneDay) {
      config.currentUsage.daily = 0
      config.currentUsage.lastReset.day = now
      // Reset status if it was rate limited
      if (config.status === 'rate_limited') {
        config.status = 'active'
      }
    }

    // Increment usage counters
    config.currentUsage.hourly++
    config.currentUsage.daily++

    // Check rate limits - be more lenient, allow 90% of limit before rotating
    const hourlyThreshold = Math.floor(config.maxRequestsPerHour * 0.9)
    const dailyThreshold = Math.floor(config.maxRequestsPerDay * 0.9)

    if (config.currentUsage.hourly >= hourlyThreshold ||
        config.currentUsage.daily >= dailyThreshold) {
      config.status = 'rate_limited'

      // Only rotate if there are multiple keys
      const configs = this.keyConfigs.get(provider)
      if (configs && configs.length > 1) {
        this.rotateToNextKey(provider, 'rate_limit')
      }
    }
  }

  // Rotate to the next available API key
  rotateToNextKey(provider: string, reason: 'rate_limit' | 'invalid' | 'manual' | 'scheduled'): string | null {
    const configs = this.keyConfigs.get(provider)
    if (!configs || configs.length === 0) {
      return null
    }

    const currentIndex = this.currentKeyIndex.get(provider) || 0
    const currentKey = configs[currentIndex]?.primaryKey || 'unknown'

    // If there's only one key, don't rotate but reset its usage if it's rate limited
    if (configs.length === 1) {
      const currentConfig = configs[0]
      if (reason === 'rate_limit') {
        // Reset usage counters for the single key to allow continued use
        currentConfig.currentUsage.hourly = 0
        currentConfig.currentUsage.daily = 0
        currentConfig.currentUsage.lastReset.hour = Date.now()
        currentConfig.currentUsage.lastReset.day = Date.now()
        currentConfig.status = 'active'

        logger.logBusinessEvent('api_key_rotation:single_key_reset', {
          provider,
          reason,
          key: this.maskKey(currentKey)
        })

        return currentKey
      }

      // For other reasons, mark as unavailable
      logger.logBusinessEvent('api_key_rotation:single_key_unavailable', {
        provider,
        reason,
        key: this.maskKey(currentKey)
      })

      return null
    }

    // Find next available key
    let nextIndex = (currentIndex + 1) % configs.length
    let attempts = 0

    while (attempts < configs.length) {
      const nextConfig = configs[nextIndex]

      if (nextConfig.status === 'active' &&
          nextConfig.currentUsage.hourly < nextConfig.maxRequestsPerHour &&
          nextConfig.currentUsage.daily < nextConfig.maxRequestsPerDay) {

        // Update current key index
        this.currentKeyIndex.set(provider, nextIndex)

        // Log rotation event
        this.logRotationEvent({
          timestamp: new Date().toISOString(),
          provider,
          fromKey: this.maskKey(currentKey),
          toKey: this.maskKey(nextConfig.primaryKey),
          reason,
          success: true
        })

        logger.logBusinessEvent('api_key_rotation:key_rotated', {
          provider,
          reason,
          fromKey: this.maskKey(currentKey),
          toKey: this.maskKey(nextConfig.primaryKey)
        })

        return nextConfig.primaryKey
      }

      nextIndex = (nextIndex + 1) % configs.length
      attempts++
    }

    // No available keys found
    this.logRotationEvent({
      timestamp: new Date().toISOString(),
      provider,
      fromKey: this.maskKey(currentKey),
      toKey: 'none',
      reason,
      success: false
    })

    logger.logBusinessEvent('api_key_rotation:no_keys_available', {
      provider,
      reason,
      totalKeys: configs.length
    })

    return null
  }

  // Manually rotate API key
  manualRotate(provider: string): boolean {
    const nextKey = this.rotateToNextKey(provider, 'manual')
    return nextKey !== null
  }

  // Validate API key by making a test request
  async validateKey(provider: string, apiKey: string): Promise<boolean> {
    try {
      // Test endpoints for different providers
      const testEndpoints = {
        'api-sports': 'https://api-football-v1.p.rapidapi.com/v3/status',
        'odds-api': 'https://api.the-odds-api.com/v4/sports/'
      }

      const endpoint = testEndpoints[provider as keyof typeof testEndpoints]
      if (!endpoint) {
        return false
      }

      const headers: Record<string, string> = {}
      
      if (provider === 'api-sports') {
        headers['X-RapidAPI-Key'] = apiKey
        headers['X-RapidAPI-Host'] = 'api-football-v1.p.rapidapi.com'
      } else if (provider === 'odds-api') {
        // Odds API uses query parameter for API key
      }

      const response = await fetch(endpoint + (provider === 'odds-api' ? `?apiKey=${apiKey}` : ''), {
        method: 'GET',
        headers
      })

      const isValid = response.ok
      
      // Update key status
      const configs = this.keyConfigs.get(provider)
      if (configs) {
        const config = configs.find(c => c.primaryKey === apiKey)
        if (config) {
          config.status = isValid ? 'active' : 'invalid'
          config.lastValidated = Date.now()
        }
      }

      logger.logBusinessEvent('api_key_rotation:key_validated', {
        provider,
        key: this.maskKey(apiKey),
        valid: isValid,
        statusCode: response.status
      })

      return isValid
    } catch (error) {
      logger.logBusinessEvent('api_key_rotation:key_validation_error', {
        provider,
        key: this.maskKey(apiKey),
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return false
    }
  }

  // Periodic validation of all keys
  private startPeriodicValidation(): void {
    const validationInterval = 60 * 60 * 1000 // 1 hour
    
    setInterval(async () => {
      for (const [provider, configs] of this.keyConfigs.entries()) {
        for (const config of configs) {
          if (Date.now() - config.lastValidated > validationInterval) {
            await this.validateKey(provider, config.primaryKey)
          }
        }
      }
    }, validationInterval)
  }

  // Get key rotation statistics
  getRotationStats(provider?: string): any {
    if (provider) {
      const configs = this.keyConfigs.get(provider)
      if (!configs) return null

      return {
        provider,
        totalKeys: configs.length,
        activeKeys: configs.filter(c => c.status === 'active').length,
        currentKeyIndex: this.currentKeyIndex.get(provider) || 0,
        keys: configs.map(config => ({
          masked: this.maskKey(config.primaryKey),
          status: config.status,
          usage: config.currentUsage,
          lastValidated: new Date(config.lastValidated).toISOString()
        }))
      }
    }

    // Return stats for all providers
    const stats: any = {}
    for (const [providerName, configs] of this.keyConfigs.entries()) {
      stats[providerName] = {
        totalKeys: configs.length,
        activeKeys: configs.filter(c => c.status === 'active').length,
        currentKeyIndex: this.currentKeyIndex.get(providerName) || 0
      }
    }
    return stats
  }

  // Get rotation history
  getRotationHistory(limit: number = 50): KeyRotationEvent[] {
    return this.rotationHistory.slice(-limit)
  }

  // Mask API key for logging (show only first and last 4 characters)
  private maskKey(key: string): string {
    if (key.length <= 8) {
      return '*'.repeat(key.length)
    }
    return `${key.substring(0, 4)}${'*'.repeat(key.length - 8)}${key.substring(key.length - 4)}`
  }

  // Log rotation event
  private logRotationEvent(event: KeyRotationEvent): void {
    this.rotationHistory.push(event)
    
    // Maintain history size limit
    if (this.rotationHistory.length > this.maxHistorySize) {
      this.rotationHistory = this.rotationHistory.slice(-this.maxHistorySize)
    }
  }

  // Add new API key
  addApiKey(provider: string, apiKey: string, priority?: number): boolean {
    try {
      const configs = this.keyConfigs.get(provider) || []
      
      // Check if key already exists
      if (configs.some(config => config.primaryKey === apiKey)) {
        return false
      }

      const newConfig: ApiKeyConfig = {
        provider,
        primaryKey: apiKey,
        backupKeys: [],
        maxRequestsPerHour: provider === 'api-sports' ? 100 : 500,
        maxRequestsPerDay: provider === 'api-sports' ? 500 : 1000,
        currentUsage: {
          hourly: 0,
          daily: 0,
          lastReset: {
            hour: Date.now(),
            day: Date.now()
          }
        },
        status: 'active',
        lastValidated: Date.now(),
        priority: priority || configs.length
      }

      configs.push(newConfig)
      this.keyConfigs.set(provider, configs)

      logger.logBusinessEvent('api_key_rotation:key_added', {
        provider,
        key: this.maskKey(apiKey),
        totalKeys: configs.length
      })

      return true
    } catch (error) {
      logger.logBusinessEvent('api_key_rotation:key_add_error', {
        provider,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return false
    }
  }

  // Remove API key
  removeApiKey(provider: string, apiKey: string): boolean {
    try {
      const configs = this.keyConfigs.get(provider) || []
      const index = configs.findIndex(config => config.primaryKey === apiKey)
      
      if (index === -1) {
        return false
      }

      configs.splice(index, 1)
      this.keyConfigs.set(provider, configs)

      // Reset current index if necessary
      const currentIndex = this.currentKeyIndex.get(provider) || 0
      if (currentIndex >= configs.length) {
        this.currentKeyIndex.set(provider, Math.max(0, configs.length - 1))
      }

      logger.logBusinessEvent('api_key_rotation:key_removed', {
        provider,
        key: this.maskKey(apiKey),
        remainingKeys: configs.length
      })

      return true
    } catch (error) {
      logger.logBusinessEvent('api_key_rotation:key_remove_error', {
        provider,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return false
    }
  }

  // Reset key usage statistics
  resetKeyUsage(provider: string, apiKey?: string): boolean {
    try {
      const configs = this.keyConfigs.get(provider) || []
      
      if (apiKey) {
        // Reset specific key
        const config = configs.find(c => c.primaryKey === apiKey)
        if (config) {
          config.currentUsage.hourly = 0
          config.currentUsage.daily = 0
          config.currentUsage.lastReset.hour = Date.now()
          config.currentUsage.lastReset.day = Date.now()
          if (config.status === 'rate_limited') {
            config.status = 'active'
          }
        }
      } else {
        // Reset all keys for provider
        configs.forEach(config => {
          config.currentUsage.hourly = 0
          config.currentUsage.daily = 0
          config.currentUsage.lastReset.hour = Date.now()
          config.currentUsage.lastReset.day = Date.now()
          if (config.status === 'rate_limited') {
            config.status = 'active'
          }
        })
      }

      logger.logBusinessEvent('api_key_rotation:usage_reset', {
        provider,
        key: apiKey ? this.maskKey(apiKey) : 'all',
        timestamp: new Date().toISOString()
      })

      return true
    } catch (error) {
      logger.logBusinessEvent('api_key_rotation:usage_reset_error', {
        provider,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return false
    }
  }
}

export const apiKeyRotation = new ApiKeyRotationService()