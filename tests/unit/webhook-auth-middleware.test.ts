/**
 * Unit tests for webhook authentication middleware logic
 * Tests the authentication functions in isolation
 */

import { hmacWebhookAuthenticator } from '@/lib/security/hmac-webhook-authenticator'

describe('Webhook Authentication Middleware', () => {
  const testSecret = 'test_webhook_secret_key_for_testing_purposes_minimum_32_chars'
  
  describe('HMAC Signature Generation and Validation', () => {
    test('should generate valid HMAC signature', () => {
      const payload = { test: 'data', number: 123 }
      const signature = hmacWebhookAuthenticator.generateSignature(payload, testSecret)
      
      expect(signature).toMatch(/^sha256=[a-f0-9]{64}$/)
      expect(signature).toContain('sha256=')
    })

    test('should validate correct HMAC signature', () => {
      const payload = { test: 'data', number: 123 }
      const signature = hmacWebhookAuthenticator.generateSignature(payload, testSecret)
      
      const isValid = hmacWebhookAuthenticator.validateSignature(payload, signature, testSecret)
      expect(isValid).toBe(true)
    })

    test('should reject invalid HMAC signature', () => {
      const payload = { test: 'data', number: 123 }
      const invalidSignature = 'sha256=invalid_signature_here'
      
      const isValid = hmacWebhookAuthenticator.validateSignature(payload, invalidSignature, testSecret)
      expect(isValid).toBe(false)
    })

    test('should reject signature without proper prefix', () => {
      const payload = { test: 'data' }
      const signatureWithoutPrefix = 'abcd1234567890'
      
      const isValid = hmacWebhookAuthenticator.validateSignature(payload, signatureWithoutPrefix, testSecret)
      expect(isValid).toBe(false)
    })

    test('should handle string payloads', () => {
      const payload = '{"test":"data","number":123}'
      const signature = hmacWebhookAuthenticator.generateSignature(payload, testSecret)
      
      const isValid = hmacWebhookAuthenticator.validateSignature(payload, signature, testSecret)
      expect(isValid).toBe(true)
    })

    test('should detect payload tampering', () => {
      const originalPayload = { test: 'data', number: 123 }
      const tamperedPayload = { test: 'data', number: 456 }
      
      const signature = hmacWebhookAuthenticator.generateSignature(originalPayload, testSecret)
      const isValid = hmacWebhookAuthenticator.validateSignature(tamperedPayload, signature, testSecret)
      
      expect(isValid).toBe(false)
    })
  })

  describe('IP Address Validation', () => {
    test('should allow all IPs when allowlist is empty', () => {
      const isValid = hmacWebhookAuthenticator.validateIPAddress('192.168.1.1', [])
      expect(isValid).toBe(true)
    })

    test('should allow IP in allowlist', () => {
      const allowlist = ['192.168.1.1', '10.0.0.1', '203.0.113.1']
      const isValid = hmacWebhookAuthenticator.validateIPAddress('192.168.1.1', allowlist)
      expect(isValid).toBe(true)
    })

    test('should reject IP not in allowlist', () => {
      const allowlist = ['192.168.1.1', '10.0.0.1']
      const isValid = hmacWebhookAuthenticator.validateIPAddress('192.168.1.100', allowlist)
      expect(isValid).toBe(false)
    })

    test('should handle invalid IP format', () => {
      const allowlist = ['192.168.1.1']
      const isValid = hmacWebhookAuthenticator.validateIPAddress('', allowlist)
      expect(isValid).toBe(false)
    })
  })

  describe('IP Address Extraction', () => {
    test('should extract IP from X-Forwarded-For header', () => {
      const headers = { 'x-forwarded-for': '203.0.113.1, 192.168.1.1' }
      const ip = hmacWebhookAuthenticator.extractClientIP(headers)
      expect(ip).toBe('203.0.113.1')
    })

    test('should extract IP from X-Real-IP header', () => {
      const headers = { 'x-real-ip': '203.0.113.2' }
      const ip = hmacWebhookAuthenticator.extractClientIP(headers)
      expect(ip).toBe('203.0.113.2')
    })

    test('should extract IP from X-Client-IP header', () => {
      const headers = { 'x-client-ip': '203.0.113.3' }
      const ip = hmacWebhookAuthenticator.extractClientIP(headers)
      expect(ip).toBe('203.0.113.3')
    })

    test('should handle array header values', () => {
      const headers = { 'x-forwarded-for': ['203.0.113.4, 192.168.1.1'] }
      const ip = hmacWebhookAuthenticator.extractClientIP(headers)
      expect(ip).toBe('203.0.113.4')
    })

    test('should return unknown for missing headers', () => {
      const headers = {}
      const ip = hmacWebhookAuthenticator.extractClientIP(headers)
      expect(ip).toBe('unknown')
    })

    test('should prioritize X-Forwarded-For over other headers', () => {
      const headers = {
        'x-forwarded-for': '203.0.113.5',
        'x-real-ip': '203.0.113.6',
        'x-client-ip': '203.0.113.7'
      }
      const ip = hmacWebhookAuthenticator.extractClientIP(headers)
      expect(ip).toBe('203.0.113.5')
    })
  })

  describe('Complete Webhook Validation', () => {
    test('should validate complete webhook request successfully', () => {
      const payload = { test: 'data' }
      const signature = hmacWebhookAuthenticator.generateSignature(payload, testSecret)
      const clientIP = '192.168.1.1'
      const allowedIPs = ['192.168.1.1', '10.0.0.1']
      
      const result = hmacWebhookAuthenticator.validateWebhookRequest(
        payload,
        signature,
        testSecret,
        clientIP,
        allowedIPs
      )
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should fail validation with invalid signature', () => {
      const payload = { test: 'data' }
      const invalidSignature = 'sha256=invalid'
      const clientIP = '192.168.1.1'
      const allowedIPs = ['192.168.1.1']
      
      const result = hmacWebhookAuthenticator.validateWebhookRequest(
        payload,
        invalidSignature,
        testSecret,
        clientIP,
        allowedIPs
      )
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid HMAC signature')
    })

    test('should fail validation with blocked IP', () => {
      const payload = { test: 'data' }
      const signature = hmacWebhookAuthenticator.generateSignature(payload, testSecret)
      const clientIP = '192.168.1.100'
      const allowedIPs = ['192.168.1.1', '10.0.0.1']
      
      const result = hmacWebhookAuthenticator.validateWebhookRequest(
        payload,
        signature,
        testSecret,
        clientIP,
        allowedIPs
      )
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('IP address not allowed')
    })

    test('should accumulate multiple validation errors', () => {
      const payload = { test: 'data' }
      const invalidSignature = 'sha256=invalid'
      const clientIP = '192.168.1.100'
      const allowedIPs = ['192.168.1.1']
      
      const result = hmacWebhookAuthenticator.validateWebhookRequest(
        payload,
        invalidSignature,
        testSecret,
        clientIP,
        allowedIPs
      )
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(2)
      expect(result.errors).toContain('Invalid HMAC signature')
      expect(result.errors).toContain('IP address not allowed')
    })
  })

  describe('Error Handling', () => {
    test('should handle null/undefined inputs gracefully', () => {
      expect(hmacWebhookAuthenticator.validateSignature(null as any, '', testSecret)).toBe(false)
      expect(hmacWebhookAuthenticator.validateSignature({}, null as any, testSecret)).toBe(false)
      expect(hmacWebhookAuthenticator.validateSignature({}, 'sha256=test', null as any)).toBe(false)
    })

    test('should handle malformed signatures gracefully', () => {
      const payload = { test: 'data' }
      expect(hmacWebhookAuthenticator.validateSignature(payload, 'malformed', testSecret)).toBe(false)
      expect(hmacWebhookAuthenticator.validateSignature(payload, '', testSecret)).toBe(false)
    })

    test('should handle IP validation errors gracefully', () => {
      expect(hmacWebhookAuthenticator.validateIPAddress(null as any, ['192.168.1.1'])).toBe(false)
      expect(hmacWebhookAuthenticator.validateIPAddress('192.168.1.1', null as any)).toBe(true)
    })
  })
})