/**
 * Comprehensive Functionality Test Script
 * Tests all API endpoints and services to ensure no mock data is being used
 */

const BASE_URL = 'http://localhost:3000'

async function testEndpoint(endpoint, method = 'GET', body = null, timeout = 10000) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    }
    
    if (body) {
      options.body = JSON.stringify(body)
    }
    
    // Create an AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    options.signal = controller.signal
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options)
    clearTimeout(timeoutId)
    
    // Handle Server-Sent Events (live updates)
    if (response.headers.get('content-type')?.includes('text/event-stream')) {
      return {
        success: true,
        status: response.status,
        data: { message: 'SSE stream detected - endpoint is working' },
        endpoint,
        isStream: true
      }
    }
    
    // Handle redirects
    if (response.status >= 300 && response.status < 400) {
      return {
        success: true,
        status: response.status,
        data: { 
          message: 'Redirect response',
          location: response.headers.get('location') || 'No location header'
        },
        endpoint,
        isRedirect: true
      }
    }
    
    // Handle HTML responses (like 404 pages)
    if (response.headers.get('content-type')?.includes('text/html')) {
      return {
        success: false,
        status: response.status,
        data: { message: 'HTML response received instead of JSON' },
        endpoint
      }
    }
    
    const data = await response.json()
    
    return {
      success: response.ok,
      status: response.status,
      data,
      endpoint
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: `Request timeout after ${timeout}ms`,
        endpoint
      }
    }
    return {
      success: false,
      error: error.message,
      endpoint
    }
  }
}

async function runTests() {
  console.log('🧪 Starting Comprehensive Functionality Tests...\n')
  
  const tests = [
    // Health and Environment Tests
    { name: 'Health Check', endpoint: '/api/health', method: 'GET' },
    { name: 'Environment Status', endpoint: '/api/health/status', method: 'GET' },
    
    // Core API Tests
    { name: 'Games API (External)', endpoint: '/api/games?external=true&sport=basketball', method: 'GET' },
    { name: 'Games API (Database)', endpoint: '/api/games', method: 'GET' },
    { name: 'Teams API', endpoint: '/api/teams?sport=basketball', method: 'GET' },
    { name: 'Odds API (External)', endpoint: '/api/odds?external=true&sport=basketball_nba', method: 'GET' },
    { name: 'Odds API (Database)', endpoint: '/api/odds', method: 'GET' },
    
    // Prediction and Analytics Tests
    { name: 'Predictions API', endpoint: '/api/predictions', method: 'GET' },
    { name: 'Value Bets API', endpoint: '/api/value-bets?sport=basketball', method: 'GET' },
    { name: 'Analytics Stats', endpoint: '/api/analytics/stats', method: 'GET' },
    
    // Live Data Tests
    { name: 'Live Scores', endpoint: '/api/live-scores?sport=basketball', method: 'GET' },
    { name: 'Live Updates (SSE)', endpoint: '/api/live-updates', method: 'GET', timeout: 5000 },
    
    // User Features Tests
    { name: 'User Alerts', endpoint: '/api/alerts', method: 'GET' },
    
    // Additional Tests
    { name: 'Image Optimizer', endpoint: '/api/image-optimizer', method: 'GET' },
    { name: 'Debug Simple Games', endpoint: '/api/debug/simple-games', method: 'GET' },
    { name: 'Debug External APIs', endpoint: '/api/debug/external-apis', method: 'GET' },
  ]
  
  const results = []
  
  for (const test of tests) {
    console.log(`Testing ${test.name}...`)
    const result = await testEndpoint(test.endpoint, test.method, test.body, test.timeout)
    results.push(result)
    
    if (result.success) {
      console.log(`✅ ${test.name}: SUCCESS`)
      if (result.isStream) {
        console.log(`   Type: Server-Sent Events stream`)
      } else if (result.isRedirect) {
        console.log(`   Type: Redirect (${result.status})`)
        console.log(`   Location: ${result.data.location}`)
      } else if (result.data && typeof result.data === 'object') {
        console.log(`   Data keys: ${Object.keys(result.data).join(', ')}`)
        if (result.data.data && Array.isArray(result.data.data)) {
          console.log(`   Records: ${result.data.data.length}`)
        }
      }
    } else {
      console.log(`❌ ${test.name}: FAILED`)
      console.log(`   Error: ${result.error || result.data?.error || 'Unknown error'}`)
    }
    console.log('')
  }
  
  // Summary
  const successful = results.filter(r => r.success).length
  const total = results.length
  
  console.log('📊 TEST SUMMARY')
  console.log('================')
  console.log(`Total Tests: ${total}`)
  console.log(`Successful: ${successful}`)
  console.log(`Failed: ${total - successful}`)
  console.log(`Success Rate: ${((successful / total) * 100).toFixed(1)}%`)
  
  // Check for mock data patterns
  console.log('\n🔍 MOCK DATA DETECTION')
  console.log('=====================')
  
  const mockDataPatterns = [
    'mock',
    'placeholder',
    'fake',
    'dummy',
    'Math.random',
    'hardcoded',
    'test_data',
    'lorem ipsum',
    'demo',
    'temp_',
    'test_'
  ]
  
  let mockDataFound = false
  for (const result of results) {
    if (result.data) {
      const dataStr = JSON.stringify(result.data).toLowerCase()
      for (const pattern of mockDataPatterns) {
        if (dataStr.includes(pattern)) {
          console.log(`⚠️  Potential mock data found in ${result.endpoint}: ${pattern}`)
          mockDataFound = true
        }
      }
      
      // Check for suspicious patterns in data
      if (result.data.data && Array.isArray(result.data.data)) {
        const records = result.data.data
        if (records.length > 0) {
          // Check if all records have identical timestamps (suspicious for database records)
          const timestamps = records.map(r => r.created_at || r.timestamp).filter(Boolean)
          if (timestamps.length > 1 && new Set(timestamps).size === 1) {
            // Only flag as suspicious if it's database data, not external API data
            if (!result.endpoint.includes('external=true')) {
              console.log(`⚠️  Suspicious: All records in ${result.endpoint} have identical timestamps`)
              mockDataFound = true
            }
          }
          
          // Check for sequential IDs (might indicate test data)
          const ids = records.map(r => r.id).filter(Boolean).map(Number).filter(n => !isNaN(n))
          if (ids.length > 1) {
            const sortedIds = [...ids].sort((a, b) => a - b)
            const isSequential = sortedIds.every((id, i) => i === 0 || id === sortedIds[i-1] + 1)
            if (isSequential && ids.length > 5) {
              console.log(`⚠️  Suspicious: Sequential IDs detected in ${result.endpoint} (might be test data)`)
              mockDataFound = true
            }
          }
          
          // Check for real data indicators (external APIs often have these)
          const hasRealDataIndicators = records.some(r => 
            r.venue || r.league || r.sport || r.homeScore !== undefined || r.awayScore !== undefined
          )
          
          if (hasRealDataIndicators && result.endpoint.includes('external=true')) {
            console.log(`✅ Real data indicators detected in ${result.endpoint} (venues, scores, leagues)`)
          }
        }
      }
    }
  }
  
  if (!mockDataFound) {
    console.log('✅ No obvious mock data patterns detected')
  }
  
  console.log('\n🎯 RECOMMENDATIONS')
  console.log('==================')
  
  if (successful < total * 0.8) {
    console.log('❌ Low success rate - check environment configuration')
  }
  
  if (successful === total) {
    console.log('✅ All tests passed! System appears to be fully functional')
  }
  
  console.log('\nTest completed!')
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error)
}

module.exports = { runTests, testEndpoint }
