/**
 * Webhook Authentication Middleware
 * Provides middleware functions for securing webhook endpoints
 */

import { NextRequest, NextResponse } from 'next/server'
import { hmacWebhookAuthenticator } from './hmac-webhook-authenticator'

export interface WebhookAuthConfig {
  secret: string
  allowedIPs?: string[]
  requireSignature?: boolean
  signatureHeader?: string
}

/**
 * Middleware function to authenticate webhook requests
 *
 * @param request - The Next.js request object
 * @param config - Webhook authentication configuration
 * @returns Promise<NextResponse | null> - Returns error response or null if valid
 */
export async function authenticateWebhook(
  request: NextRequest,
  config: WebhookAuthConfig
): Promise<NextResponse | null> {
  try {
    // Extract client IP
    const clientIP = hmacWebhookAuthenticator.extractClientIP({
      'x-forwarded-for': request.headers.get('x-forwarded-for') || undefined,
      'x-real-ip': request.headers.get('x-real-ip') || undefined,
      'x-client-ip': request.headers.get('x-client-ip') || undefined,
    })

    // Get request body
    const body = await request.text()
    let payload: any

    try {
      payload = JSON.parse(body)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    // Validate signature if required
    if (config.requireSignature !== false) {
      const signatureHeader = config.signatureHeader || 'x-hub-signature-256'
      const signature = request.headers.get(signatureHeader)

      if (!signature) {
        return NextResponse.json({ error: 'Missing webhook signature' }, { status: 401 })
      }

      const validationResult = hmacWebhookAuthenticator.validateWebhookRequest(
        payload,
        signature,
        config.secret,
        clientIP,
        config.allowedIPs || []
      )

      if (!validationResult.isValid) {
        return NextResponse.json(
          {
            error: 'Webhook authentication failed',
            details: validationResult.errors,
          },
          { status: 401 }
        )
      }
    } else {
      // Just validate IP if signature validation is disabled
      if (!hmacWebhookAuthenticator.validateIPAddress(clientIP, config.allowedIPs || [])) {
        return NextResponse.json({ error: 'IP address not allowed' }, { status: 403 })
      }
    }

    // Authentication successful
    return null
  } catch (error) {
    console.error('Webhook authentication error:', error)
    return NextResponse.json({ error: 'Internal authentication error' }, { status: 500 })
  }
}

/**
 * Higher-order function to create authenticated webhook handlers
 *
 * @param handler - The webhook handler function
 * @param config - Webhook authentication configuration
 * @returns Authenticated webhook handler
 */
export function withWebhookAuth(
  handler: (request: NextRequest, payload: any) => Promise<NextResponse>,
  config: WebhookAuthConfig
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Authenticate the request
    const authError = await authenticateWebhook(request, config)
    if (authError) {
      return authError
    }

    // Parse payload for the handler
    const body = await request.text()
    const payload = JSON.parse(body)

    // Call the original handler
    return handler(request, payload)
  }
}

/**
 * Utility function to get webhook configuration from environment
 *
 * @returns WebhookAuthConfig from environment variables
 */
export function getWebhookConfigFromEnv(): WebhookAuthConfig {
  const secret = process.env.WEBHOOK_SECRET
  if (!secret) {
    throw new Error('WEBHOOK_SECRET environment variable is required')
  }

  const allowedIPsEnv = process.env.WEBHOOK_ALLOWED_IPS
  const allowedIPs = allowedIPsEnv ? allowedIPsEnv.split(',').map(ip => ip.trim()) : []

  return {
    secret,
    allowedIPs,
    requireSignature: process.env.WEBHOOK_REQUIRE_SIGNATURE !== 'false',
    signatureHeader: process.env.WEBHOOK_SIGNATURE_HEADER as string,
  }
}
