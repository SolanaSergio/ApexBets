/**
 * Structured Logger Service - Production Ready
 * Provides consistent logging across the application with production safety
 */

export interface LogContext {
  [key: string]: any
}

export interface LogEntry {
  timestamp: string
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  context?: LogContext
  service?: string
  requestId?: string
}

export class StructuredLogger {
  private static instance: StructuredLogger
  private logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info'
  private isProduction: boolean = false

  public static getInstance(): StructuredLogger {
    if (!StructuredLogger.instance) {
      StructuredLogger.instance = new StructuredLogger()
    }
    return StructuredLogger.instance
  }

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production'
    
    // Set log level based on environment - reduce verbosity in production
    this.logLevel = (process.env.LOG_LEVEL as any) || 
      (this.isProduction ? 'warn' : 'info')
  }

  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error']
    const currentLevelIndex = levels.indexOf(this.logLevel)
    const messageLevelIndex = levels.indexOf(level)
    return messageLevelIndex >= currentLevelIndex
  }

  private sanitizeContext(context?: LogContext): LogContext | undefined {
    if (!context || !this.isProduction) {
      return context
    }

    // Remove sensitive information in production
    const sanitized = { ...context }
    
    // Remove sensitive fields
    const sensitiveFields = [
      'password', 'token', 'key', 'secret', 'auth', 'authorization',
      'cookie', 'session', 'jwt', 'api_key', 'apiKey', 'access_token',
      'refresh_token', 'client_secret', 'private_key'
    ]

    sensitiveFields.forEach(field => {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]'
      }
    })

    // Remove stack traces in production
    if ('stack' in sanitized) {
      delete sanitized.stack
    }

    // Truncate long strings
    Object.keys(sanitized).forEach(key => {
      const value = sanitized[key]
      if (typeof value === 'string' && value.length > 1000) {
        sanitized[key] = value.substring(0, 1000) + '... [TRUNCATED]'
      }
    })

    return sanitized
  }

  private formatLog(
    level: string,
    message: string,
    context?: LogContext,
    service?: string
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: level as 'debug' | 'info' | 'warn' | 'error',
      message,
    }
    
    if (context !== undefined) {
      const sanitizedContext = this.sanitizeContext(context)
      if (sanitizedContext !== undefined) {
        entry.context = sanitizedContext
      }
    }
    
    if (service !== undefined) {
      entry.service = service
    }
    
    return entry
  }

  private output(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return

    const logMessage = {
      ...entry,
      ...(entry.context && { ...entry.context }),
    }

    switch (entry.level) {
      case 'debug':
        console.debug(JSON.stringify(logMessage))
        break
      case 'info':
        console.info(JSON.stringify(logMessage))
        break
      case 'warn':
        console.warn(JSON.stringify(logMessage))
        break
      case 'error':
        console.error(JSON.stringify(logMessage))
        break
    }
  }

  debug(message: string, context?: LogContext, service?: string): void {
    this.output(this.formatLog('debug', message, context, service))
  }

  info(message: string, context?: LogContext, service?: string): void {
    this.output(this.formatLog('info', message, context, service))
  }

  warn(message: string, context?: LogContext, service?: string): void {
    this.output(this.formatLog('warn', message, context, service))
  }

  error(message: string, context?: LogContext, service?: string): void {
    this.output(this.formatLog('error', message, context, service))
  }

  // Business/event logging used by some services
  logBusinessEvent(event: string, context?: LogContext): void {
    this.info(`BusinessEvent:${event}`, context, 'business')
  }

  // Convenience methods for common patterns
  apiCall(
    method: string,
    endpoint: string,
    status: number,
    duration: number,
    context?: LogContext
  ): void {
    this.info(
      `API ${method} ${endpoint}`,
      {
        method,
        endpoint,
        status,
        duration,
        ...context,
      },
      'api'
    )
  }

  databaseQuery(query: string, duration: number, rowCount?: number, context?: LogContext): void {
    this.debug(
      `Database query executed`,
      {
        query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
        duration,
        rowCount,
        ...context,
      },
      'database'
    )
  }

  cacheHit(key: string, context?: LogContext): void {
    this.debug(`Cache hit`, { key, ...context }, 'cache')
  }

  cacheMiss(key: string, context?: LogContext): void {
    this.debug(`Cache miss`, { key, ...context }, 'cache')
  }

  rateLimitExceeded(identifier: string, limit: number, context?: LogContext): void {
    this.warn(
      `Rate limit exceeded`,
      {
        identifier,
        limit,
        ...context,
      },
      'rate-limiter'
    )
  }

  serviceError(service: string, error: Error, context?: LogContext): void {
    this.error(
      `Service error in ${service}`,
      {
        service,
        error: error.message,
        ...(this.isProduction ? {} : { stack: error.stack }),
        ...context,
      },
      service
    )
  }

  performanceMetric(metric: string, value: number, unit: string, context?: LogContext): void {
    this.info(
      `Performance metric`,
      {
        metric,
        value,
        unit,
        ...context,
      },
      'performance'
    )
  }

  // Set log level at runtime
  setLogLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
    this.logLevel = level
  }

  // Get current log level
  getLogLevel(): string {
    return this.logLevel
  }

  // Check if production mode
  isProductionMode(): boolean {
    return this.isProduction
  }
}

export const structuredLogger = StructuredLogger.getInstance()
