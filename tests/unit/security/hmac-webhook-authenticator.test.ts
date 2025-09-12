/**
 * HMAC Webhook Authenticator Unit Tests
 * Comprehensive test suite for webhook authentication security
 */

import crypto from 'crypto'
import { HMACWebhookAuthenticator } from '../../../lib/security/hmac-webhook-authenticator'

describe('HMACWebhookAuthenticator', () => {
  let authenticator: HMACWebhookAuthenticator
  const testSecret = 'test-webhook-secret-key-for-testing-purposes-32-chars'
  const testPayload = { type: 'game_update', data: { game_id: '123', status: 'live' } }

  beforeEach(() => {
    authenticator = new HMACWebhookAuthenticator()
  })

  describe('validateSignature', () => {
    it('should validate correct HMAC signature', () => {
      const signature = authenticator.generateSignature(testPayload, testSecret)
      const isValid = authenticator.validateSignature(testPayload, signature, testSecret)
      
      expect(isValid).toBe(true)
    })

    it('should reject invalid HMAC signature', () => {
      const invalidSignature = 'sha256=invalid_signature_hash'
      const isValid = authenticator.validateSignature(testPayload, invalidSignature, testSecret)
      
      expect(isValid).toBe(false)
    })

    it('should reject signature without proper prefix', () => {
      const signature = crypto
        .createHmac('sha256', testSecret)
        .update(JSON.stringify(testPayload))
        .digest('hex')
      
      // Missing 'sha256=' prefix
      const isValid = authenticator.validateSignature(testPayload, signature, testSecret)
      
      expect(isValid).toBe(false)
    })

    it('should reject signature with wrong prefix', () => {
      const signature = crypto
        .createHmac('sha256', testSecret)
        .update(JSON.stringify(testPayload))
        .digest('hex')
      
      const wrongPrefixSignature = `md5=${signature}`
      const isValid = authenticator.validateSignature(testPayload, wrongPrefixSignature, testSecret)
      
      expect(isValid).toBe(false)
    })

    it('should handle string payloads correctly', () => {
      const stringPayload = JSON.stringify(testPayload)
      const signature = authenticator.generateSignature(stringPayload, testSecret)
      const isValid = authenticator.validateSignature(stringPayload, signature, testSecret)
      
      expect(isValid).toBe(true)
    })

    it('should handle object payloads correctly', () => {
      const signature = authenticator.generateSignature(testPayload, testSecret)
      const isValid = authenticator.validateSignature(testPayload, signature, testSecret)
      
      expect(isValid).toBe(true)
    })

    it('should reject empty payload', () => {
      const isValid = authenticator.validateSignature('', 'sha256=test', testSecret)
      
      expect(isValid).toBe(false)
    })

    it('should reject null payload', () => {
      const isValid = authenticator.validateSignature(null, 'sha256=test', testSecret)
      
      expect(isValid).toBe(false)
    })

    it('should reject undefined payload', () => {
      const isValid = authenticator.validateSignature(undefined, 'sha256=test', testSecret)
      
      expect(isValid).toBe(false)
    })

    it('should reject empty signature', () => {
      const isValid = authenticator.validateSignature(testPayload, '', testSecret)
      
      expect(isValid).toBe(false)
    })

    it('should reject null signature', () => {
      const isValid = authenticator.validateSignature(testPayload, null as any, testSecret)
      
      expect(isValid).toBe(false)
    })

    it('should reject empty secret', () => {
      const signature = 'sha256=test'
      const isValid = authenticator.validateSignature(testPayload, signature, '')
      
      expect(isValid).toBe(false)
    })

    it('should reject null secret', () => {
      const signature = 'sha256=test'
      const isValid = authenticator.validateSignature(testPayload, signature, null as any)
      
      expect(isValid).toBe(false)
    })

    it('should be case sensitive for signature', () => {
      const signature = authenticator.generateSignature(testPayload, testSecret)
      const upperCaseSignature = signature.toUpperCase()
      const isValid = authenticator.validateSignature(testPayload, upperCaseSignature, testSecret)
      
      expect(isValid).toBe(false)
    })

    it('should detect payload tampering', () => {
      const signature = authenticator.generateSignature(testPayload, testSecret)
      const tamperedPayload = { ...testPayload, data: { ...testPayload.data, status: 'finished' } }
      const isValid = authenticator.validateSignature(tamperedPayload, signature, testSecret)
      
      expect(isValid).toBe(false)
    })

    it('should use different secrets correctly', () => {
      const secret1 = 'secret1-for-testing-purposes-32-chars'
      const secret2 = 'secret2-for-testing-purposes-32-chars'
      
      const signature1 = authenticator.generateSignature(testPayload, secret1)
      const signature2 = authenticator.generateSignature(testPayload, secret2)
      
      expect(signature1).not.toBe(signature2)
      expect(authenticator.validateSignature(testPayload, signature1, secret1)).toBe(true)
      expect(authenticator.validateSignature(testPayload, signature1, secret2)).toBe(false)
    })

    it('should handle malformed JSON gracefully', () => {
      const malformedPayload = '{"invalid": json}'
      const signature = 'sha256=test'
      
      // Should not throw an error, just return false
      expect(() => {
        const isValid = authenticator.validateSignature(malformedPayload, signature, testSecret)
        expect(isValid).toBe(false)
      }).not.toThrow()
    })

    it('should use timing-safe comparison', () => {
      // This test ensures we're using crypto.timingSafeEqual
      const signature = authenticator.generateSignature(testPayload, testSecret)
      
      // Mock crypto.timingSafeEqual to verify it's called
      const originalTimingSafeEqual = crypto.timingSafeEqual
      const timingSafeEqualSpy = jest.fn().mockReturnValue(true)
      crypto.timingSafeEqual = timingSafeEqualSpy
      
      authenticator.validateSignature(testPayload, signature, testSecret)
      
      expect(timingSafeEqualSpy).toHaveBeenCalled()
      
      // Restore original function
      crypto.timingSafeEqual = originalTimingSafeEqual
    })
  })

  describe('validateIPAddress', () => {
    it('should allow all IPs when allowlist is empty', () => {
      const isValid = authenticator.validateIPAddress('192.168.1.1', [])
      
      expect(isValid).toBe(true)
    })

    it('should allow all IPs when allowlist is not provided', () => {
      const isValid = authenticator.validateIPAddress('192.168.1.1', [])
      
      expect(isValid).toBe(true)
    })

    it('should allow IP in allowlist', () => {
      const allowlist = ['192.168.1.1', '10.0.0.1']
      const isValid = authenticator.validateIPAddress('192.168.1.1', allowlist)
      
      expect(isValid).toBe(true)
    })

    it('should reject IP not in allowlist', () => {
      const allowlist = ['192.168.1.1', '10.0.0.1']
      const isValid = authenticator.validateIPAddress('192.168.1.2', allowlist)
      
      expect(isValid).toBe(false)
    })

    it('should handle IPv6 addresses', () => {
      const allowlist = ['2001:db8::1', '::1']
      const isValid = authenticator.validateIPAddress('2001:db8::1', allowlist)
      
      expect(isValid).toBe(true)
    })

    it('should reject empty IP address', () => {
      const allowlist = ['192.168.1.1']
      const isValid = authenticator.validateIPAddress('', allowlist)
      
      expect(isValid).toBe(false)
    })

    it('should reject null IP address', () => {
      const allowlist = ['192.168.1.1']
      const isValid = authenticator.validateIPAddress(null as any, allowlist)
      
      expect(isValid).toBe(false)
    })

    it('should reject undefined IP address', () => {
      const allowlist = ['192.168.1.1']
      const isValid = authenticator.validateIPAddress(undefined as any, allowlist)
      
      expect(isValid).toBe(false)
    })

    it('should handle localhost addresses', () => {
      const allowlist = ['127.0.0.1', 'localhost']
      
      expect(authenticator.validateIPAddress('127.0.0.1', allowlist)).toBe(true)
      expect(authenticator.validateIPAddress('localhost', allowlist)).toBe(true)
    })
  })

  describe('generateSignature', () => {
    it('should generate valid signature', () => {
      const signature = authenticator.generateSignature(testPayload, testSecret)
      
      expect(signature).toMatch(/^sha256=[a-f0-9]{64}$/)
    })

    it('should generate consistent signatures for same input', () => {
      const signature1 = authenticator.generateSignature(testPayload, testSecret)
      const signature2 = authenticator.generateSignature(testPayload, testSecret)
      
      expect(signature1).toBe(signature2)
    })

    it('should generate different signatures for different payloads', () => {
      const payload1 = { type: 'game_update', data: { game_id: '123' } }
      const payload2 = { type: 'game_update', data: { game_id: '456' } }
      
      const signature1 = authenticator.generateSignature(payload1, testSecret)
      const signature2 = authenticator.generateSignature(payload2, testSecret)
      
      expect(signature1).not.toBe(signature2)
    })

    it('should generate different signatures for different secrets', () => {
      const secret1 = 'secret1-for-testing-purposes-32-chars'
      const secret2 = 'secret2-for-testing-purposes-32-chars'
      
      const signature1 = authenticator.generateSignature(testPayload, secret1)
      const signature2 = authenticator.generateSignature(testPayload, secret2)
      
      expect(signature1).not.toBe(signature2)
    })
  })

  describe('extractClientIP', () => {
    it('should extract IP from X-Forwarded-For header', () => {
      const headers = { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' }
      const ip = authenticator.extractClientIP(headers)
      
      expect(ip).toBe('192.168.1.1')
    })

    it('should extract IP from X-Real-IP header', () => {
      const headers = { 'x-real-ip': '192.168.1.1' }
      const ip = authenticator.extractClientIP(headers)
      
      expect(ip).toBe('192.168.1.1')
    })

    it('should extract IP from X-Client-IP header', () => {
      const headers = { 'x-client-ip': '192.168.1.1' }
      const ip = authenticator.extractClientIP(headers)
      
      expect(ip).toBe('192.168.1.1')
    })

    it('should prioritize X-Forwarded-For over other headers', () => {
      const headers = {
        'x-forwarded-for': '192.168.1.1',
        'x-real-ip': '10.0.0.1',
        'x-client-ip': '172.16.0.1'
      }
      const ip = authenticator.extractClientIP(headers)
      
      expect(ip).toBe('192.168.1.1')
    })

    it('should handle array header values', () => {
      const headers = { 'x-forwarded-for': ['192.168.1.1, 10.0.0.1'] }
      const ip = authenticator.extractClientIP(headers)
      
      expect(ip).toBe('192.168.1.1')
    })

    it('should return unknown for missing headers', () => {
      const headers = {}
      const ip = authenticator.extractClientIP(headers)
      
      expect(ip).toBe('unknown')
    })

    it('should trim whitespace from IP addresses', () => {
      const headers = { 'x-forwarded-for': ' 192.168.1.1 , 10.0.0.1' }
      const ip = authenticator.extractClientIP(headers)
      
      expect(ip).toBe('192.168.1.1')
    })
  })

  describe('validateWebhookRequest', () => {
    it('should validate complete webhook request successfully', () => {
      const signature = authenticator.generateSignature(testPayload, testSecret)
      const clientIP = '192.168.1.1'
      const allowedIPs = ['192.168.1.1', '10.0.0.1']
      
      const result = authenticator.validateWebhookRequest(
        testPayload,
        signature,
        testSecret,
        clientIP,
        allowedIPs
      )
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail validation for invalid signature', () => {
      const invalidSignature = 'sha256=invalid'
      const clientIP = '192.168.1.1'
      const allowedIPs = ['192.168.1.1']
      
      const result = authenticator.validateWebhookRequest(
        testPayload,
        invalidSignature,
        testSecret,
        clientIP,
        allowedIPs
      )
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid HMAC signature')
    })

    it('should fail validation for unauthorized IP', () => {
      const signature = authenticator.generateSignature(testPayload, testSecret)
      const clientIP = '192.168.1.2'
      const allowedIPs = ['192.168.1.1']
      
      const result = authenticator.validateWebhookRequest(
        testPayload,
        signature,
        testSecret,
        clientIP,
        allowedIPs
      )
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('IP address not allowed')
    })

    it('should fail validation for both invalid signature and unauthorized IP', () => {
      const invalidSignature = 'sha256=invalid'
      const clientIP = '192.168.1.2'
      const allowedIPs = ['192.168.1.1']
      
      const result = authenticator.validateWebhookRequest(
        testPayload,
        invalidSignature,
        testSecret,
        clientIP,
        allowedIPs
      )
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid HMAC signature')
      expect(result.errors).toContain('IP address not allowed')
      expect(result.errors).toHaveLength(2)
    })

    it('should pass validation when no IP allowlist is provided', () => {
      const signature = authenticator.generateSignature(testPayload, testSecret)
      const clientIP = '192.168.1.1'
      
      const result = authenticator.validateWebhookRequest(
        testPayload,
        signature,
        testSecret,
        clientIP
      )
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('Edge Cases and Security Tests', () => {
    it('should handle very large payloads', () => {
      const largePayload = {
        type: 'game_update',
        data: {
          game_id: '123',
          large_data: 'x'.repeat(10000) // 10KB of data
        }
      }
      
      const signature = authenticator.generateSignature(largePayload, testSecret)
      const isValid = authenticator.validateSignature(largePayload, signature, testSecret)
      
      expect(isValid).toBe(true)
    })

    it('should handle special characters in payload', () => {
      const specialPayload = {
        type: 'game_update',
        data: {
          game_id: '123',
          special_chars: '!@#$%^&*()_+-=[]{}|;:,.<>?`~'
        }
      }
      
      const signature = authenticator.generateSignature(specialPayload, testSecret)
      const isValid = authenticator.validateSignature(specialPayload, signature, testSecret)
      
      expect(isValid).toBe(true)
    })

    it('should handle Unicode characters in payload', () => {
      const unicodePayload = {
        type: 'game_update',
        data: {
          game_id: '123',
          unicode_text: '🏀⚽🏈🎾🏐🏓🏸🥊'
        }
      }
      
      const signature = authenticator.generateSignature(unicodePayload, testSecret)
      const isValid = authenticator.validateSignature(unicodePayload, signature, testSecret)
      
      expect(isValid).toBe(true)
    })

    it('should handle nested objects in payload', () => {
      const nestedPayload = {
        type: 'game_update',
        data: {
          game_id: '123',
          nested: {
            level1: {
              level2: {
                level3: 'deep_value'
              }
            }
          }
        }
      }
      
      const signature = authenticator.generateSignature(nestedPayload, testSecret)
      const isValid = authenticator.validateSignature(nestedPayload, signature, testSecret)
      
      expect(isValid).toBe(true)
    })

    it('should handle arrays in payload', () => {
      const arrayPayload = {
        type: 'game_update',
        data: {
          game_id: '123',
          scores: [10, 20, 30],
          players: ['player1', 'player2', 'player3']
        }
      }
      
      const signature = authenticator.generateSignature(arrayPayload, testSecret)
      const isValid = authenticator.validateSignature(arrayPayload, signature, testSecret)
      
      expect(isValid).toBe(true)
    })
  })
})