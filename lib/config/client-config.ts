/**
 * CLIENT-SIDE CONFIGURATION
 * Configuration that can be safely used in client components
 */

export const CLIENT_CONFIG = {
  // API Configuration
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
  
  // Cache Configuration
  CACHE_TTL: {
    GAMES: 2 * 60 * 1000, // 2 minutes
    TEAMS: 5 * 60 * 1000, // 5 minutes
    PLAYERS: 5 * 60 * 1000, // 5 minutes
    HEALTH: 30 * 1000, // 30 seconds
  },
  
  // UI Configuration
  UI: {
    REFRESH_INTERVAL: 30000, // 30 seconds
    DEBOUNCE_DELAY: 300, // 300ms
    ANIMATION_DURATION: 200, // 200ms
  },
  
  // Error Handling
  ERROR: {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000, // 1 second
    TIMEOUT: 10000, // 10 seconds
  },
  
  // Pagination
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
  },
  
  // Sports Configuration
  SPORTS: {
    SUPPORTED: ['basketball', 'football', 'soccer', 'baseball', 'hockey'],
    DEFAULT: 'basketball',
  },
  
  // Feature Flags
  FEATURES: {
    ENABLE_REAL_TIME_UPDATES: true,
    ENABLE_CACHING: true,
    ENABLE_ERROR_BOUNDARIES: true,
    ENABLE_LOADING_STATES: true,
  }
} as const

export type ClientConfig = typeof CLIENT_CONFIG
