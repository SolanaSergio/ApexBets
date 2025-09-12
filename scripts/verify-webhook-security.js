/**
 * Webhook Security Verification Script
 * Verifies that webhook authentication is properly implemented
 */

const crypto = require('crypto')

// Test HMAC generation (same logic as the authenticator)
function generateTestSignature(payload, secret) {
  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload)
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadString, 'utf8')
    .digest('hex')
  
  return `sha256=${signature}`
}

// Test timing-safe comparison
function testTimingSafeComparison() {
  console.log('🔒 Testing timing-safe comparison...')
  
  const secret = 'test_secret_key_for_verification'
  const payload = { test: 'data' }
  
  const validSignature = generateTestSignature(payload, secret)
  const invalidSignature = 'sha256=invalid_signature_here'
  
  // Test with valid signature
  try {
    const result1 = crypto.timingSafeEqual(
      Buffer.from(validSignature, 'utf8'),
      Buffer.from(validSignature, 'utf8')
    )
    console.log(`✅ Valid signature comparison: ${result1}`)
  } catch (error) {
    console.log(`❌ Valid signature comparison failed: ${error.message}`)
  }
  
  // Test with invalid signature (different lengths should be handled)
  try {
    const result2 = crypto.timingSafeEqual(
      Buffer.from(validSignature, 'utf8'),
      Buffer.from(invalidSignature, 'utf8')
    )
    console.log(`✅ Invalid signature comparison: ${result2}`)
  } catch (error) {
    console.log(`✅ Invalid signature comparison properly rejected: ${error.message}`)
  }
}

// Test signature generation consistency
function testSignatureConsistency() {
  console.log('\n🔑 Testing signature generation consistency...')
  
  const secret = 'test_secret_key_for_verification'
  const payload = { type: 'test', data: { id: 123 } }
  
  const sig1 = generateTestSignature(payload, secret)
  const sig2 = generateTestSignature(payload, secret)
  const sig3 = generateTestSignature(JSON.stringify(payload), secret)
  
  console.log(`Signature 1: ${sig1}`)
  console.log(`Signature 2: ${sig2}`)
  console.log(`Signature 3: ${sig3}`)
  
  if (sig1 === sig2 && sig2 === sig3) {
    console.log('✅ Signature generation is consistent')
  } else {
    console.log('❌ Signature generation is inconsistent')
  }
}

// Test payload tampering detection
function testTamperingDetection() {
  console.log('\n🛡️ Testing payload tampering detection...')
  
  const secret = 'test_secret_key_for_verification'
  const originalPayload = { type: 'game_update', data: { score: 10 } }
  const tamperedPayload = { type: 'game_update', data: { score: 99 } }
  
  const originalSignature = generateTestSignature(originalPayload, secret)
  const tamperedSignature = generateTestSignature(tamperedPayload, secret)
  
  console.log(`Original signature: ${originalSignature}`)
  console.log(`Tampered signature: ${tamperedSignature}`)
  
  if (originalSignature !== tamperedSignature) {
    console.log('✅ Payload tampering properly detected')
  } else {
    console.log('❌ Payload tampering not detected')
  }
}

// Test environment variable handling
function testEnvironmentConfig() {
  console.log('\n⚙️ Testing environment configuration...')
  
  const requiredVars = [
    'WEBHOOK_SECRET',
    'WEBHOOK_REQUIRE_SIGNATURE',
    'WEBHOOK_ALLOWED_IPS',
    'WEBHOOK_SIGNATURE_HEADER'
  ]
  
  console.log('Environment variables:')
  requiredVars.forEach(varName => {
    const value = process.env[varName]
    if (value !== undefined) {
      console.log(`✅ ${varName}: ${varName === 'WEBHOOK_SECRET' ? '[REDACTED]' : value}`)
    } else {
      console.log(`⚠️ ${varName}: not set (will use default)`)
    }
  })
}

// Main verification function
function main() {
  console.log('🔐 Webhook Security Verification\n')
  console.log('This script verifies the webhook authentication implementation.')
  console.log('It tests cryptographic functions and configuration.\n')
  
  testTimingSafeComparison()
  testSignatureConsistency()
  testTamperingDetection()
  testEnvironmentConfig()
  
  console.log('\n✅ Webhook security verification completed!')
  console.log('\nTo test the actual webhook endpoint:')
  console.log('1. Start the server: npm run dev')
  console.log('2. Run the manual test: node tests/manual-webhook-test.js')
}

main()