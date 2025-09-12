/**
 * Real integration tests for webhook authentication
 * Tests against actual running server
 */

import { hmacWebhookAuthenticator } from '@/lib/security/hmac-webhook-authenticator'

const WEBHOOK_URL = 'http://localhost:3000/api/webhooks/sports-data'
const TEST_SECRET = 'test_webhook_secret_key_for_testing_purposes_minimum_32_chars'

describe('Webhook Authentication Integration (Real Server)', () => {
  const validPayload = {
    type: 'game_update',
    data: {
      game_id: 'test_game_123',
      status: 'live',
      home_score: 14,
      away_score: 7
    },
    sport: 'nfl',
    league: 'nfl'
  }

  beforeAll(() => {
    // Set test environment variables
    process.env.WEBHOOK_SECRET = TEST_SECRET
    process.env.WEBHOOK_REQUIRE_SIGNATURE = 'true'
    process.env.WEBHOOK_ALLOWED_IPS = ''
  })

  describe('HMAC Signature Validation', () => {
    test('should accept valid HMAC signature', async () => {
      const payload = JSON.stringify(validPayload)
      const signature = hmacWebhookAuthenticator.generateSignature(payload, TEST_SECRET)
      
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hub-Signature-256': signature
        },
        body: payload
      })
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.request_id).toBeDefined()
      expect(response.headers.get('X-Request-ID')).toBeDefined()
    })

    test('should reject invalid HMAC signature', async () => {
      const payload = JSON.stringify(validPayload)
      const invalidSignature = 'sha256=invalid_signature_here'
      
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hub-Signature-256': invalidSignature
        },
        body: payload
      })
      
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Invalid webhook signature')
      expect(data.request_id).toBeDefined()
      expect(response.headers.get('WWW-Authenticate')).toBe('HMAC-SHA256')
    })

    test('should reject missing signature', async () => {
      const payload = JSON.stringify(validPayload)
      
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: payload
      })
      
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Missing webhook signature')
      expect(data.request_id).toBeDefined()
    })

    test('should detect payload tampering', async () => {
      const originalPayload = validPayload
      const tamperedPayload = { ...validPayload, data: { ...validPayload.data, home_score: 999 } }
      
      // Generate signature for original payload
      const signature = hmacWebhookAuthenticator.generateSignature(originalPayload, TEST_SECRET)
      
      // Send tampered payload with original signature
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hub-Signature-256': signature
        },
        body: JSON.stringify(tamperedPayload)
      })
      
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Invalid webhook signature')
    })
  })

  describe('Error Handling', () => {
    test('should handle invalid JSON', async () => {
      const invalidJson = '{ invalid json'
      const signature = hmacWebhookAuthenticator.generateSignature(invalidJson, TEST_SECRET)
      
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hub-Signature-256': signature
        },
        body: invalidJson
      })
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Invalid JSON payload')
      expect(data.request_id).toBeDefined()
    })

    test('should handle unknown webhook type', async () => {
      const unknownPayload = {
        type: 'unknown_type',
        data: {},
        sport: 'nfl',
        league: 'nfl'
      }
      
      const payload = JSON.stringify(unknownPayload)
      const signature = hmacWebhookAuthenticator.generateSignature(payload, TEST_SECRET)
      
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hub-Signature-256': signature
        },
        body: payload
      })
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Unknown webhook type')
    })
  })

  describe('Response Format', () => {
    test('should include proper response headers and format', async () => {
      const payload = JSON.stringify(validPayload)
      const signature = hmacWebhookAuthenticator.generateSignature(payload, TEST_SECRET)
      
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hub-Signature-256': signature
        },
        body: payload
      })
      
      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toContain('application/json')
      expect(response.headers.get('X-Request-ID')).toBeDefined()
      
      const data = await response.json()
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('message', 'Webhook processed')
      expect(data).toHaveProperty('request_id')
      expect(data).toHaveProperty('timestamp')
      
      // Validate timestamp format
      expect(new Date(data.timestamp).getTime()).toBeGreaterThan(Date.now() - 5000)
    })
  })

  describe('Different Webhook Types', () => {
    const testCases = [
      {
        type: 'score_update',
        data: {
          game_id: 'test_game_456',
          home_score: 21,
          away_score: 14,
          quarter: 3,
          time_remaining: '5:30'
        }
      },
      {
        type: 'odds_update',
        data: {
          game_id: 'test_game_789',
          odds_type: 'moneyline',
          home_odds: -150,
          away_odds: 130,
          source: 'test_provider'
        }
      },
      {
        type: 'team_update',
        data: {
          team_id: 'test_team_123',
          name: 'Test Team',
          abbreviation: 'TT',
          record: { wins: 10, losses: 5 }
        }
      },
      {
        type: 'full_sync',
        data: {}
      }
    ]

    testCases.forEach(({ type, data }) => {
      test(`should handle ${type} webhook type`, async () => {
        const webhookPayload = {
          type,
          data,
          sport: 'nfl',
          league: 'nfl'
        }
        
        const payload = JSON.stringify(webhookPayload)
        const signature = hmacWebhookAuthenticator.generateSignature(payload, TEST_SECRET)
        
        const response = await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Hub-Signature-256': signature
          },
          body: payload
        })
        
        expect(response.status).toBe(200)
        const responseData = await response.json()
        expect(responseData.success).toBe(true)
        expect(responseData.message).toBe('Webhook processed')
      })
    })
  })
})