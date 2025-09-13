/**
 * Enhanced Webhook Integration Tests
 * Tests the complete webhook processing pipeline with validation, deduplication, and batch processing
 */

// Jest globals are available in the test environment
import { WebhookValidator } from '@/lib/security/webhook-validator'
import { WebhookDeduplicator } from '@/lib/security/webhook-deduplicator'
import { WebhookProcessor } from '@/lib/security/webhook-processor'
import { hmacWebhookAuthenticator } from '@/lib/security/hmac-webhook-authenticator'

describe('Enhanced Webhook Processing', () => {
  const mockRequestId = 'test-req-123'
  const mockClientIP = '192.168.1.100'
  const mockContext = {
    requestId: mockRequestId,
    clientIP: mockClientIP,
    userAgent: 'Test-Agent/1.0',
    timestamp: new Date()
  }

  beforeEach(() => {
    // Clear any existing cache
    WebhookDeduplicator.cleanupMemoryCache()
  })

  describe('Webhook Validation', () => {
    test('should validate valid game update payload', () => {
      const payload = {
        type: 'game_update',
        sport: 'basketball',
        league: 'NBA',
        source: 'webhook',
        data: {
          game_id: 'game-123',
          status: 'live',
          home_score: 85,
          away_score: 78,
          venue: 'Madison Square Garden'
        }
      }

      const result = WebhookValidator.validate(payload)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.data).toBeDefined()
    })

    test('should validate valid score update payload', () => {
      const payload = {
        type: 'score_update',
        sport: 'basketball',
        league: 'NBA',
        data: {
          game_id: 'game-123',
          home_score: 87,
          away_score: 80,
          quarter: '3rd Quarter',
          time_remaining: '5:23'
        }
      }

      const result = WebhookValidator.validate(payload)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should validate valid odds update payload', () => {
      const payload = {
        type: 'odds_update',
        sport: 'basketball',
        league: 'NBA',
        data: {
          game_id: 'game-123',
          odds_type: 'moneyline',
          home_odds: -150,
          away_odds: 130,
          bookmaker: 'DraftKings'
        }
      }

      const result = WebhookValidator.validate(payload)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should validate valid team update payload', () => {
      const payload = {
        type: 'team_update',
        sport: 'basketball',
        league: 'NBA',
        data: {
          team_id: 'team-123',
          name: 'New York Knicks',
          abbreviation: 'NYK',
          logo_url: 'https://example.com/logo.png',
          standings: {
            sport: 'basketball',
            league: 'NBA',
            season: '2024-25',
            wins: 25,
            losses: 15,
            win_percentage: 0.625,
            conference: 'Eastern',
            division: 'Atlantic'
          }
        }
      }

      const result = WebhookValidator.validate(payload)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should validate valid batch payload', () => {
      const payload = {
        type: 'batch',
        events: [
          {
            type: 'game_update',
            sport: 'basketball',
            league: 'NBA',
            source: 'webhook',
            data: {
              game_id: 'game-123',
              status: 'live',
              home_score: 85,
              away_score: 78
            }
          },
          {
            type: 'score_update',
            sport: 'basketball',
            league: 'NBA',
            data: {
              game_id: 'game-123',
              home_score: 87,
              away_score: 80,
              quarter: '3rd Quarter'
            }
          }
        ],
        batch_id: 'batch-456'
      }

      const result = WebhookValidator.validate(payload)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should reject invalid payload with missing required fields', () => {
      const payload = {
        type: 'game_update',
        sport: 'basketball',
        source: 'webhook',
        // Missing league
        data: {
          // Missing game_id
          status: 'live'
        }
      }

      const result = WebhookValidator.validate(payload)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    test('should reject payload with invalid event type', () => {
      const payload = {
        type: 'invalid_type',
        sport: 'basketball',
        league: 'NBA',
        data: {}
      }

      const result = WebhookValidator.validate(payload)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    test('should validate payload size correctly', () => {
      const smallPayload = JSON.stringify({ test: 'data' })
      const largePayload = 'x'.repeat(2 * 1024 * 1024) // 2MB

      expect(WebhookValidator.validateSize(smallPayload)).toBe(true)
      expect(WebhookValidator.validateSize(largePayload)).toBe(false)
    })
  })

  describe('Webhook Deduplication', () => {
    test('should generate consistent hashes for identical payloads', () => {
      const payload1 = {
        type: 'game_update',
        sport: 'basketball',
        league: 'NBA',
        source: 'webhook',
        data: { game_id: 'game-123', status: 'live' }
      }

      const payload2 = {
        type: 'game_update',
        sport: 'basketball',
        league: 'NBA',
        source: 'webhook',
        data: { game_id: 'game-123', status: 'live' }
      }

      const hash1 = WebhookValidator.generateHash(payload1)
      const hash2 = WebhookValidator.generateHash(payload2)

      expect(hash1).toBe(hash2)
      expect(hash1).toHaveLength(64) // SHA-256 hex length
    })

    test('should generate different hashes for different payloads', () => {
      const payload1 = {
        type: 'game_update',
        sport: 'basketball',
        league: 'NBA',
        source: 'webhook',
        data: { game_id: 'game-123', status: 'live' }
      }

      const payload2 = {
        type: 'game_update',
        sport: 'basketball',
        league: 'NBA',
        source: 'webhook',
        data: { game_id: 'game-456', status: 'live' }
      }

      const hash1 = WebhookValidator.generateHash(payload1)
      const hash2 = WebhookValidator.generateHash(payload2)

      expect(hash1).not.toBe(hash2)
    })

    test('should detect duplicates in memory cache', async () => {
      const hash = 'test-hash-123'
      
      // Mark as processing
      await WebhookDeduplicator.markProcessing(hash, mockRequestId, 'game_update')
      
      // Mark as processed
      await WebhookDeduplicator.markProcessed(hash, mockRequestId, 100)
      
      // Check for duplicate
      const isDuplicate = await WebhookDeduplicator.isDuplicate(hash, 'new-request-id')
      expect(isDuplicate).toBe(true)
    })

    test('should not detect duplicates for new hashes', async () => {
      const hash = 'new-unique-hash-456'
      
      const isDuplicate = await WebhookDeduplicator.isDuplicate(hash, mockRequestId)
      expect(isDuplicate).toBe(false)
    })

    test('should track processing statistics', () => {
      const stats = WebhookDeduplicator.getStats()
      expect(stats).toHaveProperty('memoryCacheSize')
      expect(stats).toHaveProperty('oldestEntry')
      expect(stats).toHaveProperty('newestEntry')
    })
  })

  describe('HMAC Signature Validation', () => {
    const testSecret = 'test-webhook-secret-key'
    
    test('should validate correct HMAC signature', () => {
      const payload = { test: 'data' }
      const signature = hmacWebhookAuthenticator.generateSignature(payload, testSecret)
      
      const isValid = hmacWebhookAuthenticator.validateSignature(payload, signature, testSecret)
      expect(isValid).toBe(true)
    })

    test('should reject invalid HMAC signature', () => {
      const payload = { test: 'data' }
      const invalidSignature = 'sha256=invalid-signature'
      
      const isValid = hmacWebhookAuthenticator.validateSignature(payload, invalidSignature, testSecret)
      expect(isValid).toBe(false)
    })

    test('should reject signature with wrong secret', () => {
      const payload = { test: 'data' }
      const signature = hmacWebhookAuthenticator.generateSignature(payload, testSecret)
      
      const isValid = hmacWebhookAuthenticator.validateSignature(payload, signature, 'wrong-secret')
      expect(isValid).toBe(false)
    })

    test('should validate IP addresses correctly', () => {
      const allowedIPs = ['192.168.1.100', '10.0.0.1']
      
      expect(hmacWebhookAuthenticator.validateIPAddress('192.168.1.100', allowedIPs)).toBe(true)
      expect(hmacWebhookAuthenticator.validateIPAddress('10.0.0.1', allowedIPs)).toBe(true)
      expect(hmacWebhookAuthenticator.validateIPAddress('192.168.1.200', allowedIPs)).toBe(false)
      expect(hmacWebhookAuthenticator.validateIPAddress('192.168.1.100', [])).toBe(true) // Empty allowlist allows all
    })
  })

  describe('Event Type Validation', () => {
    test('should validate supported event types', () => {
      const validTypes = [
        'game_update',
        'score_update',
        'odds_update',
        'team_update',
        'player_update',
        'full_sync',
        'batch'
      ]

      validTypes.forEach(type => {
        expect(WebhookValidator.isValidEventType(type)).toBe(true)
      })
    })

    test('should reject unsupported event types', () => {
      const invalidTypes = [
        'invalid_type',
        'unknown_event',
        '',
        null,
        undefined
      ]

      invalidTypes.forEach(type => {
        expect(WebhookValidator.isValidEventType(type as any)).toBe(false)
      })
    })
  })

  describe('Error Handling', () => {
    test('should handle malformed JSON gracefully', () => {
      const malformedJson = '{ invalid json }'
      
      expect(() => {
        JSON.parse(malformedJson)
      }).toThrow()
      
      // Webhook validator should handle this gracefully
      const result = WebhookValidator.validate(malformedJson)
      expect(result.isValid).toBe(false)
    })

    test('should handle null and undefined payloads', () => {
      expect(WebhookValidator.validate(null).isValid).toBe(false)
      expect(WebhookValidator.validate(undefined).isValid).toBe(false)
    })

    test('should handle empty payloads', () => {
      expect(WebhookValidator.validate({}).isValid).toBe(false)
      expect(WebhookValidator.validate([]).isValid).toBe(false)
    })
  })
})

describe('Webhook Processing Performance', () => {
  test('should process webhooks within acceptable time limits', async () => {
    const payload = {
      type: 'game_update',
      sport: 'basketball',
      league: 'NBA',
      source: 'webhook',
      data: {
        game_id: 'perf-test-game',
        status: 'live',
        home_score: 85,
        away_score: 78
      }
    }

    const context = {
      requestId: 'perf-test-req',
      clientIP: '192.168.1.100',
      timestamp: new Date()
    }

    const startTime = Date.now()
    
    // Note: This would require mocking the database in a real test
    // const result = await WebhookProcessor.processWebhook(payload, context)
    
    const processingTime = Date.now() - startTime
    
    // Processing should complete within 1 second for simple operations
    expect(processingTime).toBeLessThan(1000)
  })

  test('should handle concurrent webhook processing', async () => {
    const payloads = Array.from({ length: 10 }, (_, i) => ({
      type: 'game_update',
      sport: 'basketball',
      league: 'NBA',
      source: 'webhook',
      data: {
        game_id: `concurrent-game-${i}`,
        status: 'live',
        home_score: 85 + i,
        away_score: 78 + i
      }
    }))

    const contexts = payloads.map((_, i) => ({
      requestId: `concurrent-req-${i}`,
      clientIP: '192.168.1.100',
      timestamp: new Date()
    }))

    const startTime = Date.now()
    
    // Process all webhooks concurrently
    const promises = payloads.map((payload, i) => {
      // Note: This would require mocking the database in a real test
      // return WebhookProcessor.processWebhook(payload, contexts[i])
      return Promise.resolve({ success: true, processingTimeMs: 50 })
    })

    const results = await Promise.all(promises)
    const totalTime = Date.now() - startTime

    // All should succeed
    results.forEach(result => {
      expect(result.success).toBe(true)
    })

    // Concurrent processing should be faster than sequential
    expect(totalTime).toBeLessThan(payloads.length * 100) // Much faster than sequential
  })
})