/**
 * API Cost Tracker
 * Monitors API usage, costs, and provides budget alerts
 * Rate limits are managed by EnhancedRateLimiter
 */

import { enhancedRateLimiter } from './enhanced-rate-limiter'

export interface APIProvider {
  name: string
  costPerRequest: number
  freeRequests: number
  isActive: boolean
}

export interface APIUsage {
  provider: string
  endpoint: string
  timestamp: string
  responseTime: number
  success: boolean
  cached: boolean
  cost: number
  requestSize?: number | undefined
  responseSize?: number | undefined
}

export interface APIMetrics {
  provider: string
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  cachedRequests: number
  totalCost: number
  averageResponseTime: number
  lastRequestTime: string
  dailyUsage: number
  monthlyUsage: number
  remainingFreeRequests: number
}

export interface BudgetAlert {
  id: string
  provider: string
  alertType: 'BUDGET_THRESHOLD' | 'FREE_TIER_EXHAUSTED' | 'RATE_LIMIT_APPROACHING'
  threshold: number
  currentValue: number
  message: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  timestamp: string
  acknowledged: boolean
}

export class APICostTracker {
  private providers: Map<string, APIProvider> = new Map()
  private usage: APIUsage[] = []
  private metrics: Map<string, APIMetrics> = new Map()
  private alerts: BudgetAlert[] = []
  private budgetThresholds = {
    daily: 10.0, // $10 daily limit
    monthly: 100.0, // $100 monthly limit
    warning: 0.8, // 80% threshold for warnings
    critical: 0.95, // 95% threshold for critical alerts
  }

  constructor() {
    this.initializeProviders()
    this.loadPersistedData()
  }

  private initializeProviders(): void {
    const providers: APIProvider[] = [
      {
        name: 'api-sports',
        costPerRequest: 0.01,
        freeRequests: 100,
        isActive: true,
      },
      {
        name: 'odds-api',
        costPerRequest: 0.02,
        freeRequests: 500,
        isActive: true,
      },
      {
        name: 'thesportsdb',
        costPerRequest: 0,
        freeRequests: Number.MAX_SAFE_INTEGER,
        isActive: true,
      },
      {
        name: 'espn',
        costPerRequest: 0,
        freeRequests: Number.MAX_SAFE_INTEGER,
        isActive: true,
      },
      {
        name: 'balldontlie',
        costPerRequest: 0,
        freeRequests: Number.MAX_SAFE_INTEGER,
        isActive: true,
      },
      {
        name: 'nba-stats',
        costPerRequest: 0,
        freeRequests: Number.MAX_SAFE_INTEGER,
        isActive: true,
      },
      {
        name: 'mlb-stats',
        costPerRequest: 0,
        freeRequests: Number.MAX_SAFE_INTEGER,
        isActive: true,
      },
    ]

    providers.forEach(provider => {
      this.providers.set(provider.name, provider)
      if (!this.metrics.has(provider.name)) {
        this.metrics.set(provider.name, {
          provider: provider.name,
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          cachedRequests: 0,
          totalCost: 0,
          averageResponseTime: 0,
          lastRequestTime: '',
          dailyUsage: 0,
          monthlyUsage: 0,
          remainingFreeRequests: provider.freeRequests,
        })
      }
    })
  }

  private loadPersistedData(): void {
    // In production, load from database or persistent storage
    // For now, keep in memory
  }

  private persistData(): void {
    // In production, save to database
    // For now, just log important metrics
    console.log('API Cost Tracker - Current Metrics:', Object.fromEntries(this.metrics))
  }

  trackRequest(
    provider: string,
    endpoint: string,
    responseTime: number,
    success: boolean,
    cached: boolean = false,
    requestSize?: number,
    responseSize?: number
  ): void {
    const providerConfig = this.providers.get(provider)
    if (!providerConfig) {
      console.warn(`Unknown API provider: ${provider}`)
      return
    }

    const cost = cached ? 0 : providerConfig.costPerRequest
    const usage: APIUsage = {
      provider,
      endpoint,
      timestamp: new Date().toISOString(),
      responseTime,
      success,
      cached,
      cost,
      requestSize,
      responseSize,
    }

    this.usage.push(usage)
    this.updateMetrics(provider, usage)
    this.checkBudgetThresholds(provider)
    this.persistData()
  }

