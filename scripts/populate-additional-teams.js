/**
 * Populate Additional Teams for All Sports
 * Adds comprehensive team data for NHL, Soccer, and other sports
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// NHL Teams Data
const nhlTeams = [
  {
    name: 'Anaheim Ducks',
    city: 'Anaheim',
    abbreviation: 'ANA',
    conference: 'Western',
    division: 'Pacific',
  },
  {
    name: 'Arizona Coyotes',
    city: 'Tempe',
    abbreviation: 'ARI',
    conference: 'Western',
    division: 'Central',
  },
  {
    name: 'Boston Bruins',
    city: 'Boston',
    abbreviation: 'BOS',
    conference: 'Eastern',
    division: 'Atlantic',
  },
  {
    name: 'Buffalo Sabres',
    city: 'Buffalo',
    abbreviation: 'BUF',
    conference: 'Eastern',
    division: 'Atlantic',
  },
  {
    name: 'Calgary Flames',
    city: 'Calgary',
    abbreviation: 'CGY',
    conference: 'Western',
    division: 'Pacific',
  },
  {
    name: 'Carolina Hurricanes',
    city: 'Raleigh',
    abbreviation: 'CAR',
    conference: 'Eastern',
    division: 'Metropolitan',
  },
  {
    name: 'Chicago Blackhawks',
    city: 'Chicago',
    abbreviation: 'CHI',
    conference: 'Western',
    division: 'Central',
  },
  {
    name: 'Colorado Avalanche',
    city: 'Denver',
    abbreviation: 'COL',
    conference: 'Western',
    division: 'Central',
  },
  {
    name: 'Columbus Blue Jackets',
    city: 'Columbus',
    abbreviation: 'CBJ',
    conference: 'Eastern',
    division: 'Metropolitan',
  },
  {
    name: 'Dallas Stars',
    city: 'Dallas',
    abbreviation: 'DAL',
    conference: 'Western',
    division: 'Central',
  },
  {
    name: 'Detroit Red Wings',
    city: 'Detroit',
    abbreviation: 'DET',
    conference: 'Eastern',
    division: 'Atlantic',
  },
  {
    name: 'Edmonton Oilers',
    city: 'Edmonton',
    abbreviation: 'EDM',
    conference: 'Western',
    division: 'Pacific',
  },
  {
    name: 'Florida Panthers',
    city: 'Sunrise',
    abbreviation: 'FLA',
    conference: 'Eastern',
    division: 'Atlantic',
  },
  {
    name: 'Los Angeles Kings',
    city: 'Los Angeles',
    abbreviation: 'LAK',
    conference: 'Western',
    division: 'Pacific',
  },
  {
    name: 'Minnesota Wild',
    city: 'Saint Paul',
    abbreviation: 'MIN',
    conference: 'Western',
    division: 'Central',
  },
  {
    name: 'Montreal Canadiens',
    city: 'Montreal',
    abbreviation: 'MTL',
    conference: 'Eastern',
    division: 'Atlantic',
  },
  {
    name: 'Nashville Predators',
    city: 'Nashville',
    abbreviation: 'NSH',
    conference: 'Western',
    division: 'Central',
  },
  {
    name: 'New Jersey Devils',
    city: 'Newark',
    abbreviation: 'NJD',
    conference: 'Eastern',
    division: 'Metropolitan',
  },
  {
    name: 'New York Islanders',
    city: 'Elmont',
    abbreviation: 'NYI',
    conference: 'Eastern',
    division: 'Metropolitan',
  },
  {
    name: 'New York Rangers',
    city: 'New York',
    abbreviation: 'NYR',
    conference: 'Eastern',
    division: 'Metropolitan',
  },
  {
    name: 'Ottawa Senators',
    city: 'Ottawa',
    abbreviation: 'OTT',
    conference: 'Eastern',
    division: 'Atlantic',
  },
  {
    name: 'Philadelphia Flyers',
    city: 'Philadelphia',
    abbreviation: 'PHI',
    conference: 'Eastern',
    division: 'Metropolitan',
  },
  {
    name: 'Pittsburgh Penguins',
    city: 'Pittsburgh',
    abbreviation: 'PIT',
    conference: 'Eastern',
    division: 'Metropolitan',
  },
  {
    name: 'San Jose Sharks',
    city: 'San Jose',
    abbreviation: 'SJ',
    conference: 'Western',
    division: 'Pacific',
  },
  {
    name: 'Seattle Kraken',
    city: 'Seattle',
    abbreviation: 'SEA',
    conference: 'Western',
    division: 'Pacific',
  },
  {
    name: 'St. Louis Blues',
    city: 'St. Louis',
    abbreviation: 'STL',
    conference: 'Western',
    division: 'Central',
  },
  {
    name: 'Tampa Bay Lightning',
    city: 'Tampa',
    abbreviation: 'TB',
    conference: 'Eastern',
    division: 'Atlantic',
  },
  {
    name: 'Toronto Maple Leafs',
    city: 'Toronto',
    abbreviation: 'TOR',
    conference: 'Eastern',
    division: 'Atlantic',
  },
  {
    name: 'Vancouver Canucks',
    city: 'Vancouver',
    abbreviation: 'VAN',
    conference: 'Western',
    division: 'Pacific',
  },
  {
    name: 'Vegas Golden Knights',
    city: 'Paradise',
    abbreviation: 'VGK',
    conference: 'Western',
    division: 'Pacific',
  },
  {
    name: 'Washington Capitals',
    city: 'Washington',
    abbreviation: 'WSH',
    conference: 'Eastern',
    division: 'Metropolitan',
  },
  {
    name: 'Winnipeg Jets',
    city: 'Winnipeg',
    abbreviation: 'WPG',
    conference: 'Western',
    division: 'Central',
  },
]

// Premier League Teams Data
const premierLeagueTeams = [
  { name: 'Arsenal', city: 'London', abbreviation: 'ARS', country: 'England' },
  { name: 'Aston Villa', city: 'Birmingham', abbreviation: 'AVL', country: 'England' },
  { name: 'Bournemouth', city: 'Bournemouth', abbreviation: 'BOU', country: 'England' },
  { name: 'Brentford', city: 'London', abbreviation: 'BRE', country: 'England' },
  { name: 'Brighton & Hove Albion', city: 'Brighton', abbreviation: 'BHA', country: 'England' },
  { name: 'Chelsea', city: 'London', abbreviation: 'CHE', country: 'England' },
  { name: 'Crystal Palace', city: 'London', abbreviation: 'CRY', country: 'England' },
  { name: 'Everton', city: 'Liverpool', abbreviation: 'EVE', country: 'England' },
  { name: 'Fulham', city: 'London', abbreviation: 'FUL', country: 'England' },
  { name: 'Ipswich Town', city: 'Ipswich', abbreviation: 'IPS', country: 'England' },
  { name: 'Leicester City', city: 'Leicester', abbreviation: 'LEI', country: 'England' },
  { name: 'Liverpool', city: 'Liverpool', abbreviation: 'LIV', country: 'England' },
  { name: 'Manchester City', city: 'Manchester', abbreviation: 'MCI', country: 'England' },
  { name: 'Manchester United', city: 'Manchester', abbreviation: 'MUN', country: 'England' },
  { name: 'Newcastle United', city: 'Newcastle', abbreviation: 'NEW', country: 'England' },
  { name: 'Nottingham Forest', city: 'Nottingham', abbreviation: 'NFO', country: 'England' },
  { name: 'Southampton', city: 'Southampton', abbreviation: 'SOU', country: 'England' },
  { name: 'Tottenham Hotspur', city: 'London', abbreviation: 'TOT', country: 'England' },
  { name: 'West Ham United', city: 'London', abbreviation: 'WHU', country: 'England' },
  {
    name: 'Wolverhampton Wanderers',
    city: 'Wolverhampton',
    abbreviation: 'WOL',
    country: 'England',
  },
]

// La Liga Teams Data
const laLigaTeams = [
  { name: 'Real Madrid', city: 'Madrid', abbreviation: 'RMA', country: 'Spain' },
  { name: 'Barcelona', city: 'Barcelona', abbreviation: 'BAR', country: 'Spain' },
  { name: 'Atletico Madrid', city: 'Madrid', abbreviation: 'ATM', country: 'Spain' },
  { name: 'Real Sociedad', city: 'San Sebastian', abbreviation: 'RSO', country: 'Spain' },
  { name: 'Real Betis', city: 'Seville', abbreviation: 'BET', country: 'Spain' },
  { name: 'Villarreal', city: 'Villarreal', abbreviation: 'VIL', country: 'Spain' },
  { name: 'Valencia', city: 'Valencia', abbreviation: 'VAL', country: 'Spain' },
  { name: 'Athletic Bilbao', city: 'Bilbao', abbreviation: 'ATH', country: 'Spain' },
  { name: 'Sevilla', city: 'Seville', abbreviation: 'SEV', country: 'Spain' },
  { name: 'Getafe', city: 'Getafe', abbreviation: 'GET', country: 'Spain' },
  { name: 'Osasuna', city: 'Pamplona', abbreviation: 'OSA', country: 'Spain' },
  { name: 'Las Palmas', city: 'Las Palmas', abbreviation: 'LPA', country: 'Spain' },
  { name: 'Rayo Vallecano', city: 'Madrid', abbreviation: 'RAY', country: 'Spain' },
  { name: 'Mallorca', city: 'Palma', abbreviation: 'MAL', country: 'Spain' },
  { name: 'Alaves', city: 'Vitoria', abbreviation: 'ALA', country: 'Spain' },
  { name: 'Cadiz', city: 'Cadiz', abbreviation: 'CAD', country: 'Spain' },
  { name: 'Celta Vigo', city: 'Vigo', abbreviation: 'CEL', country: 'Spain' },
  { name: 'Girona', city: 'Girona', abbreviation: 'GIR', country: 'Spain' },
  { name: 'Almeria', city: 'Almeria', abbreviation: 'ALM', country: 'Spain' },
  { name: 'Granada', city: 'Granada', abbreviation: 'GRA', country: 'Spain' },
]

async function populateNHLTeams() {
  console.log('🏒 Populating NHL Teams...')

  const { data: nhlLeague } = await supabase.from('leagues').select('id').eq('name', 'NHL').single()

  if (nhlLeague) {
    const nhlTeamData = nhlTeams.map(team => ({
      name: team.name,
      sport: 'hockey',
      league_id: nhlLeague.id,
      league_name: 'NHL',
      abbreviation: team.abbreviation,
      city: team.city,
      country: 'United States',
      colors: JSON.stringify({
        primary: '#000000',
        secondary: '#C8102E',
        conference: team.conference,
        division: team.division,
      }),
    }))

    const { error } = await supabase.from('teams').upsert(nhlTeamData, { onConflict: 'name,sport' })

    if (error) {
      console.error('❌ Error inserting NHL teams:', error)
    } else {
      console.log(`✅ Inserted ${nhlTeams.length} NHL teams`)
    }
  }
}

async function populateSoccerTeams() {
  console.log('⚽ Populating Soccer Teams...')

  // Premier League teams
  const { data: plLeague } = await supabase
    .from('leagues')
    .select('id')
    .eq('name', 'Premier League')
    .single()

  if (plLeague) {
    const plTeamData = premierLeagueTeams.map(team => ({
      name: team.name,
      sport: 'soccer',
      league_id: plLeague.id,
      league_name: 'Premier League',
      abbreviation: team.abbreviation,
      city: team.city,
      country: team.country,
      colors: JSON.stringify({
        primary: '#37003C',
        secondary: '#00FF85',
        league: 'Premier League',
      }),
    }))

    const { error: plError } = await supabase
      .from('teams')
      .upsert(plTeamData, { onConflict: 'name,sport' })

    if (plError) {
      console.error('❌ Error inserting Premier League teams:', plError)
    } else {
      console.log(`✅ Inserted ${premierLeagueTeams.length} Premier League teams`)
    }
  }

  // La Liga teams
  const { data: llLeague } = await supabase
    .from('leagues')
    .select('id')
    .eq('name', 'La Liga')
    .single()

  if (llLeague) {
    const llTeamData = laLigaTeams.map(team => ({
      name: team.name,
      sport: 'soccer',
      league_id: llLeague.id,
      league_name: 'La Liga',
      abbreviation: team.abbreviation,
      city: team.city,
      country: team.country,
      colors: JSON.stringify({
        primary: '#FF6B35',
        secondary: '#F7931E',
        league: 'La Liga',
      }),
    }))

    const { error: llError } = await supabase
      .from('teams')
      .upsert(llTeamData, { onConflict: 'name,sport' })

    if (llError) {
      console.error('❌ Error inserting La Liga teams:', llError)
    } else {
      console.log(`✅ Inserted ${laLigaTeams.length} La Liga teams`)
    }
  }
}

async function populateSamplePlayers() {
  console.log('👤 Populating Sample Players...')

  // Get some teams to add players to
  const { data: teams } = await supabase.from('teams').select('id, name, sport').limit(20)

  if (teams && teams.length > 0) {
    const samplePlayers = [
      // NBA Players
      {
        name: 'LeBron James',
        sport: 'basketball',
        position: 'Forward',
        jersey_number: 6,
        age: 39,
        height: '6-9',
        weight: 250,
      },
      {
        name: 'Stephen Curry',
        sport: 'basketball',
        position: 'Guard',
        jersey_number: 30,
        age: 35,
        height: '6-3',
        weight: 190,
      },
      {
        name: 'Kevin Durant',
        sport: 'basketball',
        position: 'Forward',
        jersey_number: 7,
        age: 35,
        height: '6-11',
        weight: 240,
      },
      {
        name: 'Giannis Antetokounmpo',
        sport: 'basketball',
        position: 'Forward',
        jersey_number: 34,
        age: 29,
        height: '6-11',
        weight: 242,
      },
      {
        name: 'Luka Doncic',
        sport: 'basketball',
        position: 'Guard',
        jersey_number: 77,
        age: 25,
        height: '6-7',
        weight: 230,
      },

      // NFL Players
      {
        name: 'Tom Brady',
        sport: 'football',
        position: 'Quarterback',
        jersey_number: 12,
        age: 46,
        height: '6-4',
        weight: 225,
      },
      {
        name: 'Aaron Rodgers',
        sport: 'football',
        position: 'Quarterback',
        jersey_number: 8,
        age: 40,
        height: '6-2',
        weight: 225,
      },
      {
        name: 'Travis Kelce',
        sport: 'football',
        position: 'Tight End',
        jersey_number: 87,
        age: 34,
        height: '6-5',
        weight: 260,
      },
      {
        name: 'Cooper Kupp',
        sport: 'football',
        position: 'Wide Receiver',
        jersey_number: 10,
        age: 31,
        height: '6-2',
        weight: 208,
      },
      {
        name: 'Josh Allen',
        sport: 'football',
        position: 'Quarterback',
        jersey_number: 17,
        age: 28,
        height: '6-5',
        weight: 237,
      },

      // MLB Players
      {
        name: 'Mike Trout',
        sport: 'baseball',
        position: 'Outfielder',
        jersey_number: 27,
        age: 32,
        height: '6-2',
        weight: 235,
      },
      {
        name: 'Aaron Judge',
        sport: 'baseball',
        position: 'Outfielder',
        jersey_number: 99,
        age: 31,
        height: '6-7',
        weight: 282,
      },
      {
        name: 'Mookie Betts',
        sport: 'baseball',
        position: 'Outfielder',
        jersey_number: 50,
        age: 31,
        height: '5-9',
        weight: 180,
      },
      {
        name: 'Ronald Acuna Jr.',
        sport: 'baseball',
        position: 'Outfielder',
        jersey_number: 13,
        age: 26,
        height: '6-0',
        weight: 205,
      },
      {
        name: 'Vladimir Guerrero Jr.',
        sport: 'baseball',
        position: 'First Baseman',
        jersey_number: 27,
        age: 25,
        height: '6-2',
        weight: 250,
      },
    ]

    const playerData = samplePlayers.map(player => {
      const team = teams.find(t => t.sport === player.sport)
      return {
        name: player.name,
        sport: player.sport,
        team_id: team?.id || null,
        team_name: team?.name || null,
        position: player.position,
        jersey_number: player.jersey_number,
        age: player.age,
        height: player.height,
        weight: player.weight,
        is_active: true,
      }
    })

    const { error } = await supabase
      .from('player_profiles')
      .upsert(playerData, { onConflict: 'name,sport' })

    if (error) {
      console.error('❌ Error inserting sample players:', error)
    } else {
      console.log(`✅ Inserted ${samplePlayers.length} sample players`)
    }
  }
}

async function populateSampleStandings() {
  console.log('🏆 Populating Sample Standings...')

  // Get some teams to create standings for
  const { data: teams } = await supabase
    .from('teams')
    .select('id, name, sport, league_name')
    .limit(30)

  if (teams && teams.length > 0) {
    const standingsData = teams.map((team, index) => ({
      sport: team.sport,
      league_name: team.league_name,
      team_id: team.id,
      team_name: team.name,
      position: index + 1,
      games_played: 82,
      wins: Math.floor(Math.random() * 60) + 20,
      losses: Math.floor(Math.random() * 60) + 20,
      ties: team.sport === 'soccer' ? Math.floor(Math.random() * 20) : 0,
      win_percentage: Math.random() * 0.8 + 0.2,
      points_for: Math.floor(Math.random() * 1000) + 500,
      points_against: Math.floor(Math.random() * 1000) + 500,
      point_differential: Math.floor(Math.random() * 200) - 100,
    }))

    const { error } = await supabase
      .from('league_standings')
      .upsert(standingsData, { onConflict: 'sport,team_id' })

    if (error) {
      console.error('❌ Error inserting sample standings:', error)
    } else {
      console.log(`✅ Inserted ${standingsData.length} sample standings`)
    }
  }
}

async function main() {
  console.log('🚀 Populating Additional Teams and Data...')
  console.log('📊 Adding comprehensive team data for all sports')
  console.log('=' * 60)

  try {
    await populateNHLTeams()
    await populateSoccerTeams()
    await populateSamplePlayers()
    await populateSampleStandings()

    console.log('\n🎯 Additional Data Population Summary:')
    console.log('✅ NHL Teams: Added comprehensive hockey teams')
    console.log('✅ Soccer Teams: Added Premier League and La Liga teams')
    console.log('✅ Sample Players: Added professional athletes')
    console.log('✅ Sample Standings: Added current season standings')

    console.log('\n🎉 Additional data population completed successfully!')
  } catch (error) {
    console.error('💥 Population failed:', error)
    process.exit(1)
  }
}

// Run the population
main()
  .then(() => {
    console.log('\n🎊 All additional data populated!')
  })
  .catch(error => {
    console.error('💥 Script crashed:', error)
    process.exit(1)
  })
