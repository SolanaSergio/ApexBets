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
import { GenericSportService } from '../sports/generic/generic-sport-service'

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
    // Get supported sports from environment validator
    const { envValidator } = require('../../config/env-validator')
    const supportedSports = envValidator.getSupportedSports()
    
    if (supportedSports.length === 0) {
      throw new Error('No supported sports configured in environment')
    }

    // Register services for each supported sport
    supportedSports.forEach((sport: string) => {
      // Use specific service if available, otherwise use generic service
      const serviceClass = this.getServiceClassForSport(sport)
      this.serviceMap.set(sport, serviceClass)
    })
  }

  /**
   * Get the appropriate service class for a sport
   */
  private static getServiceClassForSport(sport: string): any {
    // Dynamic service mapping based on sport name
    const sportLower = sport.toLowerCase()
    
    // Try to match sport names dynamically
    if (sportLower.includes('basketball')) return BasketballService
    if (sportLower.includes('soccer')) return SoccerService
    if (sportLower.includes('football')) return FootballService
    if (sportLower.includes('baseball')) return BaseballService
    if (sportLower.includes('hockey')) return HockeyService
    
    // Fallback to generic service for unknown sports
    return GenericSportService
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
   * Get or create a service for any sport (including unknown ones)
   */
  static getOrCreateServiceClass(sport: string): (new (league: string) => any) {
    if (!this.initialized) {
      this.initializeSync()
    }

    // Return existing service if available
    if (this.serviceMap.has(sport)) {
      return this.serviceMap.get(sport)!
    }

    // For unknown sports, register and return GenericSportService
    console.log(`Registering generic service for unknown sport: ${sport}`)
    this.serviceMap.set(sport, GenericSportService)
    serviceFactory.registerService(sport, GenericSportService)

    return GenericSportService
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
