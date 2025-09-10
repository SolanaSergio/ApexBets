/**
 * Complete Mock Data Cleanup Script
 * Removes ALL mock/sample data from the database
 * Ensures only real data from external APIs is used
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanupMockData() {
  console.log('🧹 Starting Complete Mock Data Cleanup...\n')
  
  try {
    // 1. Delete all mock games (they all have identical timestamps)
    console.log('🗑️  Removing mock games...')
    const { error: gamesError } = await supabase
      .from('games')
      .delete()
      .eq('created_at', '2025-09-09T21:53:57.257226+00:00')
    
    if (gamesError) {
      console.error('Error deleting mock games:', gamesError)
    } else {
      console.log('✅ Mock games removed')
    }

    // 2. Delete all mock teams (they all have identical timestamps)
    console.log('🗑️  Removing mock teams...')
    const { error: teamsError } = await supabase
      .from('teams')
      .delete()
      .eq('created_at', '2025-09-09T21:53:57.257226+00:00')
    
    if (teamsError) {
      console.error('Error deleting mock teams:', teamsError)
    } else {
      console.log('✅ Mock teams removed')
    }

    // 3. Delete all mock predictions
    console.log('🗑️  Removing mock predictions...')
    const { error: predictionsError } = await supabase
      .from('predictions')
      .delete()
      .eq('created_at', '2025-09-09T21:53:57.257226+00:00')
    
    if (predictionsError) {
      console.error('Error deleting mock predictions:', predictionsError)
    } else {
      console.log('✅ Mock predictions removed')
    }

    // 4. Delete all mock odds
    console.log('🗑️  Removing mock odds...')
    const { error: oddsError } = await supabase
      .from('odds')
      .delete()
      .eq('created_at', '2025-09-09T21:53:57.257226+00:00')
    
    if (oddsError) {
      console.error('Error deleting mock odds:', oddsError)
    } else {
      console.log('✅ Mock odds removed')
    }

    // 5. Delete all mock player stats
    console.log('🗑️  Removing mock player stats...')
    const { error: playerStatsError } = await supabase
      .from('player_stats')
      .delete()
      .eq('created_at', '2025-09-09T21:53:57.257226+00:00')
    
    if (playerStatsError) {
      console.error('Error deleting mock player stats:', playerStatsError)
    } else {
      console.log('✅ Mock player stats removed')
    }

    // 6. Delete all mock scrape logs
    console.log('🗑️  Removing mock scrape logs...')
    const { error: scrapeLogsError } = await supabase
      .from('scrape_logs')
      .delete()
      .eq('source', 'nba.com')
      .eq('data_type', 'teams')
      .eq('records_scraped', 8)
      .eq('success', true)
    
    if (scrapeLogsError) {
      console.error('Error deleting mock scrape logs:', scrapeLogsError)
    } else {
      console.log('✅ Mock scrape logs removed')
    }

    // 7. Verify cleanup
    console.log('\n🔍 Verifying cleanup...')
    
    const { data: remainingGames, error: gamesCheckError } = await supabase
      .from('games')
      .select('id, created_at')
      .limit(5)
    
    const { data: remainingTeams, error: teamsCheckError } = await supabase
      .from('teams')
      .select('id, created_at')
      .limit(5)
    
    const { data: remainingPredictions, error: predictionsCheckError } = await supabase
      .from('predictions')
      .select('id, created_at')
      .limit(5)
    
    console.log(`📊 Remaining records:`)
    console.log(`   Games: ${remainingGames?.length || 0}`)
    console.log(`   Teams: ${remainingTeams?.length || 0}`)
    console.log(`   Predictions: ${remainingPredictions?.length || 0}`)
    
    // Check for any remaining mock data patterns
    const mockDataFound = []
    
    if (remainingGames?.some(g => g.created_at === '2025-09-09T21:53:57.257226+00:00')) {
      mockDataFound.push('Games with mock timestamps')
    }
    
    if (remainingTeams?.some(t => t.created_at === '2025-09-09T21:53:57.257226+00:00')) {
      mockDataFound.push('Teams with mock timestamps')
    }
    
    if (remainingPredictions?.some(p => p.created_at === '2025-09-09T21:53:57.257226+00:00')) {
      mockDataFound.push('Predictions with mock timestamps')
    }
    
    if (mockDataFound.length > 0) {
      console.log('\n⚠️  WARNING: Mock data still detected:')
      mockDataFound.forEach(item => console.log(`   - ${item}`))
    } else {
      console.log('\n✅ SUCCESS: All mock data has been removed!')
      console.log('🎯 Database is now clean and ready for real data only')
    }
    
    console.log('\n📋 Next Steps:')
    console.log('1. Run your scrapers to populate with real data')
    console.log('2. Test the APIs to ensure they work with real data')
    console.log('3. Verify no mock data patterns in responses')
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error)
    process.exit(1)
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanupMockData().catch(console.error)
}

module.exports = { cleanupMockData }
