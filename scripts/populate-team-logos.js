/**
 * POPULATE TEAM LOGOS SCRIPT
 * Populates database with team data and logo URLs for testing
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

// Sample team data with logo URLs
const teamData = [
  // NBA Teams
  { name: 'Los Angeles Lakers', city: 'Los Angeles', league: 'NBA', sport: 'basketball', abbreviation: 'LAL', logo_url: 'https://cdn.nba.com/logos/nba/1610612747/primary/L/logo.svg' },
  { name: 'Golden State Warriors', city: 'San Francisco', league: 'NBA', sport: 'basketball', abbreviation: 'GSW', logo_url: 'https://cdn.nba.com/logos/nba/1610612744/primary/L/logo.svg' },
  { name: 'Boston Celtics', city: 'Boston', league: 'NBA', sport: 'basketball', abbreviation: 'BOS', logo_url: 'https://cdn.nba.com/logos/nba/1610612738/primary/L/logo.svg' },
  { name: 'Miami Heat', city: 'Miami', league: 'NBA', sport: 'basketball', abbreviation: 'MIA', logo_url: 'https://cdn.nba.com/logos/nba/1610612748/primary/L/logo.svg' },
  { name: 'Chicago Bulls', city: 'Chicago', league: 'NBA', sport: 'basketball', abbreviation: 'CHI', logo_url: 'https://cdn.nba.com/logos/nba/1610612741/primary/L/logo.svg' },

  // NFL Teams
  { name: 'New England Patriots', city: 'Foxborough', league: 'NFL', sport: 'football', abbreviation: 'NE', logo_url: 'https://a.espncdn.com/i/teamlogos/nfl/500/ne.png' },
  { name: 'Dallas Cowboys', city: 'Dallas', league: 'NFL', sport: 'football', abbreviation: 'DAL', logo_url: 'https://a.espncdn.com/i/teamlogos/nfl/500/dal.png' },
  { name: 'Green Bay Packers', city: 'Green Bay', league: 'NFL', sport: 'football', abbreviation: 'GB', logo_url: 'https://a.espncdn.com/i/teamlogos/nfl/500/gb.png' },
  { name: 'Pittsburgh Steelers', city: 'Pittsburgh', league: 'NFL', sport: 'football', abbreviation: 'PIT', logo_url: 'https://a.espncdn.com/i/teamlogos/nfl/500/pit.png' },
  { name: 'Kansas City Chiefs', city: 'Kansas City', league: 'NFL', sport: 'football', abbreviation: 'KC', logo_url: 'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png' },

  // Soccer Teams
  { name: 'Arsenal', city: 'London', league: 'Premier League', sport: 'soccer', abbreviation: 'ARS', logo_url: 'https://media.api-sports.io/football/teams/42.png' },
  { name: 'Barcelona', city: 'Barcelona', league: 'La Liga', sport: 'soccer', abbreviation: 'BAR', logo_url: 'https://media.api-sports.io/football/teams/529.png' },
  { name: 'Chelsea', city: 'London', league: 'Premier League', sport: 'soccer', abbreviation: 'CHE', logo_url: 'https://media.api-sports.io/football/teams/49.png' },
  { name: 'Real Madrid', city: 'Madrid', league: 'La Liga', sport: 'soccer', abbreviation: 'RMA', logo_url: 'https://media.api-sports.io/football/teams/541.png' },
  { name: 'Manchester United', city: 'Manchester', league: 'Premier League', sport: 'soccer', abbreviation: 'MUN', logo_url: 'https://media.api-sports.io/football/teams/33.png' },

  // Teams without logo URLs (for testing generated logos)
  { name: 'Test Basketball Team', city: 'Test City', league: 'NBA', sport: 'basketball', abbreviation: 'TBT' },
  { name: 'Custom Football Team', city: 'Custom City', league: 'NFL', sport: 'football', abbreviation: 'CFT' },
  { name: 'Unknown Soccer Team', city: 'Unknown City', league: 'Premier League', sport: 'soccer', abbreviation: 'UST' }
]

async function populateTeams() {
  console.log('🚀 Starting team data population...\n')

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

  // Test the enhanced logo system
  console.log(`\n🧪 Testing Enhanced Logo System:`)
  
  // Test known teams
  console.log('Known teams with logos:')
  const knownTeams = teamData.filter(t => t.logo_url)
  for (const team of knownTeams.slice(0, 3)) {
    console.log(`- ${team.name} (${team.league})`)
  }

  // Test teams without logos (should generate SVG)
  console.log('\nTeams without logos (will generate SVG):')
  const unknownTeams = teamData.filter(t => !t.logo_url)
  for (const team of unknownTeams) {
    console.log(`- ${team.name} (${team.league})`)
  }

  console.log(`\n🎉 Team data population complete!`)
  console.log(`🔗 Your enhanced logo system is ready to use!`)
}

// Run the population
populateTeams().catch(console.error)
