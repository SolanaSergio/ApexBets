/**
 * ODDS POPULATION TEST SCRIPT
 * Tests the odds history service and API integration
 */

import { oddsHistoryService } from '../lib/services/odds/odds-history-service'

async function testOddsPopulation() {
  console.log('🧪 Testing Odds Population Service...\n')

  try {
    // Test 1: Get supported sports
    console.log('1. Testing supported sports...')
    const supportedSports = await oddsHistoryService.getSupportedSports()
    console.log(`✅ Found ${supportedSports.length} supported sports`)
    console.log(`   Sample sports: ${supportedSports.slice(0, 5).join(', ')}`)

    // Test 2: Fetch odds for basketball
    console.log('\n2. Testing odds fetch for basketball...')
    const basketballOdds = await oddsHistoryService.fetchOddsFromApi('basketball_nba')
    console.log(`✅ Fetched ${basketballOdds.length} basketball games`)
    
    if (basketballOdds.length > 0) {
      const sampleGame = basketballOdds[0]
      console.log(`   Sample game: ${sampleGame.home_team} vs ${sampleGame.away_team}`)
      console.log(`   Bookmakers: ${sampleGame.bookmakers.length}`)
    }

    // Test 3: Store odds data
    console.log('\n3. Testing odds data storage...')
    if (basketballOdds.length > 0) {
      await oddsHistoryService.storeOddsData(basketballOdds.slice(0, 2)) // Store first 2 games
      console.log('✅ Successfully stored odds data')
    }

    // Test 4: Retrieve odds history
    console.log('\n4. Testing odds history retrieval...')
    if (basketballOdds.length > 0) {
      const gameId = basketballOdds[0].id
      const history = await oddsHistoryService.getOddsHistory(gameId, 'basketball_nba')
      console.log(`✅ Retrieved ${history.length} odds records for game ${gameId}`)
    }

    // Test 5: Cleanup old data
    console.log('\n5. Testing cleanup...')
    await oddsHistoryService.cleanupOldOdds()
    console.log('✅ Cleanup completed')

    console.log('\n🎉 All tests passed!')

  } catch (error) {
    console.error('❌ Test failed:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('THE_ODDS_API_KEY')) {
        console.log('\n💡 Make sure to set THE_ODDS_API_KEY environment variable')
      }
    }
  }
}

// Run the test
if (require.main === module) {
  testOddsPopulation()
}

export { testOddsPopulation }
