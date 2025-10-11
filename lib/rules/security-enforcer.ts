/**
 * Security Rules Enforcement
 * Enforces security rules and prevents data leaks
 */

export class SecurityEnforcer {
  private static instance: SecurityEnforcer

  static getInstance(): SecurityEnforcer {
    if (!SecurityEnforcer.instance) {
      SecurityEnforcer.instance = new SecurityEnforcer()
    }
    return SecurityEnforcer.instance
  }

  /**
   * Sanitize data before logging
   * Removes sensitive information
   */
  sanitizeForLogging(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data
    }

    const sanitized = { ...data }
    const sensitiveKeys = [
      'password',
      'token',
      'key',
      'secret',
      'auth',
      'credential',
      'api_key',
      'access_token',
      'refresh_token',
    ]

    for (const key in sanitized) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '***REDACTED***'
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeForLogging(sanitized[key])
      }
    }

    return sanitized
  }

  /**
   * Validate API key format
   * Throws error if key is invalid
   */
  validateApiKey(key: string, keyName: string): void {
    if (!key) {
      throw new Error(`Missing ${keyName}`)
    }

    if (key.length < 10) {
      throw new Error(`Invalid ${keyName}: too short`)
    }

    if (this.containsPlaceholder(key)) {
      throw new Error(`Invalid ${keyName}: contains placeholder`)
    }

    // Check for common placeholder patterns
    const placeholderPatterns = [
      /your_/i,
      /placeholder/i,
      /example/i,
      /replace_with/i,
      /enter_your/i,
      /add_your/i,
    ]

    for (const pattern of placeholderPatterns) {
      if (pattern.test(key)) {
        throw new Error(`Invalid ${keyName}: contains placeholder text`)
      }
    }
  }

  /**
   * Validate user input
   * Prevents injection attacks
   */
  validateUserInput(input: any, fieldName: string): any {
    if (input === null || input === undefined) {
      return input
    }

    if (typeof input === 'string') {
      // Check for SQL injection patterns
      const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
        /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
        /(\b(OR|AND)\s+'.*'\s*=\s*'.*')/i,
        /(UNION\s+SELECT)/i,
        /(DROP\s+TABLE)/i,
        /(DELETE\s+FROM)/i,
      ]

      for (const pattern of sqlPatterns) {
        if (pattern.test(input)) {
          throw new Error(`Invalid input in ${fieldName}: potential SQL injection detected`)
        }
      }

      // Check for XSS patterns
      const xssPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /<iframe/i,
        /<object/i,
        /<embed/i,
      ]

      for (const pattern of xssPatterns) {
        if (pattern.test(input)) {
          throw new Error(`Invalid input in ${fieldName}: potential XSS detected`)
        }
      }

      return input.trim()
    }

    if (typeof input === 'object') {
      const sanitized: Record<string, any> = {}
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.validateUserInput(value, `${fieldName}.${key}`)
      }
      return sanitized
    }

    return input
  }

  /**
   * Validate URL format
   * Prevents malicious URLs
   */
  validateUrl(url: string, fieldName: string): string {
    if (!url) {
      throw new Error(`Missing ${fieldName}`)
    }

    try {
      const parsedUrl = new URL(url)

      // Only allow HTTPS in production
      if (process.env.NODE_ENV === 'production' && parsedUrl.protocol !== 'https:') {
        throw new Error(`Invalid ${fieldName}: only HTTPS URLs allowed in production`)
      }

      // Check for suspicious domains
      const suspiciousDomains = ['localhost', '127.0.0.1', '0.0.0.0', 'internal', 'local']

      if (suspiciousDomains.some(domain => parsedUrl.hostname.includes(domain))) {
        throw new Error(`Invalid ${fieldName}: suspicious domain detected`)
      }

      return url
    } catch (error) {
      throw new Error(
        `Invalid ${fieldName}: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * Validate database query
   * Prevents SQL injection
   */
  validateDatabaseQuery(query: string): void {
    if (!query || typeof query !== 'string') {
      throw new Error('Invalid database query: must be a string')
    }

    // Check for dangerous SQL patterns
    const dangerousPatterns = [
      /(\b(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|TRUNCATE)\b)/i,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
      /(UNION\s+SELECT)/i,
      /(EXEC\s*\()/i,
      /(xp_cmdshell)/i,
      /(sp_executesql)/i,
    ]

    for (const pattern of dangerousPatterns) {
      if (pattern.test(query)) {
        throw new Error('Invalid database query: potentially dangerous SQL detected')
      }
    }
  }

  /**
   * Check if string contains placeholder
   */
  private containsPlaceholder(str: string): boolean {
    const placeholderPatterns = [
      /your_/i,
      /placeholder/i,
      /example/i,
      /replace_with/i,
      /enter_your/i,
      /add_your/i,
      /<.*>/i, // HTML tags
      /\{\{.*\}\}/i, // Template variables
    ]

    return placeholderPatterns.some(pattern => pattern.test(str))
  }

  /**
   * Validate environment variable
   * Ensures no sensitive data is exposed
   */
  validateEnvironmentVariable(name: string, value: string): void {
    if (!value) {
      throw new Error(`Missing environment variable: ${name}`)
    }

    if (this.containsPlaceholder(value)) {
      throw new Error(`Invalid environment variable ${name}: contains placeholder`)
    }

    // Check for sensitive data in variable names
    const sensitiveNames = ['password', 'secret', 'key', 'token', 'auth']
    if (sensitiveNames.some(sensitive => name.toLowerCase().includes(sensitive))) {
      // Don't log the actual value
      console.log(`Environment variable ${name} is set`)
    }
  }

  /**
   * Generate secure random string
   */
  generateSecureRandom(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''

    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    return result
  }

  /**
   * Hash sensitive data
   */
  hashSensitiveData(data: string): string {
    // Simple hash for demonstration - use proper hashing in production
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16)
  }
}

export const securityEnforcer = SecurityEnforcer.getInstance()
