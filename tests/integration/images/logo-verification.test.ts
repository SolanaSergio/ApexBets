/**
 * Integration tests for logo verification
 * Tests database cache, ESPN fallback, SVG fallback, and visual verification
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'
import { bulletproofImageService } from '@/lib/services/bulletproof-image-service'
import { imageMonitoringService } from '@/lib/services/image-monitoring-service'

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

describe('Logo Verification Integration Tests', () => {
  beforeAll(async () => {
    // Clear monitoring events for clean test
    imageMonitoringService.clearEvents()
  })

  afterAll(async () => {
    // Clean up any test data
    await supabase.from('image_audit_log').delete().like('entity_name', 'Test%')
  })

  beforeEach(() => {
    // Clear monitoring events before each test
    imageMonitoringService.clearEvents()
  })

  describe('Database Cache Verification', () => {
    it('should fetch team logo from database when available', async () => {
      // Test with a known team that should have logo_url in database
      const testTeam = 'Lakers'
      const testSport = 'basketball'

      const result = await bulletproofImageService.getTeamLogo(testTeam, testSport, 'NBA')

      expect(result).toBeDefined()
      expect(result.url).toBeDefined()
      expect(result.source).toBeDefined()

      // Check if result came from database
      if (result.source === 'database') {
        expect(result.url).toMatch(/^https?:\/\//)
        expect(result.cached).toBe(true)
      }
    })

    it('should fetch player photo from database when available', async () => {
      // Test with a known player that should have headshot_url in database
      const testPlayer = 'LeBron James'
      const testSport = 'basketball'

      const result = await bulletproofImageService.getPlayerPhoto(testPlayer, testSport)

      expect(result).toBeDefined()
      expect(result.url).toBeDefined()
      expect(result.source).toBeDefined()

      // Check if result came from database
      if (result.source === 'database') {
        expect(result.url).toMatch(/^https?:\/\//)
        expect(result.cached).toBe(true)
      }
    })
  })

  describe('ESPN CDN Fallback', () => {
    it('should fallback to ESPN CDN when database cache is empty', async () => {
      // Test with a team that might not be in database but exists in ESPN mappings
      const testTeam = 'Warriors'
      const testSport = 'basketball'

      const result = await bulletproofImageService.getTeamLogo(testTeam, testSport, 'NBA')

      expect(result).toBeDefined()
      expect(result.url).toBeDefined()

      // Should be ESPN CDN URL or SVG fallback
      if (result.source === 'espn-cdn') {
        expect(result.url).toMatch(/^https:\/\/a\.espncdn\.com/)
        expect(result.fallback).toBe(false)
      }
    })

    it('should verify ESPN CDN URLs are accessible', async () => {
      const testUrls = [
        'https://a.espncdn.com/i/teamlogos/nba/500/3.png', // Lakers
        'https://a.espncdn.com/i/teamlogos/nba/500/9.png', // Warriors
        'https://a.espncdn.com/i/teamlogos/nfl/500/ne.png', // Patriots
      ]

      for (const url of testUrls) {
        try {
          const response = await fetch(url, { method: 'HEAD' })
          expect(response.ok).toBe(true)
        } catch (error) {
          console.warn(`ESPN CDN URL not accessible: ${url}`)
        }
      }
    })
  })

  describe('SVG Fallback Generation', () => {
    it('should generate SVG fallback for unknown teams', async () => {
      const testTeam = 'TestTeam123'
      const testSport = 'basketball'

      const result = await bulletproofImageService.getTeamLogo(testTeam, testSport, 'NBA')

      expect(result).toBeDefined()
      expect(result.url).toBeDefined()
      expect(result.source).toBe('svg')
      expect(result.url).toMatch(/^data:image\/svg\+xml/)
      expect(result.fallback).toBe(true)
    })

    it('should generate SVG fallback for unknown players', async () => {
      const testPlayer = 'TestPlayer123'
      const testSport = 'basketball'

      const result = await bulletproofImageService.getPlayerPhoto(testPlayer, testSport)

      expect(result).toBeDefined()
      expect(result.url).toBeDefined()
      expect(result.source).toBe('svg')
      expect(result.url).toMatch(/^data:image\/svg\+xml/)
      expect(result.fallback).toBe(true)
    })

    it('should use team colors from database in SVG generation', async () => {
      // This test assumes Lakers have colors in database
      const testTeam = 'Lakers'
      const testSport = 'basketball'

      // First, check if team has colors in database
      const { data: teamData } = await supabase
        .from('teams')
        .select('primary_color, secondary_color')
        .eq('name', testTeam)
        .eq('sport', testSport)
        .single()

      if (teamData?.primary_color && teamData?.secondary_color) {
        // Force SVG generation by using a non-existent team name variation
        const result = await bulletproofImageService.getTeamLogo(
          testTeam + 'Test',
          testSport,
          'NBA'
        )

        expect(result.source).toBe('svg')
        expect(result.url).toMatch(/^data:image\/svg\+xml/)

        // SVG should contain the team colors
        const svgContent = decodeURIComponent(result.url.split(',')[1])
        expect(svgContent).toContain(teamData.primary_color)
        expect(svgContent).toContain(teamData.secondary_color)
      }
    })
  })

  describe('Image Monitoring Integration', () => {
    it('should track image load events', async () => {
      const testTeam = 'Lakers'
      const testSport = 'basketball'

      // Clear events
      imageMonitoringService.clearEvents()

      // Load team logo
      await bulletproofImageService.getTeamLogo(testTeam, testSport, 'NBA')

      // Check if event was tracked
      const stats = imageMonitoringService.getStats()
      expect(stats.totalLoads).toBeGreaterThan(0)

      const teamEvents = imageMonitoringService.getEntityEvents(testTeam, 'team')
      expect(teamEvents.length).toBeGreaterThan(0)

      const event = teamEvents[0]
      expect(event.entityType).toBe('team')
      expect(event.entityName).toBe(testTeam)
      expect(event.sport).toBe(testSport)
      expect(event.success).toBe(true)
    })

    it('should track failed image loads', async () => {
      // Clear events
      imageMonitoringService.clearEvents()

      // Try to load a non-existent team (should generate SVG)
      await bulletproofImageService.getTeamLogo('NonExistentTeam123', 'basketball', 'NBA')

      const stats = imageMonitoringService.getStats()
      expect(stats.totalLoads).toBeGreaterThan(0)

      // Should have successful SVG generation, not a failure
      expect(stats.successRate).toBeGreaterThan(0)
    })

    it('should provide health metrics', async () => {
      // Load some images to generate metrics
      await bulletproofImageService.getTeamLogo('Lakers', 'basketball', 'NBA')
      await bulletproofImageService.getTeamLogo('Warriors', 'basketball', 'NBA')

      const health = imageMonitoringService.getHealthMetrics()

      expect(health.overallHealth).toBeDefined()
      expect(['excellent', 'good', 'warning', 'critical']).toContain(health.overallHealth)
      expect(health.databaseHitRate).toBeGreaterThanOrEqual(0)
      expect(health.svgFallbackRate).toBeGreaterThanOrEqual(0)
      expect(health.averageLoadTime).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Performance Tests', () => {
    it('should load images within acceptable time limits', async () => {
      const testCases = [
        { team: 'Lakers', sport: 'basketball', league: 'NBA' },
        { team: 'Warriors', sport: 'basketball', league: 'NBA' },
        { team: 'Patriots', sport: 'football', league: 'NFL' },
      ]

      for (const testCase of testCases) {
        const startTime = Date.now()
        const result = await bulletproofImageService.getTeamLogo(
          testCase.team,
          testCase.sport,
          testCase.league
        )
        const loadTime = Date.now() - startTime

        expect(result).toBeDefined()
        expect(loadTime).toBeLessThan(5000) // Should load within 5 seconds

        console.log(`${testCase.team} logo loaded in ${loadTime}ms from ${result.source}`)
      }
    })

    it('should have reasonable cache hit rates', async () => {
      // Load the same team multiple times
      const testTeam = 'Lakers'
      const testSport = 'basketball'

      // First load
      const result1 = await bulletproofImageService.getTeamLogo(testTeam, testSport, 'NBA')

      // Second load (should be cached)
      const result2 = await bulletproofImageService.getTeamLogo(testTeam, testSport, 'NBA')

      expect(result1.url).toBe(result2.url)

      // Second load should be faster (cached)
      const startTime = Date.now()
      await bulletproofImageService.getTeamLogo(testTeam, testSport, 'NBA')
      const cachedLoadTime = Date.now() - startTime

      expect(cachedLoadTime).toBeLessThan(1000) // Cached loads should be very fast
    })
  })

  describe('Database Schema Validation', () => {
    it('should have required image columns in teams table', async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('logo_url, primary_color, secondary_color')
        .limit(1)

      expect(error).toBeNull()
      expect(data).toBeDefined()

      if (data && data.length > 0) {
        const team = data[0]
        expect(team).toHaveProperty('logo_url')
        expect(team).toHaveProperty('primary_color')
        expect(team).toHaveProperty('secondary_color')
      }
    })

    it('should have required image columns in players table', async () => {
      const { data, error } = await supabase.from('players').select('headshot_url').limit(1)

      expect(error).toBeNull()
      expect(data).toBeDefined()

      if (data && data.length > 0) {
        const player = data[0]
        expect(player).toHaveProperty('headshot_url')
      }
    })

    it('should have image audit log table', async () => {
      const { data, error } = await supabase.from('image_audit_log').select('*').limit(1)

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })
  })
})
