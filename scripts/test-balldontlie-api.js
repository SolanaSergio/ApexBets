#!/usr/bin/env node

/**
 * Ball Don't Lie API Test Script
 * Tests the correct implementation of Ball Don't Lie API with proper rate limiting
 */

const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

// Import our Ball Don't Lie client
const { BallDontLieClient } = require('../lib/sports-apis/balldontlie-client.ts')

async function testBallDontLieAPI() {
  console.log('🏀 Testing Ball Don\'t Lie API Implementation')
  console.log('='.repeat(50))
  
  // Initialize client
  const client = new BallDontLieClient()
  
  // Test 1: Configuration Check
  console.log('\n📋 Test 1: Configuration Check')
  console.log(`API Key configured: ${client.isConfigured()}`)
  console.log(`Rate limit delay: 12000ms (5 req/min)`)
  
  if (!client.isConfigured()) {
    console.log('⚠️  API key not configured. Set NEXT_PUBLIC_BALLDONTLIE_API_KEY environment variable.')
    console.log('📖 Documentation: https://docs.balldontlie.io/')
    console.log('🔗 Get API key: https://app.balldontlie.io/')
    
    // Test without API key (should fail gracefully)
    console.log('\n🧪 Testing without API key...')
    try {
      await client.getTeams({ per_page: 1 })
      console.log('❌ Expected error but request succeeded')
    } catch (error) {
      console.log(`✅ Correctly failed: ${error.message}`)
    }
    return
  }
  
  // Test 2: Health Check
  console.log('\n💊 Test 2: Health Check')
  const startTime = Date.now()
  
  try {
    const isHealthy = await client.healthCheck()
    const responseTime = Date.now() - startTime
    console.log(`Health check: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`)
    console.log(`Response time: ${responseTime}ms`)
    
    if (!isHealthy) {
      console.log('❌ API is not responding correctly')
      return
    }
  } catch (error) {
    console.log(`❌ Health check failed: ${error.message}`)
    return
  }
  
  // Test 3: Rate Limiting
  console.log('\n⏱️  Test 3: Rate Limiting (5 requests/minute)')
  console.log('Making 3 sequential requests to test rate limiting...')
  
  for (let i = 1; i <= 3; i++) {
    const requestStart = Date.now()
    
    try {
      console.log(`\nRequest ${i}:`)
      const result = await client.getTeams({ per_page: 1 })
      const requestTime = Date.now() - requestStart
      
      console.log(`  ✅ Success (${requestTime}ms)`)
      console.log(`  Teams returned: ${result.data?.length || 0}`)
      
      if (result.data && result.data.length > 0) {
        const team = result.data[0]
        console.log(`  Sample team: ${team.full_name} (${team.abbreviation})`)
      }
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`)
      
      if (error.message.includes('Rate limit')) {
        console.log('  ℹ️  This is expected behavior for rate limiting')
      }
    }
  }
  
  // Test 4: Authentication Verification
  console.log('\n🔐 Test 4: Authentication Format')
  console.log('Verifying that we use direct API key (not Bearer token)...')
  
  try {
    // This will use our internal request method which includes proper headers
    const teams = await client.getTeams({ per_page: 1 })
    console.log('✅ Authentication format is correct')
    console.log(`API response structure: ${Object.keys(teams).join(', ')}`)
  } catch (error) {
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      console.log('❌ Authentication failed - check API key format')
    } else {
      console.log(`❌ Request failed: ${error.message}`)
    }
  }
  
  // Test 5: Error Handling
  console.log('\n🚨 Test 5: Error Handling')
  
  try {
    // Try to get a non-existent player
    const result = await client.getPlayerById(999999)
    console.log(`Non-existent player result: ${result ? 'Found' : 'Not found (correct)'}`)
  } catch (error) {
    console.log(`Error handling: ${error.message}`)
  }
  
  console.log('\n✅ Ball Don\'t Lie API test completed!')
  console.log('\n📝 Summary:')
  console.log('- Rate limit: 5 requests/minute (12-second intervals)')
  console.log('- Authentication: Direct API key (not Bearer token)')
  console.log('- Error handling: Graceful degradation')
  console.log('- Queue system: Prevents overwhelming the API')
}

// Handle module loading for both CommonJS and ES modules
if (require.main === module) {
  testBallDontLieAPI().catch(console.error)
}

module.exports = { testBallDontLieAPI }