  private updateMetrics(provider: string, usage: APIUsage): void {
    const metrics = this.metrics.get(provider)
    if (!metrics) return

    metrics.totalRequests++
    if (usage.success) {
      metrics.successfulRequests++
    } else {
      metrics.failedRequests++
    }

    if (usage.cached) {
      metrics.cachedRequests++
    }

    metrics.totalCost += usage.cost
    metrics.lastRequestTime = usage.timestamp

    // Update average response time
    const totalResponseTime =
      metrics.averageResponseTime * (metrics.totalRequests - 1) + usage.responseTime
    metrics.averageResponseTime = totalResponseTime / metrics.totalRequests

    // Update daily/monthly usage
    const today = new Date().toISOString().split('T')[0]
    const currentMonth = new Date().toISOString().substring(0, 7)

    const todaysUsage = this.usage.filter(
      u => u.provider === provider && u.timestamp.startsWith(today) && !u.cached
    ).length

    const monthlyUsage = this.usage.filter(
      u => u.provider === provider && u.timestamp.startsWith(currentMonth) && !u.cached
    ).length

    metrics.dailyUsage = todaysUsage
    metrics.monthlyUsage = monthlyUsage

    // Update remaining free requests
    const providerConfig = this.providers.get(provider)
    if (providerConfig) {
      metrics.remainingFreeRequests = Math.max(0, providerConfig.freeRequests - monthlyUsage)
    }
  }

  private checkBudgetThresholds(provider: string): void {
    const metrics = this.metrics.get(provider)
    if (!metrics) return

    const today = new Date().toISOString().split('T')[0]
    const currentMonth = new Date().toISOString().substring(0, 7)

    // Calculate daily and monthly costs
    const dailyCost = this.usage
      .filter(u => u.provider === provider && u.timestamp.startsWith(today))
      .reduce((sum, u) => sum + u.cost, 0)

    const monthlyCost = this.usage
      .filter(u => u.provider === provider && u.timestamp.startsWith(currentMonth))
      .reduce((sum, u) => sum + u.cost, 0)

    // Check daily budget
    if (dailyCost >= this.budgetThresholds.daily * this.budgetThresholds.critical) {
      this.createAlert(
        provider,
        'BUDGET_THRESHOLD',
        'CRITICAL',
        `Daily budget exceeded: $${dailyCost.toFixed(2)} / $${this.budgetThresholds.daily}`
      )
    } else if (dailyCost >= this.budgetThresholds.daily * this.budgetThresholds.warning) {
      this.createAlert(
        provider,
        'BUDGET_THRESHOLD',
        'HIGH',
        `Daily budget warning: $${dailyCost.toFixed(2)} / $${this.budgetThresholds.daily}`
      )
    }

    // Check monthly budget
    if (monthlyCost >= this.budgetThresholds.monthly * this.budgetThresholds.critical) {
      this.createAlert(
        provider,
        'BUDGET_THRESHOLD',
        'CRITICAL',
        `Monthly budget exceeded: $${monthlyCost.toFixed(2)} / $${this.budgetThresholds.monthly}`
      )
    } else if (monthlyCost >= this.budgetThresholds.monthly * this.budgetThresholds.warning) {
      this.createAlert(
        provider,
        'BUDGET_THRESHOLD',
        'HIGH',
        `Monthly budget warning: $${monthlyCost.toFixed(2)} / $${this.budgetThresholds.monthly}`
      )
    }

    // Check free tier exhaustion
    if (metrics.remainingFreeRequests <= 0) {
      this.createAlert(
        provider,
        'FREE_TIER_EXHAUSTED',
        'CRITICAL',
        `Free tier exhausted for ${provider}. All requests will be charged.`
      )
    } else if (metrics.remainingFreeRequests <= 10) {
      this.createAlert(
        provider,
        'FREE_TIER_EXHAUSTED',
        'HIGH',
        `Free tier nearly exhausted: ${metrics.remainingFreeRequests} requests remaining`
      )
    }

    // Check rate limit approaching
    const providerConfig = this.providers.get(provider)
    if (providerConfig) {
      // Get rate limits from EnhancedRateLimiter instead of local config
      const rateLimitConfig = enhancedRateLimiter.getConfig(provider)
      if (rateLimitConfig) {
        const dailyRatio = metrics.dailyUsage / rateLimitConfig.requestsPerDay
        if (dailyRatio >= 0.9) {
          this.createAlert(
            provider,
            'RATE_LIMIT_APPROACHING',
            'HIGH',
            `Rate limit approaching: ${metrics.dailyUsage} / ${rateLimitConfig.requestsPerDay} daily requests`
          )
        }
      }
    }
  }

