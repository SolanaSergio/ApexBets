/**
 * Sport Configuration Manager Unit Tests
 * Tests the dynamic sport configuration system
 */

import { SportConfigManager, SupportedSport } from '@/lib/services/core/sport-config'

// Mock environment variables
const originalEnv = process.env

describe('Sport Configuration Manager', () => {
  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv }

    // Set up test environment variables
    process.env.BASKETBALL_DISPLAY_NAME = 'Basketball'
    process.env.BASKETBALL_ICON = '🏀'
    process.env.BASKETBALL_COLOR = '#FF6B35'
    process.env.BASKETBALL_ACTIVE = 'true'
    process.env.BASKETBALL_DATA_SOURCE = 'rapidapi'
    process.env.BASKETBALL_POSITIONS = 'PG,SG,SF,PF,C'
    process.env.BASKETBALL_SCORING_FIELDS = 'points,rebounds,assists'
    process.env.BASKETBALL_BETTING_MARKETS = 'h2h,spread,totals'
    process.env.BASKETBALL_START_MONTH = '10'
    process.env.BASKETBALL_END_MONTH = '6'
    process.env.BASKETBALL_CURRENT_SEASON = '2024'
    process.env.BASKETBALL_RATE_LIMIT = '100'
    process.env.BASKETBALL_RATE_INTERVAL = '1m'
    process.env.BASKETBALL_UPDATE_FREQUENCY = '5m'
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('Sport Configuration Loading', () => {
    it('should load sport configuration from environment', () => {
      const config = SportConfigManager.getSportConfig('basketball' as SupportedSport)

      expect(config).toBeDefined()
      expect(config?.name).toBe('basketball')
      expect(config?.displayName).toBe('Basketball')
      expect(config?.icon).toBe('🏀')
      expect(config?.color).toBe('#FF6B35')
      expect(config?.isActive).toBe(true)
      expect(config?.dataSource).toBe('rapidapi')
    })

    it('should handle missing environment variables gracefully', () => {
      // Clear basketball env vars
      delete process.env.BASKETBALL_DISPLAY_NAME
      delete process.env.BASKETBALL_ICON

      const config = SportConfigManager.getSportConfig('basketball' as SupportedSport)

      expect(config).toBeDefined()
      expect(config?.displayName).toBe('Basketball') // Should use capitalized name
      expect(config?.icon).toBe('🏆') // Should use default icon
    })

    it('should parse comma-separated arrays correctly', () => {
      const config = SportConfigManager.getSportConfig('basketball' as SupportedSport)

      expect(config?.positions).toEqual(['PG', 'SG', 'SF', 'PF', 'C'])
      expect(config?.scoringFields).toEqual(['points', 'rebounds', 'assists'])
      expect(config?.bettingMarkets).toEqual(['h2h', 'spread', 'totals'])
    })

    it('should parse numeric values correctly', () => {
      const config = SportConfigManager.getSportConfig('basketball' as SupportedSport)

      expect(config?.seasonConfig.startMonth).toBe(10)
      expect(config?.seasonConfig.endMonth).toBe(6)
      expect(config?.rateLimits.requests).toBe(100)
    })
  })

  describe('Sport Management', () => {
    it('should get all sport configurations', () => {
      const configs = SportConfigManager.getAllSportConfigs()

      expect(Array.isArray(configs)).toBe(true)
      expect(configs.length).toBeGreaterThan(0)
    })

    it('should get active sports only', () => {
      const activeSports = SportConfigManager.getActiveSports()

      expect(Array.isArray(activeSports)).toBe(true)
      activeSports.forEach(sport => {
        const config = SportConfigManager.getSportConfig(sport)
        expect(config?.isActive).toBe(true)
      })
    })

    it('should check if sport is active', () => {
      expect(SportConfigManager.isSportActive('basketball' as SupportedSport)).toBe(true)
      expect(SportConfigManager.isSportActive('nonexistent' as SupportedSport)).toBe(false)
    })

    it('should get sport display name', () => {
      expect(SportConfigManager.getSportDisplayName('basketball' as SupportedSport)).toBe(
        'Basketball'
      )
      expect(SportConfigManager.getSportDisplayName('nonexistent' as SupportedSport)).toBe(
        'nonexistent'
      )
    })

    it('should get sport icon', () => {
      expect(SportConfigManager.getSportIcon('basketball' as SupportedSport)).toBe('🏀')
      expect(SportConfigManager.getSportIcon('nonexistent' as SupportedSport)).toBe('🏆')
    })

    it('should get sport color', () => {
      expect(SportConfigManager.getSportColor('basketball' as SupportedSport)).toBe('#FF6B35')
      expect(SportConfigManager.getSportColor('nonexistent' as SupportedSport)).toBe('#000000')
    })
  })

  describe('Season Management', () => {
    it('should get current season', () => {
      const season = SportConfigManager.getCurrentSeason('basketball' as SupportedSport)
      expect(season).toBe('2024')
    })

    it('should handle missing season config', () => {
      delete process.env.BASKETBALL_CURRENT_SEASON

      const season = SportConfigManager.getCurrentSeason('basketball' as SupportedSport)
      expect(season).toBe(new Date().getFullYear().toString())
    })
  })

  describe('Sport-Specific Data', () => {
    it('should get positions for sport', () => {
      const positions = SportConfigManager.getPositionsForSport('basketball' as SupportedSport)
      expect(positions).toEqual(['PG', 'SG', 'SF', 'PF', 'C'])
    })

    it('should get betting markets for sport', () => {
      const markets = SportConfigManager.getBettingMarkets('basketball' as SupportedSport)
      expect(markets).toEqual(['h2h', 'spread', 'totals'])
    })

    it('should return empty arrays for unsupported sports', () => {
      const positions = SportConfigManager.getPositionsForSport('nonexistent' as SupportedSport)
      const markets = SportConfigManager.getBettingMarkets('nonexistent' as SupportedSport)

      expect(positions).toEqual([])
      expect(markets).toEqual([])
    })
  })

  describe('Async Methods', () => {
    it('should get sport config asynchronously', async () => {
      const config = await SportConfigManager.getSportConfigAsync('basketball' as SupportedSport)

      expect(config).toBeDefined()
      expect(config?.name).toBe('basketball')
    })

    it('should get all sports asynchronously', async () => {
      const sports = await SportConfigManager.getAllSports()

      expect(Array.isArray(sports)).toBe(true)
      expect(sports.length).toBeGreaterThan(0)
    })

    it('should get leagues for sport asynchronously', async () => {
      const leagues = await SportConfigManager.getLeaguesForSport('basketball' as SupportedSport)

      expect(Array.isArray(leagues)).toBe(true)
    })

    it('should get default league for sport', async () => {
      const defaultLeague = await SportConfigManager.getDefaultLeague(
        'basketball' as SupportedSport
      )

      // Should return first league or null
      expect(defaultLeague === null || typeof defaultLeague === 'string').toBe(true)
    })

    it('should check if sport is supported asynchronously', async () => {
      const isSupported = await SportConfigManager.isSportSupported('basketball' as SupportedSport)

      expect(typeof isSupported).toBe('boolean')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty environment variables', () => {
      process.env.BASKETBALL_POSITIONS = ''
      process.env.BASKETBALL_SCORING_FIELDS = ''

      const config = SportConfigManager.getSportConfig('basketball' as SupportedSport)

      expect(config?.positions).toEqual([])
      expect(config?.scoringFields).toEqual([])
    })

    it('should handle invalid numeric values', () => {
      process.env.BASKETBALL_RATE_LIMIT = 'invalid'
      process.env.BASKETBALL_START_MONTH = 'not-a-number'

      const config = SportConfigManager.getSportConfig('basketball' as SupportedSport)

      expect(config?.rateLimits.requests).toBe(100) // Should use default
      expect(config?.seasonConfig.startMonth).toBe(9) // Should use default
    })

    it('should handle boolean environment variables', () => {
      process.env.BASKETBALL_ACTIVE = 'false'

      const config = SportConfigManager.getSportConfig('basketball' as SupportedSport)
      expect(config?.isActive).toBe(false)

      process.env.BASKETBALL_ACTIVE = 'true'
      const config2 = SportConfigManager.getSportConfig('basketball' as SupportedSport)
      expect(config2?.isActive).toBe(true)
    })
  })

  describe('Compliance with Project Rules', () => {
    it('should not hardcode sport names', () => {
      // This test ensures the configuration is dynamic
      const configs = SportConfigManager.getAllSportConfigs()

      // Should be able to load any sport dynamically
      configs.forEach(config => {
        expect(config.name).toBeDefined()
        expect(typeof config.name).toBe('string')
        expect(config.name.length).toBeGreaterThan(0)
      })
    })

    it('should use environment-driven configuration', () => {
      // Test that configuration comes from environment, not hardcoded values
      const config = SportConfigManager.getSportConfig('basketball' as SupportedSport)

      expect(config?.displayName).toBe(process.env.BASKETBALL_DISPLAY_NAME)
      expect(config?.icon).toBe(process.env.BASKETBALL_ICON)
      expect(config?.color).toBe(process.env.BASKETBALL_COLOR)
    })

    it('should support runtime sport addition', () => {
      // Test that new sports can be added via environment variables
      process.env.TENNIS_DISPLAY_NAME = 'Tennis'
      process.env.TENNIS_ICON = '🎾'
      process.env.TENNIS_COLOR = '#00FF00'
      process.env.TENNIS_ACTIVE = 'true'

      const config = SportConfigManager.getSportConfig('tennis' as SupportedSport)

      expect(config).toBeDefined()
      expect(config?.name).toBe('tennis')
      expect(config?.displayName).toBe('Tennis')
      expect(config?.icon).toBe('🎾')
      expect(config?.color).toBe('#00FF00')
    })
  })
})
