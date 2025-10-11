/**
 * Central Environment Variable Validation
 * Enforces strict validation with no fallbacks or placeholders
 */

export interface EnvConfig {
  // Supabase (client-side accessible)
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  
  // Supabase (server-side only)
  SUPABASE_SERVICE_ROLE_KEY?: string

  // API Configuration
  NEXT_PUBLIC_API_URL: string

  // API Keys (no placeholders allowed)
  RAPIDAPI_KEY?: string
  NEXT_PUBLIC_RAPIDAPI_KEY?: string
  ODDS_API_KEY?: string
  NEXT_PUBLIC_ODDS_API_KEY?: string
  SPORTSDB_API_KEY?: string
  NEXT_PUBLIC_SPORTSDB_API_KEY?: string
  BALLDONTLIE_API_KEY?: string
  NEXT_PUBLIC_BALLDONTLIE_API_KEY?: string

  // App Configuration
  NODE_ENV: string
  NEXT_PUBLIC_APP_VERSION?: string
  HOSTNAME?: string
  PORT?: string

  // Sports Configuration (dynamic, no hardcoded sports)
  SUPPORTED_SPORTS?: string
  NEXT_PUBLIC_SUPPORTED_SPORTS?: string
}

class EnvValidator {
  private static instance: EnvValidator
  private config: EnvConfig | null = null
  private validationErrors: string[] = []
  private supportedSports: string[] = []

  public static getInstance(): EnvValidator {
    if (!EnvValidator.instance) {
      EnvValidator.instance = new EnvValidator()
    }
    return EnvValidator.instance
  }

