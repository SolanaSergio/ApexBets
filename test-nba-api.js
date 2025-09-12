#!/usr/bin/env node

/**
 * NBA Stats API Test - Quick Health Check
 * Tests if NBA Stats API is working (no API key required)
 */

async function testNBAStatsAPI() {
  console.log('🏀 Testing NBA Stats API (No API Key Required)')
  console.log('='.repeat(50))
  
  try {
    // Test scoreboard endpoint (this should definitely work)
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const url = `https://stats.nba.com/stats/scoreboardV2?GameDate=${today}&LeagueID=00&DayOffset=0`
    
    console.log('Making request to:', url)
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.nba.com/',
        'Origin': 'https://www.nba.com'
      }
    })
    
    console.log('Response status:', response.status, response.statusText)
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ NBA Stats API is working!')
      console.log('Response structure:', {
        resource: data.resource,
        resultSets: data.resultSets?.length || 0,
        parameters: Object.keys(data.parameters || {}).length
      })
      
      if (data.resultSets && data.resultSets[0]) {
        const resultSet = data.resultSets[0]
        console.log('Headers:', resultSet.headers)
        console.log(`📊 Found ${resultSet.rowSet?.length || 0} NBA teams`)
        if (resultSet.rowSet && resultSet.rowSet.length > 0) {
          console.log('Sample team data:', resultSet.rowSet[0])
          console.log('Sample team name:', resultSet.rowSet[0]?.[3]) // Team name
        }
      } else {
        console.log('No result sets found in response')
        console.log('Full response:', JSON.stringify(data, null, 2))
      }
    } else {
      console.log('❌ NBA Stats API returned error:', response.status)
      
      if (response.status === 403) {
        console.log('🔧 Possible fixes:')
        console.log('   - Try different User-Agent string')
        console.log('   - Add delay between requests')
        console.log('   - Check if NBA API is temporarily down')
      }
    }
    
  } catch (error) {
    console.log('❌ Error testing NBA Stats API:', error.message)
    
    if (error.message.includes('fetch')) {
      console.log('🔧 Network issue - check internet connection')
    }
  }
}

// Run the test
testNBAStatsAPI().catch(console.error)