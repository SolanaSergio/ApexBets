/**
 * Unit tests for ESPN CDN Mapper Service
 */

import { espnCDNMapper, ESPNCDNMapper } from '@/lib/services/espn-cdn-mapper'

describe('ESPNCDNMapper', () => {
  let mapper: ESPNCDNMapper

  beforeEach(() => {
    mapper = ESPNCDNMapper.getInstance()
    mapper.clearCache()
  })

  describe('getSportConfig', () => {
    it('should return sport config for known sports', async () => {
      const config = await mapper.getSportConfig('basketball')
      
      expect(config).toBeTruthy()
      expect(config?.sport).toBe('basketball')
      expect(config?.espn_sport_key).toBe('basketball')
      expect(config?.logo_path_template).toContain('{teamId}')
    })

    it('should return null for unknown sports', async () => {
      const config = await mapper.getSportConfig('unknown-sport')
      
      expect(config).toBeNull()
    })

    it('should cache sport configs', async () => {
      const config1 = await mapper.getSportConfig('basketball')
      const config2 = await mapper.getSportConfig('basketball')
      
      expect(config1).toBe(config2) // Same instance due to caching
    })
  })

  describe('getTeamLogoURL', () => {
    it('should return null for unknown team', async () => {
      const url = await mapper.getTeamLogoURL('Unknown Team', 'basketball', 'NBA')
      
      expect(url).toBeNull()
    })

    it('should return URL for known team', async () => {
      const url = await mapper.getTeamLogoURL('Lakers', 'basketball', 'NBA')
      
      if (url) {
        expect(url).toContain('https://a.espncdn.com')
        expect(url).toContain('nba')
        expect(url).toContain('3') // Lakers team ID
      }
    })

    it('should handle missing sport config', async () => {
      const url = await mapper.getTeamLogoURL('Lakers', 'unknown-sport', 'NBA')
      
      expect(url).toBeNull()
    })
  })

  describe('getPlayerPhotoURL', () => {
    it('should return URL for valid player ID', async () => {
      const url = await mapper.getPlayerPhotoURL('12345', 'basketball')
      
      if (url) {
        expect(url).toContain('https://a.espncdn.com')
        expect(url).toContain('nba')
        expect(url).toContain('12345')
      }
    })

    it('should return null for missing sport config', async () => {
      const url = await mapper.getPlayerPhotoURL('12345', 'unknown-sport')
      
      expect(url).toBeNull()
    })
  })

  describe('generateTeamId', () => {
    it('should return team ID for known teams', () => {
      const mapper = ESPNCDNMapper.getInstance() as any
      
      expect(mapper.generateTeamId('Lakers', 'basketball')).toBe('3')
      expect(mapper.generateTeamId('Warriors', 'basketball')).toBe('9')
      expect(mapper.generateTeamId('Patriots', 'football')).toBe('ne')
    })

    it('should return null for unknown teams', () => {
      const mapper = ESPNCDNMapper.getInstance() as any
      
      expect(mapper.generateTeamId('Unknown Team', 'basketball')).toBeNull()
      expect(mapper.generateTeamId('Lakers', 'unknown-sport')).toBeNull()
    })
  })

  describe('verifyImageURL', () => {
    it('should return true for valid URLs', async () => {
      const mapper = ESPNCDNMapper.getInstance() as any
      
      // Mock fetch to return successful response
      global.fetch = jest.fn().mockResolvedValue({
        ok: true
      })
      
      const isValid = await mapper.verifyImageURL('https://example.com/image.png')
      
      expect(isValid).toBe(true)
    })

    it('should return false for invalid URLs', async () => {
      const mapper = ESPNCDNMapper.getInstance() as any
      
      // Mock fetch to return error response
      global.fetch = jest.fn().mockResolvedValue({
        ok: false
      })
      
      const isValid = await mapper.verifyImageURL('https://example.com/invalid.png')
      
      expect(isValid).toBe(false)
    })

    it('should return false on fetch error', async () => {
      const mapper = ESPNCDNMapper.getInstance() as any
      
      // Mock fetch to throw error
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))
      
      const isValid = await mapper.verifyImageURL('https://example.com/image.png')
      
      expect(isValid).toBe(false)
    })
  })

  describe('cache management', () => {
    it('should clear cache', () => {
      mapper.clearCache()
      
      const stats = mapper.getCacheStats()
      expect(stats.sportConfigs).toBe(0)
      expect(stats.teamMappings).toBe(0)
    })

    it('should track cache stats', async () => {
      await mapper.getSportConfig('basketball')
      
      const stats = mapper.getCacheStats()
      expect(stats.sportConfigs).toBeGreaterThan(0)
    })
  })
})
