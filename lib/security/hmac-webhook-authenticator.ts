/**
 * HMAC Webhook Authentication System
 * Implements secure webhook authentication using HMAC-SHA256 signatures
 */

import crypto from 'crypto'

export interface WebhookAuthenticator {
  validateSignature(payload: any, signature: string, secret: string): boolean
  validateIPAddress(ip: string, allowlist: string[]): boolean
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * HMAC-SHA256 Webhook Authenticator
 * Provides cryptographically secure webhook authentication
 */
export class HMACWebhookAuthenticator implements WebhookAuthenticator {
  private readonly algorithm = 'sha256'
  private readonly signaturePrefix = 'sha256='

  /**
   * Validates HMAC-SHA256 signature for webhook payload
   * Uses timing-safe comparison to prevent timing attacks
   * 
   * @param payload - The webhook payload (will be JSON stringified)
   * @param signature - The signature from webhook headers (e.g., X-Hub-Signature-256)
   * @param secret - The webhook secret for HMAC generation
   * @returns boolean indicating if signature is valid
   */
  validateSignature(payload: any, signature: string, secret: string): boolean {
    try {
      // Validate inputs
      if (!payload || !signature || !secret) {
        return false
      }

      // Ensure signature has proper prefix
      if (!signature.startsWith(this.signaturePrefix)) {
        return false
      }

      // Generate expected signature
      const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload)
      const expectedSignature = crypto
        .createHmac(this.algorithm, secret)
        .update(payloadString, 'utf8')
        .digest('hex')

      const fullExpectedSignature = `${this.signaturePrefix}${expectedSignature}`

      // Use timing-safe comparison to prevent timing attacks
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'utf8'),
        Buffer.from(fullExpectedSignature, 'utf8')
      )
    } catch (error) {
      // Log error for debugging but don't expose details
      console.error('HMAC signature validation error:', error instanceof Error ? error.message : 'Unknown error')
      return false
    }
  }

  /**
   * Validates IP address against allowlist
   * Empty allowlist means all IPs are allowed
   * 
   * @param ip - The client IP address
   * @param allowlist - Array of allowed IP addresses
   * @returns boolean indicating if IP is allowed
   */
  validateIPAddress(ip: string, allowlist: string[]): boolean {
    try {
      // If no allowlist is configured, allow all IPs
      if (!allowlist || allowlist.length === 0) {
        return true
      }

      // Validate IP format
      if (!ip || typeof ip !== 'string') {
        return false
      }

      // Clean IP address (remove port if present)
      const cleanIp = this.cleanIPAddress(ip)

      // Check if IP is in allowlist
      return allowlist.includes(cleanIp)
    } catch (error) {
      console.error('IP validation error:', error instanceof Error ? error.message : 'Unknown error')
      return false
    }
  }

  /**
   * Generates HMAC signature for testing purposes
   * 
   * @param payload - The payload to sign
   * @param secret - The secret key
   * @returns The full signature with prefix
   */
  generateSignature(payload: any, secret: string): string {
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload)
    const signature = crypto
      .createHmac(this.algorithm, secret)
      .update(payloadString, 'utf8')
      .digest('hex')
    
    return `${this.signaturePrefix}${signature}`
  }

  /**
   * Extracts client IP from request headers
   * Handles X-Forwarded-For and other proxy headers
   * 
   * @param headers - Request headers object
   * @returns The client IP address
   */
  extractClientIP(headers: Record<string, string | string[] | undefined>): string {
    // Check X-Forwarded-For header (most common proxy header)
    const xForwardedFor = headers['x-forwarded-for']
    if (xForwardedFor) {
      const ips = Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor
      // Take the first IP in the chain (original client)
      return ips.split(',')[0].trim()
    }

    // Check other common proxy headers
    const xRealIp = headers['x-real-ip']
    if (xRealIp) {
      return Array.isArray(xRealIp) ? xRealIp[0] : xRealIp
    }

    const xClientIp = headers['x-client-ip']
    if (xClientIp) {
      return Array.isArray(xClientIp) ? xClientIp[0] : xClientIp
    }

    // Fallback to connection remote address
    const remoteAddress = headers['remote-address'] || headers['connection-remote-address']
    if (remoteAddress) {
      return Array.isArray(remoteAddress) ? remoteAddress[0] : remoteAddress
    }

    // Default fallback
    return 'unknown'
  }

  /**
   * Cleans IP address by removing port information
   * Handles both IPv4 and IPv6 addresses
   * 
   * @param ip - Raw IP address that may include port
   * @returns Clean IP address without port
   */
  private cleanIPAddress(ip: string): string {
    // Handle IPv6 addresses with ports [::1]:8080
    if (ip.startsWith('[') && ip.includes(']:')) {
      return ip.substring(1, ip.indexOf(']:'))
    }
    
    // Handle IPv4 addresses with ports 192.168.1.1:8080
    if (ip.includes(':') && !ip.includes('::')) {
      // Check if it's IPv4 with port (contains only one colon)
      const colonCount = (ip.match(/:/g) || []).length
      if (colonCount === 1) {
        return ip.split(':')[0]
      }
    }
    
    // Return as-is for IPv6 without port or already clean addresses
    return ip
  }

  /**
   * Validates webhook request completely
   * Combines signature and IP validation
   * 
   * @param payload - The webhook payload
   * @param signature - The signature from headers
   * @param secret - The webhook secret
   * @param clientIP - The client IP address
   * @param allowedIPs - Array of allowed IP addresses
   * @returns ValidationResult with details
   */
  validateWebhookRequest(
    payload: any,
    signature: string,
    secret: string,
    clientIP: string,
    allowedIPs: string[] = []
  ): ValidationResult {
    const errors: string[] = []

    // Validate signature
    if (!this.validateSignature(payload, signature, secret)) {
      errors.push('Invalid HMAC signature')
    }

    // Validate IP address
    if (!this.validateIPAddress(clientIP, allowedIPs)) {
      errors.push('IP address not allowed')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// Export singleton instance
export const hmacWebhookAuthenticator = new HMACWebhookAuthenticator()