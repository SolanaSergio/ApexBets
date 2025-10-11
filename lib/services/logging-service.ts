
import fs from 'fs'
import path from 'path'

class LoggingService {
  private static instance: LoggingService
  private logFilePath: string

  private constructor() {
    this.logFilePath = path.join(process.cwd(), 'logs', 'app.log')
  }

  static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService()
    }
    return LoggingService.instance
  }

  log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    const logMessage = `${new Date().toISOString()} [${level.toUpperCase()}] ${message}`
    const logData = data ? `
${JSON.stringify(data, null, 2)}` : ''

    fs.appendFile(this.logFilePath, `${logMessage}${logData}
`, (err) => {
      if (err) {
        console.error('Failed to write to log file:', err)
      }
    })
  }
}

export const loggingService = LoggingService.getInstance()
