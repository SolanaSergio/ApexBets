// Global type definitions for Project Apex

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  success: boolean
  timestamp?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CacheStats {
  hitRate: number
  hits: number
  misses: number
  sets: number
  deletes: number
  totalEntries: number
  totalSize: number
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  uptime: number
  version: string
  environment?: {
    configured: boolean
    missingKeys: string[]
    invalidKeys: string[]
    recommendations: string[]
  }
  services?: Record<string, { status: string }>
  cache?: CacheStats
  system?: {
    nodeVersion: string
    platform: string
    memory: NodeJS.MemoryUsage
    cpuUsage: NodeJS.CpuUsage
  }
}

// Make sure to export other common types as needed
export * from './sports'
