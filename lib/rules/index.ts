/**
 * Rules Index - Export all rule enforcers
 * Use these rules throughout the application
 */

export { environmentRules, EnvironmentRules } from './environment-rules'
export { apiRateLimiter, ApiRateLimiter } from './api-rate-limiter'
export { dataValidator, DataValidator } from './data-validator'
export { securityEnforcer, SecurityEnforcer } from './security-enforcer'

/**
 * Initialize all rules on application startup
 * Call this in your main application file
 */
export function initializeRules(): void {
  try {
    // Enforce environment rules first
    environmentRules.enforceEnvironmentRules()
    
    console.log('✅ All rules initialized successfully')
  } catch (error) {
    console.error('❌ Rules initialization failed:', error.message)
    process.exit(1)
  }
}

/**
 * Get rules status
 */
export function getRulesStatus() {
  return {
    environment: environmentRules.isConfigured(),
    environmentErrors: environmentRules.getValidationErrors()
  }
}
