#!/usr/bin/env node

/**
 * API Health Check Script
 * Tests all sports API clients and their configurations
 */

const fetch = require('node-fetch')

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

async function testAPIEndpoint(endpoint, description) {
  try {
    console.log(`\n🔍 Testing: ${description}`)
    console.log(`   Endpoint: ${endpoint}`)

    const response = await fetch(`${API_BASE_URL}${endpoint}`)
    const data = await response.json()

    if (response.ok) {
      console.log(`   ✅ Status: ${response.status} - ${response.statusText}`)

      // Analyze response data
      if (data.data && Array.isArray(data.data)) {
        console.log(`   📊 Results: ${data.data.length} items`)
        if (data.data.length > 0) {
          console.log(`   📝 Sample: ${JSON.stringify(data.data[0], null, 2).substring(0, 200)}...`)
        }
      } else if (data.live || data.recent || data.upcoming) {
        console.log(
          `   📊 Live: ${data.live?.length || 0}, Recent: ${data.recent?.length || 0}, Upcoming: ${data.upcoming?.length || 0}`
        )
        console.log(`   🔄 Data Source: ${data.summary?.dataSource || 'unknown'}`)
      } else {
        console.log(`   📊 Response: ${JSON.stringify(data, null, 2).substring(0, 200)}...`)
      }
    } else {
      console.log(`   ❌ Status: ${response.status} - ${response.statusText}`)
      console.log(`   🚨 Error: ${data.error || 'Unknown error'}`)
    }

    return { success: response.ok, data, status: response.status }
  } catch (error) {
    console.log(`   💥 Network Error: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function main() {
  console.log('🏈 ProjectApex API Health Check')
  console.log('================================')
  console.log(`Base URL: ${API_BASE_URL}`)

  const sports = ['basketball', 'football', 'baseball', 'hockey', 'soccer']
  const testResults = []

  // Test basic health endpoint
  const healthResult = await testAPIEndpoint('/api/health', 'Basic Health Check')
  testResults.push({ endpoint: '/api/health', ...healthResult })

  // Test sports configuration
  const sportsResult = await testAPIEndpoint('/api/sports', 'Sports Configuration')
  testResults.push({ endpoint: '/api/sports', ...sportsResult })

  for (const sport of sports) {
    console.log(`\n🏆 Testing Sport: ${sport.toUpperCase()}`)
    console.log('─'.repeat(50))

    // Test database-based endpoints
    const gamesResult = await testAPIEndpoint(
      `/api/games?sport=${sport}&limit=5`,
      `${sport} games (database)`
    )
    testResults.push({ endpoint: `/api/games?sport=${sport}`, ...gamesResult })

    // Test external API mode
    const externalGamesResult = await testAPIEndpoint(
      `/api/games?sport=${sport}&external=true&limit=5`,
      `${sport} games (external APIs)`
    )
    testResults.push({
      endpoint: `/api/games?sport=${sport}&external=true`,
      ...externalGamesResult,
    })

    // Test live updates (database)
    const liveResult = await testAPIEndpoint(
      `/api/live-updates?sport=${sport}`,
      `${sport} live updates (database)`
    )
    testResults.push({ endpoint: `/api/live-updates?sport=${sport}`, ...liveResult })

    // Test live updates (real APIs)
    const realLiveResult = await testAPIEndpoint(
      `/api/live-updates?sport=${sport}&real=true`,
      `${sport} live updates (real APIs)`
    )
    testResults.push({ endpoint: `/api/live-updates?sport=${sport}&real=true`, ...realLiveResult })

    // Test teams
    const teamsResult = await testAPIEndpoint(`/api/teams?sport=${sport}&limit=5`, `${sport} teams`)
    testResults.push({ endpoint: `/api/teams?sport=${sport}`, ...teamsResult })
  }

  // Generate summary report
  console.log('\n📋 SUMMARY REPORT')
  console.log('=================')

  const successful = testResults.filter(r => r.success)
  const failed = testResults.filter(r => !r.success)

  console.log(`✅ Successful: ${successful.length}/${testResults.length}`)
  console.log(`❌ Failed: ${failed.length}/${testResults.length}`)

  if (failed.length > 0) {
    console.log('\n🚨 FAILED ENDPOINTS:')
    failed.forEach(result => {
      console.log(`   ❌ ${result.endpoint} - ${result.error || result.status}`)
    })
  }

  // Check for empty data issues
  console.log('\n📊 DATA QUALITY ANALYSIS:')
  const emptyResults = successful.filter(r => {
    if (r.data?.data && Array.isArray(r.data.data)) {
      return r.data.data.length === 0
    }
    if (r.data?.live !== undefined || r.data?.recent !== undefined) {
      return (
        (r.data.live?.length || 0) +
          (r.data.recent?.length || 0) +
          (r.data.upcoming?.length || 0) ===
        0
      )
    }
    return false
  })

  if (emptyResults.length > 0) {
    console.log('   ⚠️  ENDPOINTS WITH NO DATA:')
    emptyResults.forEach(result => {
      console.log(`     - ${result.endpoint}`)
    })
  } else {
    console.log('   ✅ All successful endpoints returned data')
  }

  // Check real vs database data sources
  const realDataEndpoints = testResults.filter(r => r.endpoint.includes('real=true') && r.success)
  const dbDataEndpoints = testResults.filter(
    r => !r.endpoint.includes('real=true') && !r.endpoint.includes('external=true') && r.success
  )

  console.log(`\n🔄 DATA SOURCES:`)
  console.log(`   📡 Real API endpoints working: ${realDataEndpoints.length}`)
  console.log(`   🗄️  Database endpoints working: ${dbDataEndpoints.length}`)

  // Final recommendations
  console.log('\n💡 RECOMMENDATIONS:')
  if (failed.length > 0) {
    console.log('   1. Fix failed endpoints listed above')
  }
  if (emptyResults.length > 0) {
    console.log('   2. Populate database with real data using data sync scripts')
    console.log('   3. Configure missing API keys in environment variables')
  }
  if (realDataEndpoints.length > dbDataEndpoints.length) {
    console.log(
      '   4. Database appears to have stale/incorrect data - consider running data population scripts'
    )
  }

  console.log('\n🏁 Health check complete!')

  // Exit with error code if critical issues found
  if (failed.length > testResults.length * 0.3) {
    // More than 30% failed
    process.exit(1)
  }
}

// Run the health check
main().catch(error => {
  console.error('Health check script failed:', error)
  process.exit(1)
})
