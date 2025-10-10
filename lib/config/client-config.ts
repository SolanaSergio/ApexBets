/**
 * CLIENT-SIDE CONFIGURATION
 * Configuration that can be safely used in client components
 * Now uses dynamic configuration loaded from database
 */

import { dynamicClientConfig } from './dynamic-client-config'

// Static configuration that doesn't change
export const STATIC_CONFIG = {
  // API Configuration
  API_BASE_URL: (typeof process.env.NEXT_PUBLIC_API_URL === 'string' && (process.env.NEXT_PUBLIC_API_URL as string).trim().length > 0)
    ? (process.env.NEXT_PUBLIC_API_URL as string)
    : '',
  
  // Pagination
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
  },
  
  // Sports Configuration (dynamic; populated at runtime via services)
  SPORTS: {
    SUPPORTED: [] as string[],
    DEFAULT: '' as string,
  },
  
  // Feature Flags
  FEATURES: {
    ENABLE_REAL_TIME_UPDATES: true,
    ENABLE_CACHING: true,
    ENABLE_ERROR_BOUNDARIES: true,
    ENABLE_LOADING_STATES: true,
  }
} as const

// Dynamic configuration loaded from database
export const getDynamicConfig = async () => {
  return await dynamicClientConfig.getConfig()
}

// Legacy export for backward compatibility (deprecated)
export const CLIENT_CONFIG = {
  ...STATIC_CONFIG,
  // These will be replaced by dynamic configuration
  CACHE_TTL: {
    GAMES: 2 * 60 * 1000, // Will be replaced by dynamic config
    TEAMS: 5 * 60 * 1000, // Will be replaced by dynamic config
    PLAYERS: 5 * 60 * 1000, // Will be replaced by dynamic config
    HEALTH: 30 * 1000, // Will be replaced by dynamic config
  },
  UI: {
    REFRESH_INTERVAL: 30000, // Will be replaced by dynamic config
    DEBOUNCE_DELAY: 300,
    ANIMATION_DURATION: 200,
  },
  ERROR: {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    TIMEOUT: 10000,
  }
} as const

export type ClientConfig = typeof STATIC_CONFIG
