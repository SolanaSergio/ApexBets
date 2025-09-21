/**
 * Manual webhook authentication test
 * Run this with: node tests/manual-webhook-test.js
 * Make sure the dev server is running: pnpm run dev
 */

const { hmacWebhookAuthenticator } = require('../lib/security/hmac-webhook-authenticator')

const WEBHOOK_URL = 'http://localhost:3000/api/webhooks/sports-data'
const TEST_SECRET = 'test_webhook_secret_key_for_testing_purposes_minimum_32_chars'

// Set environment variables for testing
process.env.WEBHOOK_SECRET = TEST_SECRET
process.env.WEBHOOK_REQUIRE_SIGNATURE = 'true'
process.env.WEBHOOK_ALLOWED_IPS = ''

async function testWebhookAuth() {
  console.log('🧪 Testing Webhook Authentication...\n')

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

  // Test 1: Valid signature
  console.log('Test 1: Valid HMAC signature')
  try {
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
    
    const data = await response.json()
    console.log(`✅ Status: ${response.status}`)
    console.log(`✅ Success: ${data.success}`)
    console.log(`✅ Request ID: ${data.request_id}`)
    console.log(`✅ Headers: X-Request-ID = ${response.headers.get('X-Request-ID')}\n`)
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`)
  }

  // Test 2: Invalid signature
  console.log('Test 2: Invalid HMAC signature')
  try {
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
    
    const data = await response.json()
    console.log(`✅ Status: ${response.status} (expected 401)`)
    console.log(`✅ Error: ${data.error}`)
    console.log(`✅ WWW-Authenticate: ${response.headers.get('WWW-Authenticate')}\n`)
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`)
  }

  // Test 3: Missing signature
  console.log('Test 3: Missing signature')
  try {
    const payload = JSON.stringify(validPayload)
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: payload
    })
    
    const data = await response.json()
    console.log(`✅ Status: ${response.status} (expected 401)`)
    console.log(`✅ Error: ${data.error}\n`)
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`)
  }

  // Test 4: Invalid JSON
  console.log('Test 4: Invalid JSON payload')
  try {
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
    
    const data = await response.json()
    console.log(`✅ Status: ${response.status} (expected 400)`)
    console.log(`✅ Error: ${data.error}\n`)
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`)
  }

  // Test 5: Payload tampering detection
  console.log('Test 5: Payload tampering detection')
  try {
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
    
    const data = await response.json()
    console.log(`✅ Status: ${response.status} (expected 401)`)
    console.log(`✅ Error: ${data.error}\n`)
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`)
  }

  console.log('🎉 Webhook authentication tests completed!')
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/api/health')
    if (response.ok) {
      console.log('✅ Server is running\n')
      return true
    }
  } catch (error) {
    console.log('❌ Server is not running. Please start with: pnpm run dev\n')
    return false
  }
}

// Run tests
async function main() {
  const serverRunning = await checkServer()
  if (serverRunning) {
    await testWebhookAuth()
  }
}

main().catch(console.error)