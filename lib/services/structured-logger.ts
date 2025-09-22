/**
 * Structured Logger Service
 * Provides consistent logging across the application
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

  public static getInstance(): StructuredLogger {
    if (!StructuredLogger.instance) {
      StructuredLogger.instance = new StructuredLogger()
    }
    return StructuredLogger.instance
  }

  constructor() {
    this.logLevel = (process.env.LOG_LEVEL as any) || 'info'
  }

  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error']
    const currentLevelIndex = levels.indexOf(this.logLevel)
    const messageLevelIndex = levels.indexOf(level)
    return messageLevelIndex >= currentLevelIndex
  }

  private formatLog(level: string, message: string, context?: LogContext, service?: string): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level: level as any,
      message,
      ...(context && { context }),
      ...(service && { service })
    }
  }

  private output(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return

    const logMessage = {
      ...entry,
      ...(entry.context && { ...entry.context })
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
  apiCall(method: string, endpoint: string, status: number, duration: number, context?: LogContext): void {
    this.info(`API ${method} ${endpoint}`, {
      method,
      endpoint,
      status,
      duration,
      ...context
    }, 'api')
  }

  databaseQuery(query: string, duration: number, rowCount?: number, context?: LogContext): void {
    this.debug(`Database query executed`, {
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      duration,
      rowCount,
      ...context
    }, 'database')
  }

  cacheHit(key: string, context?: LogContext): void {
    this.debug(`Cache hit`, { key, ...context }, 'cache')
  }

  cacheMiss(key: string, context?: LogContext): void {
    this.debug(`Cache miss`, { key, ...context }, 'cache')
  }

  rateLimitExceeded(identifier: string, limit: number, context?: LogContext): void {
    this.warn(`Rate limit exceeded`, {
      identifier,
      limit,
      ...context
    }, 'rate-limiter')
  }

  serviceError(service: string, error: Error, context?: LogContext): void {
    this.error(`Service error in ${service}`, {
      service,
      error: error.message,
      stack: error.stack,
      ...context
    }, service)
  }

  performanceMetric(metric: string, value: number, unit: string, context?: LogContext): void {
    this.info(`Performance metric`, {
      metric,
      value,
      unit,
      ...context
    }, 'performance')
  }

  // Set log level at runtime
  setLogLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
    this.logLevel = level
  }

  // Get current log level
  getLogLevel(): string {
    return this.logLevel
  }
}

export const structuredLogger = StructuredLogger.getInstance()
