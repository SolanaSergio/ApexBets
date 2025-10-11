/**
 * Environment Rules Enforcement
 * Strict validation and enforcement of environment variable rules
 */

export class EnvironmentRules {
  private static instance: EnvironmentRules
  private isInitialized = false
  private validationErrors: string[] = []

  static getInstance(): EnvironmentRules {
    if (!EnvironmentRules.instance) {
      EnvironmentRules.instance = new EnvironmentRules()
    }
    return EnvironmentRules.instance
  }

  /**
   * Enforce environment validation rules
   * Throws errors for violations, never uses placeholders
   */
  enforceEnvironmentRules(): void {
    this.validateRequiredVariables()
    this.validateApiKeys()
    this.validateUrls()
    this.validateFeatureFlags()

    if (this.validationErrors.length > 0) {
      throw new Error(`Environment validation failed: ${this.validationErrors.join(', ')}`)
    }

    this.isInitialized = true
  }

  private validateRequiredVariables(): void {
    const required = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ]

    for (const varName of required) {
      const value = process.env[varName]

      if (!value) {
        this.validationErrors.push(`Missing required variable: ${varName}`)
        continue
      }

      if (this.containsPlaceholder(value)) {
        this.validationErrors.push(`Placeholder detected in ${varName}`)
      }
    }

    // Validate webhook secret for security
    this.validateWebhookSecret()
  }

  private validateWebhookSecret(): void {
    const webhookSecret = process.env.WEBHOOK_SECRET

    if (webhookSecret) {
      if (this.containsPlaceholder(webhookSecret)) {
        this.validationErrors.push('Placeholder detected in WEBHOOK_SECRET')
      }

      if (webhookSecret.length < 32) {
        this.validationErrors.push('WEBHOOK_SECRET must be at least 32 characters long')
      }
    }
  }

  private validateApiKeys(): void {
    const apiKeys = [
      { name: 'NEXT_PUBLIC_RAPIDAPI_KEY', minLength: 10 },
      { name: 'NEXT_PUBLIC_ODDS_API_KEY', minLength: 10 },
      { name: 'NEXT_PUBLIC_BALLDONTLIE_API_KEY', minLength: 10 },
    ]

    for (const { name, minLength } of apiKeys) {
      const value = process.env[name]

      if (value && this.containsPlaceholder(value)) {
        this.validationErrors.push(`Placeholder detected in ${name}`)
      }

      if (value && value.length < minLength) {
        this.validationErrors.push(`Invalid ${name}: too short`)
      }
    }
  }

  private validateUrls(): void {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (supabaseUrl && !this.isValidSupabaseUrl(supabaseUrl)) {
      this.validationErrors.push('Invalid Supabase URL format')
    }
  }

  private validateFeatureFlags(): void {
    const flags = [
      'NEXT_PUBLIC_ENABLE_LIVE_UPDATES',
      'NEXT_PUBLIC_ENABLE_VALUE_BETTING',
      'NEXT_PUBLIC_ENABLE_ML_PREDICTIONS',
    ]

    for (const flag of flags) {
      const value = process.env[flag]

      if (value && !['true', 'false'].includes(value.toLowerCase())) {
        this.validationErrors.push(`Invalid boolean value for ${flag}`)
      }
    }
  }

  private containsPlaceholder(value: string): boolean {
    const placeholders = [
      'your_',
      'placeholder',
      'example',
      'replace_with',
      'enter_your',
      'add_your',
    ]

    return placeholders.some(placeholder => value.toLowerCase().includes(placeholder.toLowerCase()))
  }

  private isValidSupabaseUrl(url: string): boolean {
    return url.includes('supabase.co') && url.startsWith('https://')
  }

  /**
   * Get validated environment configuration
   * Only call after enforceEnvironmentRules() succeeds
   */
  getValidatedConfig() {
    if (!this.isInitialized) {
      throw new Error('Environment rules not enforced. Call enforceEnvironmentRules() first.')
    }

    return {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      rapidApiKey: process.env.NEXT_PUBLIC_RAPIDAPI_KEY || undefined,
      oddsApiKey: process.env.NEXT_PUBLIC_ODDS_API_KEY || undefined,
      sportsDbApiKey: process.env.NEXT_PUBLIC_SPORTSDB_API_KEY || undefined,
      ballDontLieApiKey: process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY || undefined,
      webhookSecret: process.env.WEBHOOK_SECRET || undefined,
      apiUrl: process.env.NEXT_PUBLIC_API_URL!,
      appName: process.env.NEXT_PUBLIC_APP_NAME!,
      appVersion: process.env.NEXT_PUBLIC_APP_VERSION!,
      enableLiveUpdates: process.env.NEXT_PUBLIC_ENABLE_LIVE_UPDATES === 'true',
      enableValueBetting: process.env.NEXT_PUBLIC_ENABLE_VALUE_BETTING === 'true',
      enableMlPredictions: process.env.NEXT_PUBLIC_ENABLE_ML_PREDICTIONS === 'true',
    }
  }

  /**
   * Check if environment is properly configured
   */
  isConfigured(): boolean {
    return this.isInitialized && this.validationErrors.length === 0
  }

  /**
   * Get validation errors
   */
  getValidationErrors(): string[] {
    return [...this.validationErrors]
  }
}

export const environmentRules = EnvironmentRules.getInstance()
