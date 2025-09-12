/**
 * Example: Secure Webhook Endpoint Implementation
 * 
 * This example shows how to create a secure webhook endpoint using the
 * HMAC webhook authenticator in a Next.js API route.
 * 
 * Place this file in: app/api/webhooks/sports-data/route.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import { withWebhookAuth, getWebhookConfigFromEnv } from '../../../../lib/security'

// Define the webhook payload interface
interface SportsWebhookPayload {
  type: 'game_update' | 'odds_update' | 'team_update'
  data: any
  sport: string
  league: string
  timestamp: string
}

/**
 * Webhook handler function (without authentication logic)
 */
async function handleSportsWebhook(
  request: NextRequest,
  payload: SportsWebhookPayload
): Promise<NextResponse> {
  try {
    console.log(`Received ${payload.type} webhook for ${payload.sport}/${payload.league}`)
    
    // Process the webhook based on type
    switch (payload.type) {
      case 'game_update':
        await processGameUpdate(payload.data)
        break
      case 'odds_update':
        await processOddsUpdate(payload.data)
        break
      case 'team_update':
        await processTeamUpdate(payload.data)
        break
      default:
        return NextResponse.json(
          { error: `Unknown webhook type: ${payload.type}` },
          { status: 400 }
        )
    }

    return NextResponse.json({ 
      success: true, 
      message: `${payload.type} processed successfully` 
    })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

/**
 * Process game update webhook
 */
async function processGameUpdate(data: any): Promise<void> {
  // Example: Update game status in database
  console.log('Processing game update:', data.game_id, data.status)
  
  // Your game update logic here
  // await updateGameInDatabase(data)
}

/**
 * Process odds update webhook
 */
async function processOddsUpdate(data: any): Promise<void> {
  // Example: Update betting odds in database
  console.log('Processing odds update:', data.game_id, data.odds)
  
  // Your odds update logic here
  // await updateOddsInDatabase(data)
}

/**
 * Process team update webhook
 */
async function processTeamUpdate(data: any): Promise<void> {
  // Example: Update team information in database
  console.log('Processing team update:', data.team_id, data.name)
  
  // Your team update logic here
  // await updateTeamInDatabase(data)
}

// Export the authenticated webhook handler
export const POST = withWebhookAuth(handleSportsWebhook, getWebhookConfigFromEnv())

// Alternative approach: Manual authentication
export async function POST_MANUAL_AUTH(request: NextRequest): Promise<NextResponse> {
  const { authenticateWebhook, getWebhookConfigFromEnv } = await import('../../../../lib/security')
  
  // Authenticate the webhook
  const authError = await authenticateWebhook(request, getWebhookConfigFromEnv())
  if (authError) {
    return authError
  }

  // Parse and process the payload
  const body = await request.text()
  const payload: SportsWebhookPayload = JSON.parse(body)
  
  return handleSportsWebhook(request, payload)
}

/**
 * Example usage with custom configuration
 */
export async function POST_CUSTOM_CONFIG(request: NextRequest): Promise<NextResponse> {
  const { withWebhookAuth } = await import('../../../../lib/security')
  
  const customConfig = {
    secret: process.env.WEBHOOK_SECRET!,
    allowedIPs: ['192.168.1.1', '10.0.0.1'], // Only allow specific IPs
    requireSignature: true,
    signatureHeader: 'x-custom-signature'
  }

  const authenticatedHandler = withWebhookAuth(handleSportsWebhook, customConfig)
  return authenticatedHandler(request)
}

/**
 * Example: Testing webhook locally
 * 
 * To test this webhook endpoint:
 * 
 * 1. Set WEBHOOK_SECRET in your .env.local file
 * 2. Generate a test signature:
 * 
 * ```javascript
 * const crypto = require('crypto')
 * const payload = JSON.stringify({
 *   type: 'game_update',
 *   data: { game_id: '123', status: 'live' },
 *   sport: 'basketball',
 *   league: 'NBA',
 *   timestamp: new Date().toISOString()
 * })
 * const secret = 'your-webhook-secret'
 * const signature = 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex')
 * console.log('Signature:', signature)
 * ```
 * 
 * 3. Send a POST request:
 * 
 * ```bash
 * curl -X POST http://localhost:3000/api/webhooks/sports-data \
 *   -H "Content-Type: application/json" \
 *   -H "X-Hub-Signature-256: sha256=your_generated_signature" \
 *   -d '{"type":"game_update","data":{"game_id":"123","status":"live"},"sport":"basketball","league":"NBA","timestamp":"2024-01-01T00:00:00Z"}'
 * ```
 */