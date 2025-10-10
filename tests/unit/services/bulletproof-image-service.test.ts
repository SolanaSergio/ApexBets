/**
 * Unit tests for Bulletproof Image Service
 */

import { bulletproofImageService, BulletproofImageService } from '@/lib/services/bulletproof-image-service'

describe('BulletproofImageService', () => {
  let service: BulletproofImageService

  beforeEach(() => {
    service = BulletproofImageService.getInstance()
    service.clearCache()
  })

  describe('getTeamLogo', () => {
    it('should return valid image URL', async () => {
      const result = await service.getTeamLogo('Lakers', 'basketball', 'NBA')
      
      expect(result.url).toBeTruthy()
      expect(result.source).toBeTruthy()
      expect(typeof result.cached).toBe('boolean')
      expect(typeof result.fallback).toBe('boolean')
    })

    it('should use memory cache on second call', async () => {
      const result1 = await service.getTeamLogo('Lakers', 'basketball', 'NBA')
      const result2 = await service.getTeamLogo('Lakers', 'basketball', 'NBA')
      
      expect(result2.source).toBe('memory')
      expect(result2.cached).toBe(true)
    })

    it('should handle errors gracefully', async () => {
      const result = await service.getTeamLogo('', '', '')
      
      expect(result.url).toBeTruthy()
      expect(result.fallback).toBe(true)
    })

    it('should use team colors when provided', async () => {
      const colors = { primary: '#FF0000', secondary: '#0000FF' }
      const result = await service.getTeamLogo('Test Team', 'basketball', 'NBA', colors)
      
      expect(result.url).toBeTruthy()
      // Should be SVG with colors
      if (result.url.startsWith('data:image/svg+xml,')) {
        const svg = decodeURIComponent(result.url.split(',')[1])
        expect(svg).toContain('#FF0000')
      }
    })
  })

  describe('getPlayerPhoto', () => {
    it('should return valid image URL', async () => {
      const result = await service.getPlayerPhoto('LeBron James', '12345', 'basketball')
      
      expect(result.url).toBeTruthy()
      expect(result.source).toBeTruthy()
      expect(typeof result.cached).toBe('boolean')
      expect(typeof result.fallback).toBe('boolean')
    })

    it('should use memory cache on second call', async () => {
      const result1 = await service.getPlayerPhoto('LeBron James', '12345', 'basketball')
      const result2 = await service.getPlayerPhoto('LeBron James', '12345', 'basketball')
      
      expect(result2.source).toBe('memory')
      expect(result2.cached).toBe(true)
    })

    it('should handle errors gracefully', async () => {
      const result = await service.getPlayerPhoto('', '', '')
      
      expect(result.url).toBeTruthy()
      expect(result.fallback).toBe(true)
    })

    it('should use team colors when provided', async () => {
      const colors = { primary: '#FF0000', secondary: '#0000FF' }
      const result = await service.getPlayerPhoto('Test Player', '12345', 'basketball', 'Lakers', colors)
      
      expect(result.url).toBeTruthy()
      // Should be SVG with colors
      if (result.url.startsWith('data:image/svg+xml,')) {
        const svg = decodeURIComponent(result.url.split(',')[1])
        expect(svg).toContain('#FF0000')
      }
    })
  })

  describe('cache management', () => {
    it('should clear cache', () => {
      service.clearCache()
      
      const stats = service.getCacheStats()
      expect(stats.memory).toBe(0)
      expect(stats.hits).toBe(0)
      expect(stats.misses).toBe(0)
      expect(stats.fallbacks).toBe(0)
    })

    it('should track cache statistics', async () => {
      await service.getTeamLogo('Lakers', 'basketball', 'NBA')
      
      const stats = service.getCacheStats()
      expect(stats.memory).toBeGreaterThan(0)
      expect(stats.hitRate).toBeGreaterThanOrEqual(0)
    })
  })

  describe('warmupCache', () => {
    it('should warm up cache with team data', async () => {
      const teams = [
        { name: 'Lakers', sport: 'basketball', league: 'NBA' },
        { name: 'Warriors', sport: 'basketball', league: 'NBA' }
      ]
      
      await service.warmupCache(teams)
      
      const stats = service.getCacheStats()
      expect(stats.memory).toBeGreaterThan(0)
    })

    it('should handle errors during warmup', async () => {
      const teams = [
        { name: '', sport: '', league: '' } // Invalid team data
      ]
      
      // Should not throw error
      await expect(service.warmupCache(teams)).resolves.not.toThrow()
    })
  })

  describe('isExpired', () => {
    it('should return false for non-expired entries', () => {
      const service = BulletproofImageService.getInstance() as any
      
      const entry = {
        image_url: 'test',
        source: 'test',
        verified_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        cache_hits: 0
      }
      
      expect(service.isExpired(entry)).toBe(false)
    })

    it('should return true for expired entries', () => {
      const service = BulletproofImageService.getInstance() as any
      
      const entry = {
        image_url: 'test',
        source: 'test',
        verified_at: new Date().toISOString(),
        expires_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        cache_hits: 0
      }
      
      expect(service.isExpired(entry)).toBe(true)
    })

    it('should return false for entries without expiry', () => {
      const service = BulletproofImageService.getInstance() as any
      
      const entry = {
        image_url: 'test',
        source: 'test',
        verified_at: new Date().toISOString(),
        cache_hits: 0
      }
      
      expect(service.isExpired(entry)).toBe(false)
    })
  })
})
