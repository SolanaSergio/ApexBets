/**
 * SERVICE REGISTRY
 * Dynamic service registration and initialization
 */

import { serviceFactory } from './service-factory'
import { SportConfigManager } from './sport-config'

// Import all sport services dynamically
import { BasketballService } from '../sports/basketball/basketball-service'
import { SoccerService } from '../sports/soccer/soccer-service'
import { FootballService } from '../sports/football/football-service'
import { BaseballService } from '../sports/baseball/baseball-service'
import { HockeyService } from '../sports/hockey/hockey-service'

export class ServiceRegistry {
  private static initialized = false
  private static serviceMap = new Map<string, new (league: string) => any>()

  /**
   * Initialize all sport services
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Initialize sport configuration first
      await SportConfigManager.initialize()

      // Register all available sport services
      this.registerSportServices()

      // Register services with the factory
      for (const [sport, serviceClass] of this.serviceMap.entries()) {
        serviceFactory.registerService(sport, serviceClass)
      }

      this.initialized = true
      console.log('Service registry initialized with sports:', Array.from(this.serviceMap.keys()))
    } catch (error) {
      console.error('Failed to initialize service registry:', error)
      throw error
    }
  }

  /**
   * Initialize synchronously for React components
   */
  static initializeSync(): void {
    if (this.initialized) return

    try {
      // Initialize sport configuration synchronously
      SportConfigManager.initializeSync()

      // Register all available sport services
      this.registerSportServices()

      // Register services with the factory
      for (const [sport, serviceClass] of this.serviceMap.entries()) {
        serviceFactory.registerService(sport, serviceClass)
      }

      this.initialized = true
      console.log('Service registry initialized synchronously with sports:', Array.from(this.serviceMap.keys()))
    } catch (error) {
      console.error('Failed to initialize service registry synchronously:', error)
      // Don't throw, just log the error
    }
  }

  /**
   * Register all sport services
   */
  private static registerSportServices(): void {
    // Get supported sports from environment or use defaults
    const supportedSports = process.env.SUPPORTED_SPORTS?.split(',') || 
      ['basketball', 'soccer', 'football', 'baseball', 'hockey']

    // Register basketball service
    if (supportedSports.includes('basketball')) {
      this.serviceMap.set('basketball', BasketballService)
    }

    // Register soccer service
    if (supportedSports.includes('soccer')) {
      this.serviceMap.set('soccer', SoccerService)
    }

    // Register football service
    if (supportedSports.includes('football')) {
      this.serviceMap.set('football', FootballService)
    }

    // Register baseball service
    if (supportedSports.includes('baseball')) {
      this.serviceMap.set('baseball', BaseballService)
    }

    // Register hockey service
    if (supportedSports.includes('hockey')) {
      this.serviceMap.set('hockey', HockeyService)
    }
  }

  /**
   * Get all registered sports
   */
  static getRegisteredSports(): string[] {
    if (!this.initialized) {
      this.initializeSync()
    }
    return Array.from(this.serviceMap.keys())
  }

  /**
   * Check if a sport is registered
   */
  static isSportRegistered(sport: string): boolean {
    if (!this.initialized) {
      this.initializeSync()
    }
    return this.serviceMap.has(sport)
  }

  /**
   * Get service class for a sport
   */
  static getServiceClass(sport: string): (new (league: string) => any) | null {
    if (!this.initialized) {
      this.initializeSync()
    }
    return this.serviceMap.get(sport) || null
  }

  /**
   * Register a custom sport service
   */
  static registerCustomService(sport: string, serviceClass: new (league: string) => any): void {
    this.serviceMap.set(sport, serviceClass)
    serviceFactory.registerService(sport, serviceClass)
  }

  /**
   * Get initialization status
   */
  static isInitialized(): boolean {
    return this.initialized
  }
}

// Note: Service registry should be initialized explicitly when needed
// Auto-initialization removed to prevent build-time execution
