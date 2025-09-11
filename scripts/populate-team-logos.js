/**
 * POPULATE TEAM LOGOS SCRIPT
 * Dynamically populates database with team data from APIs
 */

const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Dynamic team data loading from APIs
async function loadTeamDataFromAPI(sport, league) {
  try {
    // This would call the appropriate API to get team data
    // For now, return empty array as this should be replaced with real API calls
    console.log(`Loading team data for ${sport} - ${league} from API...`)
    return []
  } catch (error) {
    console.error(`Error loading team data for ${sport} - ${league}:`, error)
    return []
  }
}

// Get supported sports and leagues from environment
async function getSupportedSports() {
  const sports = process.env.SUPPORTED_SPORTS?.split(',') || []
  const teamData = []
  
  for (const sport of sports) {
    const leagues = process.env[`${sport.toUpperCase()}_LEAGUES`]?.split(',') || []
    
    for (const league of leagues) {
      const teams = await loadTeamDataFromAPI(sport, league)
      teamData.push(...teams)
    }
  }
  
  return teamData
}

async function populateTeams() {
  console.log('🚀 Starting dynamic team data population...\n')

  // Load team data dynamically from APIs
  const teamData = await getSupportedSports()
  
  if (teamData.length === 0) {
    console.log('⚠️  No team data loaded from APIs. Please check your API configurations.')
    return
  }

  let successCount = 0
  let errorCount = 0

  for (const team of teamData) {
    try {
      const { data, error } = await supabase
        .from('teams')
        .upsert({
          name: team.name,
          city: team.city,
          league: team.league,
          sport: team.sport,
          abbreviation: team.abbreviation,
          logo_url: team.logo_url || null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'name,league'
        })
        .select()

      if (error) {
        console.error(`❌ Failed to upsert ${team.name}:`, error.message)
        errorCount++
      } else {
        console.log(`✅ Upserted ${team.name} (${team.league})`)
        successCount++
      }
    } catch (error) {
      console.error(`❌ Error upserting ${team.name}:`, error.message)
      errorCount++
    }
  }

  console.log(`\n📊 Population Summary:`)
  console.log(`✅ Successfully processed: ${successCount} teams`)
  console.log(`❌ Errors: ${errorCount} teams`)
  console.log(`📈 Total teams in database: ${successCount}`)

  console.log(`\n🎉 Dynamic team data population complete!`)
  console.log(`🔗 Your enhanced logo system is ready to use!`)
}

// Run the population
populateTeams().catch(console.error)