  private createAlert(
    provider: string,
    alertType: BudgetAlert['alertType'],
    severity: BudgetAlert['severity'],
    message: string
  ): void {
    // Avoid duplicate alerts
    const existingAlert = this.alerts.find(
      a =>
        a.provider === provider &&
        a.alertType === alertType &&
        !a.acknowledged &&
        Date.now() - new Date(a.timestamp).getTime() < 3600000 // 1 hour
    )

    if (existingAlert) return

    const alert: BudgetAlert = {
      id: `${provider}-${alertType}-${Date.now()}`,
      provider,
      alertType,
      threshold: 0,
      currentValue: 0,
      message,
      severity,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    }

    this.alerts.push(alert)
    console.warn(`API Cost Alert [${severity}]: ${message}`)
  }

  getMetrics(provider?: string): APIMetrics[] {
    if (provider) {
      const metrics = this.metrics.get(provider)
      return metrics ? [metrics] : []
    }
    return Array.from(this.metrics.values())
  }

  getAlerts(acknowledged: boolean = false): BudgetAlert[] {
    return this.alerts.filter(alert => alert.acknowledged === acknowledged)
  }

  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.acknowledged = true
    }
  }

  getCostReport(timeframe: 'daily' | 'weekly' | 'monthly' = 'monthly'): {
    totalCost: number
    requestCount: number
    cacheHitRate: number
    topProviders: Array<{ provider: string; cost: number; requests: number }>
    recommendations: string[]
  } {
    const now = new Date()
    let startDate: Date

    switch (timeframe) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
    }

    const relevantUsage = this.usage.filter(u => new Date(u.timestamp) >= startDate)

    const totalCost = relevantUsage.reduce((sum, u) => sum + u.cost, 0)
    const requestCount = relevantUsage.length
    const cachedRequests = relevantUsage.filter(u => u.cached).length
    const cacheHitRate = requestCount > 0 ? cachedRequests / requestCount : 0

    // Group by provider
    const providerStats = new Map<string, { cost: number; requests: number }>()
    relevantUsage.forEach(u => {
      const stats = providerStats.get(u.provider) || { cost: 0, requests: 0 }
      stats.cost += u.cost
      stats.requests += 1
      providerStats.set(u.provider, stats)
    })

    const topProviders = Array.from(providerStats.entries())
      .map(([provider, stats]) => ({ provider, ...stats }))
      .sort((a, b) => b.cost - a.cost)

    // Generate recommendations
    const recommendations: string[] = []

    if (cacheHitRate < 0.7) {
      recommendations.push('Consider increasing cache TTL to improve cache hit rate')
    }

    if (totalCost > this.budgetThresholds.daily) {
      recommendations.push('Daily budget exceeded - consider using free APIs more')
    }

    const freeProviders = topProviders.filter(p => {
      const config = this.providers.get(p.provider)
      return config?.costPerRequest === 0
    })

    if (freeProviders.length / topProviders.length < 0.6) {
      recommendations.push('Increase usage of free APIs (ESPN, TheSportsDB, BallDontLie)')
    }

    return {
      totalCost,
      requestCount,
      cacheHitRate,
      topProviders,
      recommendations,
    }
  }

  estimateMonthlyBudget(): number {
    const currentMonth = new Date().toISOString().substring(0, 7)
    const monthlyUsage = this.usage.filter(u => u.timestamp.startsWith(currentMonth))
    const currentCost = monthlyUsage.reduce((sum, u) => sum + u.cost, 0)

    const daysInMonth = new Date().getDate()
    const totalDaysInMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0
    ).getDate()

    return (currentCost / daysInMonth) * totalDaysInMonth
  }

  getProviderRecommendation(sport: string, dataType: string): string[] {
    // Recommend providers based on cost, reliability, and data coverage
    const recommendations: string[] = []

    if (sport === 'basketball' && dataType === 'games') {
      recommendations.push('espn', 'balldontlie', 'thesportsdb', 'api-sports')
    } else if (sport === 'football' && dataType === 'games') {
      recommendations.push('espn', 'thesportsdb', 'api-sports')
    } else if (dataType === 'odds') {
      recommendations.push('odds-api') // Only provider for odds
    } else {
      recommendations.push('thesportsdb', 'espn', 'api-sports')
    }

    // Filter by available quota and active status
    return recommendations.filter(provider => {
      const config = this.providers.get(provider)
      const metrics = this.metrics.get(provider)
      return config?.isActive && metrics && metrics.remainingFreeRequests > 0
    })
  }
}

export const apiCostTracker = new APICostTracker()
