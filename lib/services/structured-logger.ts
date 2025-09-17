/**
 * Structured Logger
 * Centralized logging with structured data, metrics collection, and external service integration
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical'

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  service: string
  component?: string
  operation?: string
  context?: Record<string, any> | undefined
  metadata?: {
    requestId?: string
    userId?: string
    sessionId?: string
    userAgent?: string
    ip?: string
    endpoint?: string
    method?: string
    statusCode?: number
    responseTime?: number
    error?: {
      name: string
      message: string
      stack?: string
      code?: string
    }
  } | undefined
  tags?: string[]
  metrics?: {
    name: string
    value: number
    unit: string
    type: 'counter' | 'gauge' | 'histogram' | 'timer'
  }[]
}

export interface LoggerConfig {
  service: string
  environment: 'development' | 'staging' | 'production'
  minLevel: LogLevel
  enableConsole: boolean
  enableFile: boolean
  enableExternal: boolean
  externalServices?: {
    sentry?: {
      dsn: string
      environment: string
    }
    datadog?: {
      apiKey: string
      service: string
    }
    cloudwatch?: {
      logGroup: string
      logStream: string
    }
  }
}

export class StructuredLogger {
  private config: LoggerConfig
  private logBuffer: LogEntry[] = []
  private metricsBuffer: Map<string, number> = new Map()
  private flushInterval: NodeJS.Timeout | null = null

  private readonly levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    critical: 4
  }

  constructor(config: LoggerConfig) {
    this.config = config
    this.startFlushInterval()
  }

  debug(message: string, context?: Record<string, any>, metadata?: LogEntry['metadata']): void {
    this.log('debug', message, context, metadata)
  }

  info(message: string, context?: Record<string, any>, metadata?: LogEntry['metadata']): void {
    this.log('info', message, context, metadata)
  }

  warn(message: string, context?: Record<string, any>, metadata?: LogEntry['metadata']): void {
    this.log('warn', message, context, metadata)
  }

  error(message: string, error?: Error, context?: Record<string, any>, metadata?: LogEntry['metadata']): void {
    const errorContext = error ? {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code
      }
    } : undefined

    this.log('error', message, { ...context, ...errorContext }, metadata)
  }

  critical(message: string, error?: Error, context?: Record<string, any>, metadata?: LogEntry['metadata']): void {
    const errorContext = error ? {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code
      }
    } : undefined

    this.log('critical', message, { ...context, ...errorContext }, metadata)
  }

  // API-specific logging methods
  logApiRequest(
    provider: string,
    endpoint: string,
    method: string,
    responseTime: number,
    statusCode: number,
    success: boolean,
    cached: boolean = false,
    cost: number = 0
  ): void {
    this.info(`API Request: ${provider}`, {
      provider,
      endpoint,
      method,
      responseTime,
      statusCode,
      success,
      cached,
      cost
    }, {
      endpoint,
      method,
      statusCode,
      responseTime
    })

    // Collect metrics
    this.recordMetric(`api.requests.total`, 1, 'counter')
    this.recordMetric(`api.requests.${provider}`, 1, 'counter')
    this.recordMetric(`api.response_time.${provider}`, responseTime, 'histogram')
    
    if (!success) {
      this.recordMetric(`api.errors.total`, 1, 'counter')
      this.recordMetric(`api.errors.${provider}`, 1, 'counter')
    }

    if (cached) {
      this.recordMetric(`api.cache.hits`, 1, 'counter')
    } else {
      this.recordMetric(`api.cache.misses`, 1, 'counter')
    }

    if (cost > 0) {
      this.recordMetric(`api.cost.total`, cost, 'counter')
      this.recordMetric(`api.cost.${provider}`, cost, 'counter')
    }
  }

  logCacheOperation(
    operation: 'get' | 'set' | 'delete' | 'clear',
    key: string,
    hit: boolean = false,
    size?: number,
    ttl?: number
  ): void {
    this.debug(`Cache ${operation}: ${key}`, {
      operation,
      key,
      hit,
      size,
      ttl
    })

    this.recordMetric(`cache.operations.${operation}`, 1, 'counter')
    
    if (operation === 'get') {
      if (hit) {
        this.recordMetric('cache.hits', 1, 'counter')
      } else {
        this.recordMetric('cache.misses', 1, 'counter')
      }
    }

    if (size) {
      this.recordMetric(`cache.entry_size.${operation}`, size, 'histogram')
    }
  }

  logDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    success: boolean,
    rowCount?: number
  ): void {
    this.info(`Database ${operation}: ${table}`, {
      operation,
      table,
      duration,
      success,
      rowCount
    })

    this.recordMetric(`database.operations.${operation}`, 1, 'counter')
    this.recordMetric(`database.duration.${operation}`, duration, 'histogram')
    
    if (!success) {
      this.recordMetric(`database.errors.${operation}`, 1, 'counter')
    }

    if (rowCount) {
      this.recordMetric(`database.rows.${operation}`, rowCount, 'gauge')
    }
  }

  logUserAction(
    userId: string,
    action: string,
    details?: Record<string, any>,
    metadata?: LogEntry['metadata']
  ): void {
    this.info(`User action: ${action}`, {
      userId,
      action,
      ...details
    }, {
      ...metadata,
      userId
    })

    this.recordMetric(`user.actions.${action}`, 1, 'counter')
  }

  logPerformanceMetric(
    name: string,
    value: number,
    unit: string = 'ms'
  ): void {
    this.debug(`Performance metric: ${name}`, {
      metric: name,
      value,
      unit
    })

    this.recordMetric(name, value, 'histogram')
  }

  logBusinessEvent(
    event: string,
    data: Record<string, any>
  ): void {
    this.info(`Business event: ${event}`, data, undefined)
    this.recordMetric(`business.events.${event}`, 1, 'counter')
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    metadata?: LogEntry['metadata']
  ): void {
    // Check if log level meets minimum threshold
    if (this.levelPriority[level] < this.levelPriority[this.config.minLevel]) {
      return
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.config.service,
      context: context || undefined,
      metadata,
      tags: []
    }

    // Add to buffer
    this.logBuffer.push(entry)

    // Immediate console output if enabled
    if (this.config.enableConsole) {
      this.outputToConsole(entry)
    }

    // Immediate external service notification for critical errors
    if (level === 'critical' && this.config.enableExternal) {
      this.sendToExternalServices([entry])
    }

    // Keep buffer size manageable
    if (this.logBuffer.length > 1000) {
      this.flush()
    }
  }

  private recordMetric(
    name: string,
    value: number,
    type: 'counter' | 'gauge' | 'histogram' | 'timer'
  ): void {
    const key = `${name}:${type}`
    
    if (type === 'counter' || type === 'gauge') {
      const current = this.metricsBuffer.get(key) || 0
      this.metricsBuffer.set(key, current + value)
    } else {
      // For histogram and timer, we might want to store raw values
      // For now, just store the latest value
      this.metricsBuffer.set(key, value)
    }
  }

  private outputToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toLocaleString()
    const levelColors: Record<LogLevel, string> = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m',  // Green
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m', // Red
      critical: '\x1b[35m' // Magenta
    }
    const reset = '\x1b[0m'
    const color = levelColors[entry.level]

    const logLine = `${color}[${timestamp}] ${entry.level.toUpperCase()} [${entry.service}]${reset} ${entry.message}`
    
    if (entry.level === 'error' || entry.level === 'critical') {
      console.error(logLine)
      if (entry.context?.error) {
        console.error('Error details:', entry.context.error)
      }
    } else if (entry.level === 'warn') {
      console.warn(logLine)
    } else {
      console.log(logLine)
    }

    // Show context in development
    if (this.config.environment === 'development' && entry.context) {
      console.log('Context:', JSON.stringify(entry.context, null, 2))
    }
  }

  private startFlushInterval(): void {
    // Flush logs every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flush()
    }, 30000)
  }

  private flush(): void {
    if (this.logBuffer.length === 0 && this.metricsBuffer.size === 0) {
      return
    }

    // Send to external services if enabled
    if (this.config.enableExternal && this.logBuffer.length > 0) {
      this.sendToExternalServices([...this.logBuffer])
    }

    // Send metrics
    if (this.metricsBuffer.size > 0) {
      this.sendMetrics()
    }

    // Clear buffers
    this.logBuffer.length = 0
    this.metricsBuffer.clear()
  }

  private async sendToExternalServices(entries: LogEntry[]): Promise<void> {
    const promises: Promise<void>[] = []

    // Sentry integration
    if (this.config.externalServices?.sentry) {
      promises.push(this.sendToSentry(entries))
    }

    // DataDog integration
    if (this.config.externalServices?.datadog) {
      promises.push(this.sendToDataDog(entries))
    }

    // CloudWatch integration
    if (this.config.externalServices?.cloudwatch) {
      promises.push(this.sendToCloudWatch(entries))
    }

    try {
      await Promise.all(promises)
    } catch (error) {
      console.error('Failed to send logs to external services:', error)
    }
  }

  private async sendToSentry(entries: LogEntry[]): Promise<void> {
    // In a real implementation, you would use @sentry/node
    // For now, we'll just simulate the structure
    const errorEntries = entries.filter(e => e.level === 'error' || e.level === 'critical')
    
    for (const entry of errorEntries) {
      try {
        // Simulate Sentry.captureException or Sentry.captureMessage
        console.log('Would send to Sentry:', {
          message: entry.message,
          level: entry.level,
          extra: entry.context,
          tags: entry.tags,
          user: { id: entry.metadata?.userId }
        })
      } catch (error) {
        console.error('Failed to send to Sentry:', error)
      }
    }
  }

  private async sendToDataDog(entries: LogEntry[]): Promise<void> {
    // In a real implementation, you would use DataDog API
    try {
      const payload = entries.map(entry => ({
        timestamp: entry.timestamp,
        level: entry.level,
        message: entry.message,
        service: entry.service,
        source: 'nodejs',
        tags: entry.tags?.join(','),
        attributes: entry.context
      }))

      console.log('Would send to DataDog:', payload.length, 'entries')
    } catch (error) {
      console.error('Failed to send to DataDog:', error)
    }
  }

  private async sendToCloudWatch(entries: LogEntry[]): Promise<void> {
    // In a real implementation, you would use AWS SDK
    try {
      const logEvents = entries.map(entry => ({
        timestamp: new Date(entry.timestamp).getTime(),
        message: JSON.stringify({
          level: entry.level,
          message: entry.message,
          service: entry.service,
          context: entry.context,
          metadata: entry.metadata
        })
      }))

      console.log('Would send to CloudWatch:', logEvents.length, 'events')
    } catch (error) {
      console.error('Failed to send to CloudWatch:', error)
    }
  }

  private sendMetrics(): void {
    // In a real implementation, you would send to metrics services
    console.log('Metrics snapshot:', Object.fromEntries(this.metricsBuffer))
  }

  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metricsBuffer)
  }

  getRecentLogs(limit: number = 100): LogEntry[] {
    return this.logBuffer.slice(-limit)
  }

  // Cleanup method
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    this.flush() // Final flush
  }
}

// Create singleton logger
export const structuredLogger = new StructuredLogger({
  service: 'project-apex',
  environment: (process.env.NODE_ENV as any) || 'development',
  minLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  enableConsole: true,
  enableFile: false,
  enableExternal: process.env.NODE_ENV === 'production',
  externalServices: {
    // Add your external service configurations here
    // sentry: {
    //   dsn: process.env.SENTRY_DSN,
    //   environment: process.env.NODE_ENV
    // }
  }
})

// Helper function for component-specific loggers
export function createComponentLogger(component: string): {
  debug: (message: string, context?: any) => void
  info: (message: string, context?: any) => void
  warn: (message: string, context?: any) => void
  error: (message: string, error?: Error, context?: any) => void
  critical: (message: string, error?: Error, context?: any) => void
} {
  return {
    debug: (message: string, context?: any) => 
      structuredLogger.debug(`[${component}] ${message}`, context),
    info: (message: string, context?: any) => 
      structuredLogger.info(`[${component}] ${message}`, context),
    warn: (message: string, context?: any) => 
      structuredLogger.warn(`[${component}] ${message}`, context),
    error: (message: string, error?: Error, context?: any) => 
      structuredLogger.error(`[${component}] ${message}`, error, context),
    critical: (message: string, error?: Error, context?: any) => 
      structuredLogger.critical(`[${component}] ${message}`, error, context)
  }
}