  /**
   * Validate all required environment variables
   * Throws error if any required vars are missing or contain placeholders
   */
  public validate(): EnvConfig {
    if (this.config) {
      return this.config
    }

    this.validationErrors = []
    const config: Partial<EnvConfig> = {}

    // Required Supabase variables (client-side accessible)
    this.validateRequired('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL, config)
    this.validateRequired(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      config
    )
    
    // Server-side only Supabase variable (optional for client-side validation)
    this.validateOptional(
      'SUPABASE_SERVICE_ROLE_KEY',
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      config
    )

    // Optional API keys (but validate format if present)
    this.validateOptional('RAPIDAPI_KEY', process.env.RAPIDAPI_KEY, config)
    this.validateOptional('NEXT_PUBLIC_RAPIDAPI_KEY', process.env.NEXT_PUBLIC_RAPIDAPI_KEY, config)
    this.validateOptional('ODDS_API_KEY', process.env.ODDS_API_KEY, config)
    this.validateOptional('NEXT_PUBLIC_ODDS_API_KEY', process.env.NEXT_PUBLIC_ODDS_API_KEY, config)
    this.validateOptional('SPORTSDB_API_KEY', process.env.SPORTSDB_API_KEY, config)
    this.validateOptional(
      'NEXT_PUBLIC_SPORTSDB_API_KEY',
      process.env.NEXT_PUBLIC_SPORTSDB_API_KEY,
      config
    )
    this.validateOptional('BALLDONTLIE_API_KEY', process.env.BALLDONTLIE_API_KEY, config)
    this.validateOptional(
      'NEXT_PUBLIC_BALLDONTLIE_API_KEY',
      process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY,
      config
    )

    // App configuration
    this.validateRequired('NODE_ENV', process.env.NODE_ENV, config)
    this.validateOptional('NEXT_PUBLIC_APP_VERSION', process.env.NEXT_PUBLIC_APP_VERSION, config)
    this.validateOptional('HOSTNAME', process.env.HOSTNAME, config)
    this.validateOptional('PORT', process.env.PORT, config)

    // Sports configuration (dynamic)
    this.validateOptional('SUPPORTED_SPORTS', process.env.SUPPORTED_SPORTS, config)
    this.validateOptional(
      'NEXT_PUBLIC_SUPPORTED_SPORTS',
      process.env.NEXT_PUBLIC_SUPPORTED_SPORTS,
      config
    )

    if (this.validationErrors.length > 0) {
      throw new Error(`Environment validation failed:\n${this.validationErrors.join('\n')}`)
    }

    this.config = config as EnvConfig
    return this.config
  }

  private validateRequired(
    key: string,
    value: string | undefined,
    config: Partial<EnvConfig>
  ): void {
    if (!value) {
      this.validationErrors.push(`Missing required environment variable: ${key}`)
      return
    }

    if (this.containsPlaceholder(value)) {
      this.validationErrors.push(`Environment variable ${key} contains placeholder value: ${value}`)
      return
    }

    ;(config as any)[key] = value
  }

  private validateOptional(
    key: string,
    value: string | undefined,
    config: Partial<EnvConfig>
  ): void {
    if (!value) {
      return
    }

    if (this.containsPlaceholder(value)) {
      this.validationErrors.push(`Environment variable ${key} contains placeholder value: ${value}`)
      return
    }

    ;(config as any)[key] = value
  }

  private containsPlaceholder(value: string): boolean {
    const placeholders = [
      'your_api_key',
      'placeholder',
      'example',
      'your-',
      'replace_me',
      'changeme',
      'TODO',
      'FIXME',
    ]

    return placeholders.some(placeholder => value.toLowerCase().includes(placeholder.toLowerCase()))
  }

  /**
   * Validate server-side environment variables
   * This should be called on the server side to ensure all required variables are present
   */
  public validateServerSide(): EnvConfig {
    this.validationErrors = []
    const config: Partial<EnvConfig> = {}

    // Required Supabase variables (client-side accessible)
    this.validateRequired('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL, config)
    this.validateRequired(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      config
    )
    
    // Required server-side Supabase variable
    this.validateRequired(
      'SUPABASE_SERVICE_ROLE_KEY',
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      config
    )

    // Optional API keys (but validate format if present)
    this.validateOptional('RAPIDAPI_KEY', process.env.RAPIDAPI_KEY, config)
    this.validateOptional('NEXT_PUBLIC_RAPIDAPI_KEY', process.env.NEXT_PUBLIC_RAPIDAPI_KEY, config)
    this.validateOptional('ODDS_API_KEY', process.env.ODDS_API_KEY, config)
    this.validateOptional('NEXT_PUBLIC_ODDS_API_KEY', process.env.NEXT_PUBLIC_ODDS_API_KEY, config)
    this.validateOptional('SPORTSDB_API_KEY', process.env.SPORTSDB_API_KEY, config)
    this.validateOptional(
      'NEXT_PUBLIC_SPORTSDB_API_KEY',
      process.env.NEXT_PUBLIC_SPORTSDB_API_KEY,
      config
    )
    this.validateOptional('BALLDONTLIE_API_KEY', process.env.BALLDONTLIE_API_KEY, config)
    this.validateOptional(
      'NEXT_PUBLIC_BALLDONTLIE_API_KEY',
      process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY,
      config
    )

    // App configuration
    this.validateRequired('NODE_ENV', process.env.NODE_ENV, config)
    this.validateOptional('NEXT_PUBLIC_APP_VERSION', process.env.NEXT_PUBLIC_APP_VERSION, config)
    this.validateOptional('HOSTNAME', process.env.HOSTNAME, config)
    this.validateOptional('PORT', process.env.PORT, config)

    // Sports configuration (dynamic)
    this.validateOptional('SUPPORTED_SPORTS', process.env.SUPPORTED_SPORTS, config)
    this.validateOptional(
      'NEXT_PUBLIC_SUPPORTED_SPORTS',
      process.env.NEXT_PUBLIC_SUPPORTED_SPORTS,
      config
    )

    if (this.validationErrors.length > 0) {
      throw new Error(`Environment validation failed:\n${this.validationErrors.join('\n')}`)
    }

    this.config = config as EnvConfig
    return this.config
  }

  /**
   * Get validated configuration
   * Always enforces validation; no build-time fallbacks allowed
   */
  public getConfig(): EnvConfig {
    if (!this.config) {
      // Use client-side validation for browser environments
      return this.validate()
    }
    return this.config
  }

  /**
   * Get server-side validated configuration
   * Enforces server-side validation with all required variables
   */
  public getServerConfig(): EnvConfig {
    if (!this.config) {
      // Enforce server-side validation immediately
      return this.validateServerSide()
    }
    return this.config
  }

  /**
   * Get supported sports from environment (dynamic, no hardcoded sports)
   */
  public getSupportedSports(): string[] {
    if (this.supportedSports.length > 0) {
      return this.supportedSports
    }

    // Try to get sports from environment without full validation
    const sports = process.env.SUPPORTED_SPORTS || process.env.NEXT_PUBLIC_SUPPORTED_SPORTS || ''
    this.supportedSports = sports
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    // If no sports configured, return empty array (will be handled by caller)
    return this.supportedSports
  }

  /**
   * Check if a specific sport is supported
   */
  public isSportSupported(sport: string): boolean {
    const supportedSports = this.getSupportedSports()
    // If no sports are configured, nothing is supported
    if (supportedSports.length === 0) return false
    return supportedSports.includes(sport)
  }

  /**
   * Get configuration report for health checks
   */
  public getConfigurationReport(): {
    isConfigured: boolean
    missingKeys: string[]
    invalidKeys: string[]
    apiStatuses: Record<string, any>
    recommendations: string[]
    valid: boolean
    errors: string[]
    config: Partial<EnvConfig>
  } {
    try {
      const config = this.validate()
      return {
        isConfigured: true,
        missingKeys: [],
        invalidKeys: [],
        apiStatuses: {},
        recommendations: [],
        valid: true,
        errors: [],
        config,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {
        isConfigured: false,
        missingKeys: [],
        invalidKeys: [],
        apiStatuses: {},
        recommendations: ['Fix environment variable configuration'],
        valid: false,
        errors: [errorMessage],
        config: {},
      }
    }
  }
}

export const envValidator = EnvValidator.getInstance()

// Export convenience functions
export const validateEnv = () => envValidator.validate()
export const validateServerSideEnv = () => envValidator.validateServerSide()
export const getEnvConfig = () => envValidator.getConfig()
export const getServerEnvConfig = () => envValidator.getServerConfig()
export const getSupportedSports = () => envValidator.getSupportedSports()
export const isSportSupported = (sport: string) => envValidator.isSportSupported(sport)
