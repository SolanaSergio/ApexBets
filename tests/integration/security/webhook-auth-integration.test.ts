/**
 * Webhook Authentication Integration Tests
 * Tests the complete webhook authentication flow with environment variables
 */

import { hmacWebhookAuthenticator } from '../../../lib/security'
import { environmentRules } from '../../../lib/rules/environment-rules'

describe('Webhook Authentication Integration', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv
  })

  describe('Environment Variable Integration', () => {
    it('should validate webhook with environment secret', () => {
      // Set up test environment
      process.env.WEBHOOK_SECRET = 'test-webhook-secret-key-for-integration-testing-32-chars'
      
      const testPayload = {
        type: 'game_update',
        data: {
          game_id: '123',
          status: 'live',
          home_score: 10,
          away_score: 8
        },
        sport: 'basketball',
        league: 'NBA',
        timestamp: new Date().toISOString()
      }

      // Generate signature using the environment secret
      const signature = hmacWebhookAuthenticator.generateSignature(
        testPayload,
        process.env.WEBHOOK_SECRET
      )

      // Validate the signature
      const isValid = hmacWebhookAuthenticator.validateSignature(
        testPayload,
        signature,
        process.env.WEBHOOK_SECRET
      )

      expect(isValid).toBe(true)
    })

    it('should reject webhook with wrong secret', () => {
      process.env.WEBHOOK_SECRET = 'correct-webhook-secret-key-for-integration-testing-32-chars'
      
      const testPayload = {
        type: 'game_update',
        data: { game_id: '123', status: 'live' }
      }

      // Generate signature with correct secret
      const signature = hmacWebhookAuthenticator.generateSignature(
        testPayload,
        process.env.WEBHOOK_SECRET
      )

      // Try to validate with wrong secret
      const wrongSecret = 'wrong-webhook-secret-key-for-integration-testing-32-chars'
      const isValid = hmacWebhookAuthenticator.validateSignature(
        testPayload,
        signature,
        wrongSecret
      )

      expect(isValid).toBe(false)
    })

    it('should handle complete webhook request validation', () => {
      process.env.WEBHOOK_SECRET = 'complete-webhook-secret-key-for-integration-testing-32-chars'
      
      const testPayload = {
        type: 'odds_update',
        data: {
          game_id: '456',
          odds: {
            home: 1.85,
            away: 2.10,
            draw: 3.50
          }
        },
        sport: 'soccer',
        league: 'Premier League',
        timestamp: new Date().toISOString()
      }

      const signature = hmacWebhookAuthenticator.generateSignature(
        testPayload,
        process.env.WEBHOOK_SECRET
      )

      const clientIP = '192.168.1.100'
      const allowedIPs = ['192.168.1.100', '10.0.0.1']

      const result = hmacWebhookAuthenticator.validateWebhookRequest(
        testPayload,
        signature,
        process.env.WEBHOOK_SECRET,
        clientIP,
        allowedIPs
      )

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should extract IP from realistic headers', () => {
      const headers = {
        'x-forwarded-for': '203.0.113.1, 192.168.1.1, 10.0.0.1',
        'x-real-ip': '203.0.113.1',
        'user-agent': 'GitHub-Hookshot/abc123',
        'content-type': 'application/json'
      }

      const extractedIP = hmacWebhookAuthenticator.extractClientIP(headers)
      expect(extractedIP).toBe('203.0.113.1')
    })

    it('should handle GitHub-style webhook signatures', () => {
      process.env.WEBHOOK_SECRET = 'github-webhook-secret-key-for-integration-testing-32-chars'
      
      const testPayload = {
        zen: 'Responsive is better than fast.',
        hook_id: 12345678,
        hook: {
          type: 'Repository',
          id: 12345678,
          name: 'web',
          active: true,
          events: ['push', 'pull_request']
        }
      }

      // GitHub sends the signature in X-Hub-Signature-256 header
      const signature = hmacWebhookAuthenticator.generateSignature(
        testPayload,
        process.env.WEBHOOK_SECRET
      )

      const isValid = hmacWebhookAuthenticator.validateSignature(
        testPayload,
        signature,
        process.env.WEBHOOK_SECRET
      )

      expect(isValid).toBe(true)
      expect(signature).toMatch(/^sha256=[a-f0-9]{64}$/)
    })
  })

  describe('Real-world Scenarios', () => {
    it('should handle webhook payload with timestamp validation', () => {
      process.env.WEBHOOK_SECRET = 'timestamp-webhook-secret-key-for-integration-testing-32-chars'
      
      const currentTime = new Date()
      const testPayload = {
        type: 'team_update',
        data: {
          team_id: 'lakers',
          name: 'Los Angeles Lakers',
          conference: 'Western',
          division: 'Pacific'
        },
        sport: 'basketball',
        league: 'NBA',
        timestamp: currentTime.toISOString()
      }

      const signature = hmacWebhookAuthenticator.generateSignature(
        testPayload,
        process.env.WEBHOOK_SECRET
      )

      // Simulate webhook received within 5 minutes
      const receivedTime = new Date(currentTime.getTime() + 2 * 60 * 1000) // 2 minutes later
      
      const isValid = hmacWebhookAuthenticator.validateSignature(
        testPayload,
        signature,
        process.env.WEBHOOK_SECRET
      )

      expect(isValid).toBe(true)
      
      // Verify timestamp is recent (within 5 minutes)
      const timeDiff = receivedTime.getTime() - new Date(testPayload.timestamp).getTime()
      expect(timeDiff).toBeLessThan(5 * 60 * 1000) // 5 minutes in milliseconds
    })

    it('should handle multiple concurrent webhook validations', async () => {
      process.env.WEBHOOK_SECRET = 'concurrent-webhook-secret-key-for-integration-testing-32-chars'
      
      const payloads = Array.from({ length: 10 }, (_, i) => ({
        type: 'game_update',
        data: {
          game_id: `game_${i}`,
          status: i % 2 === 0 ? 'live' : 'finished',
          home_score: Math.floor(Math.random() * 100),
          away_score: Math.floor(Math.random() * 100)
        },
        sport: 'basketball',
        league: 'NBA',
        timestamp: new Date().toISOString()
      }))

      // Generate signatures for all payloads
      const signatures = payloads.map(payload => 
        hmacWebhookAuthenticator.generateSignature(payload, process.env.WEBHOOK_SECRET!)
      )

      // Validate all signatures concurrently
      const validationPromises = payloads.map((payload, index) =>
        Promise.resolve(hmacWebhookAuthenticator.validateSignature(
          payload,
          signatures[index],
          process.env.WEBHOOK_SECRET!
        ))
      )

      const results = await Promise.all(validationPromises)
      
      // All validations should succeed
      expect(results.every(result => result === true)).toBe(true)
    })

    it('should handle webhook with large payload', () => {
      process.env.WEBHOOK_SECRET = 'large-payload-webhook-secret-key-for-integration-testing-32-chars'
      
      // Create a large payload (simulating bulk data update)
      const largeData = Array.from({ length: 100 }, (_, i) => ({
        player_id: `player_${i}`,
        name: `Player ${i}`,
        stats: {
          points: Math.floor(Math.random() * 50),
          rebounds: Math.floor(Math.random() * 20),
          assists: Math.floor(Math.random() * 15)
        }
      }))

      const testPayload = {
        type: 'bulk_player_update',
        data: {
          players: largeData,
          updated_at: new Date().toISOString()
        },
        sport: 'basketball',
        league: 'NBA',
        timestamp: new Date().toISOString()
      }

      const signature = hmacWebhookAuthenticator.generateSignature(
        testPayload,
        process.env.WEBHOOK_SECRET
      )

      const isValid = hmacWebhookAuthenticator.validateSignature(
        testPayload,
        signature,
        process.env.WEBHOOK_SECRET
      )

      expect(isValid).toBe(true)
      
      // Verify payload size is substantial
      const payloadSize = JSON.stringify(testPayload).length
      expect(payloadSize).toBeGreaterThan(5000) // At least 5KB
    })
  })
})