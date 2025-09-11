/**
 * Simple database connection test
 */

async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...')
    
    const { createClient } = await import('./lib/supabase/server')
    const supabase = await createClient()
    
    if (!supabase) {
      console.error('❌ Database connection failed - no client returned')
      return
    }
    
    console.log('✅ Database client created successfully')
    
    // Test a simple query
    const { data, error } = await supabase
      .from('player_stats')
      .select('*')
      .limit(5)
    
    if (error) {
      console.error('❌ Database query failed:', error)
      return
    }
    
    console.log('✅ Database query successful')
    console.log(`Found ${data?.length || 0} player stats records`)
    
    // Test team stats query
    const { data: teamData, error: teamError } = await supabase
      .from('league_standings')
      .select('*')
      .limit(5)
    
    if (teamError) {
      console.error('❌ Team stats query failed:', teamError)
      return
    }
    
    console.log('✅ Team stats query successful')
    console.log(`Found ${teamData?.length || 0} team standings records`)
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testDatabaseConnection()
