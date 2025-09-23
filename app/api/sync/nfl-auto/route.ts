import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(_request: NextRequest) {
  try {
    console.log('Starting automatic NFL data sync...')
    
    // Fetch NFL games and teams from ESPN API
    const today = new Date().toISOString().split('T')[0]
    
    // Get today's games from ESPN NFL API
    const gamesResponse = await fetch(`http://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${today}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    let gamesData: { events: unknown[] } = { events: [] }
    if (gamesResponse.ok) {
      gamesData = await gamesResponse.json()
    } else {
      console.warn(`ESPN NFL Games API returned ${gamesResponse.status} - likely no games today (off-season)`)
    }
    
    // Get teams from ESPN NFL API
    const teamsResponse = await fetch('http://site.api.espn.com/apis/site/v2/sports/football/nfl/teams', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!teamsResponse.ok) {
      throw new Error(`ESPN NFL Teams API error: ${teamsResponse.status}`)
    }

    const teamsData: any = await teamsResponse.json()

    // Process games data from ESPN
    const games = (gamesData.events || []) as any[]
    
    // Process teams data from ESPN
    const teams = teamsData.sports?.[0]?.leagues?.[0]?.teams?.map((t: any) => t.team) || []

    console.log(`Found ${games.length} NFL games for today`)
    console.log(`Found ${teams.length} NFL teams`)

    // Fetch existing teams to map names to UUIDs
    const { data: existingTeams, error: fetchTeamsError } = await supabase
      .from('teams')
      .select('id, name, sport, league')
      .eq('sport', 'football')

    if (fetchTeamsError) {
      console.error('Error fetching existing teams:', fetchTeamsError)
      return NextResponse.json({ success: false, message: 'Failed to fetch existing teams' }, { status: 500 })
    }

    const teamNameToIdMap = new Map<string, string>()
    ;(existingTeams || []).forEach((team: any) => {
      if (team?.name && team?.id) {
        teamNameToIdMap.set(team.name, team.id)
      }
    })

    let teamsSynced = 0
    let gamesSynced = 0

    // Sync teams first
    if (teams.length > 0) {
      for (const team of teams as any[]) {
        try {
          const teamName = team.displayName || team.name
          const teamCity = team.location
          const fullTeamName = team.displayName || `${teamCity} ${teamName}`
          
          if (!teamName) {
            console.warn('Skipping team due to missing name:', team)
            continue
          }

          let teamUuid = teamNameToIdMap.get(fullTeamName) || teamNameToIdMap.get(teamName)
          if (!teamUuid) {
            // If team doesn't exist, generate a new UUID
            teamUuid = crypto.randomUUID()
            teamNameToIdMap.set(fullTeamName, teamUuid)
            teamNameToIdMap.set(teamName, teamUuid)
          }

          const { error } = await supabase
            .from('teams')
            .upsert({
              id: teamUuid,
              name: fullTeamName,
              sport: 'football',
              league: 'NFL',
              abbreviation: team.abbreviation,
              city: teamCity,
              logo_url: team.logos?.[0]?.href || null,
              conference: null, // ESPN doesn't provide conference info
              division: null, // ESPN doesn't provide division info
              founded_year: null,
              stadium_name: null,
              stadium_capacity: null,
              primary_color: team.color || null,
              secondary_color: team.alternateColor || null,
              country: 'USA',
              is_active: team.isActive !== false,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'name,sport,league',
              ignoreDuplicates: false
            })

          if (error) {
            console.error(`Error upserting team ${fullTeamName}:`, error)
          } else {
            teamsSynced++
          }
        } catch (error) {
          console.error(`Error processing team ${team.displayName}:`, error)
        }
      }
    }

    // Sync games
    if ((games as any[]).length > 0) {
      console.log(`Processing ${games.length} games...`)
      for (const game of games as any[]) {
        try {
          const gameId = game.id
          const competition = game.competitions?.[0]
          
          if (!competition) {
            console.warn(`Skipping game ${gameId} due to missing competition data`)
            continue
          }

          const homeTeam = competition.competitors?.find((c: any) => c.homeAway === 'home')?.team
          const awayTeam = competition.competitors?.find((c: any) => c.homeAway === 'away')?.team

          if (!homeTeam || !awayTeam) {
            console.warn(`Skipping game ${gameId} due to missing team data`)
            continue
          }

          const homeTeamName = homeTeam.displayName || homeTeam.name
          const awayTeamName = awayTeam.displayName || awayTeam.name

          const homeTeamUuid = teamNameToIdMap.get(homeTeamName)
          const awayTeamUuid = teamNameToIdMap.get(awayTeamName)

          if (!homeTeamUuid || !awayTeamUuid) {
            console.warn(`Skipping game ${gameId} due to missing team UUIDs: Home: ${homeTeamName} (${homeTeamUuid}), Away: ${awayTeamName} (${awayTeamUuid})`)
            continue
          }

          // Map ESPN status to our database status
          let gameStatusMapped = 'scheduled'
          const statusType: string | undefined = game.status?.type?.state
          if (statusType === 'post') {
            gameStatusMapped = 'completed'
          } else if (statusType === 'in') {
            gameStatusMapped = 'live'
          }

          // Get scores if available
          const homeScore = homeTeam.score ? parseInt(homeTeam.score) : null
          const awayScore = awayTeam.score ? parseInt(awayTeam.score) : null

          console.log(`Processing game ${gameId}: ${awayTeamName} vs ${homeTeamName} (Status: ${gameStatusMapped})`)

          const { error } = await supabase
            .from('games')
            .upsert({
              sport: 'football',
              league: 'NFL',
              season: '2024-25', // Current NFL season
              home_team_id: homeTeamUuid,
              away_team_id: awayTeamUuid,
              game_date: game.date,
              status: gameStatusMapped,
              home_score: homeScore,
              away_score: awayScore,
              venue: competition.venue?.fullName || null,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'home_team_id,away_team_id,game_date',
              ignoreDuplicates: false
            })

          if (error) {
            console.error(`Error upserting game ${gameId}:`, error)
          } else {
            gamesSynced++
            console.log(`Successfully synced game ${gameId}`)
          }
        } catch (error) {
          console.error(`Error processing game ${String((game as any)?.id)}:`, error)
        }
      }
    } else {
      console.log('No games found to sync')
    }

    console.log(`Successfully synced ${gamesSynced} games and ${teamsSynced} teams`)

    return NextResponse.json({
      success: true,
      message: 'NFL data sync completed successfully',
      stats: {
        games: gamesSynced,
        teams: teamsSynced
      }
    })

  } catch (error) {
    console.error('NFL auto-sync error:', error)
    return NextResponse.json({
      success: false,
      message: 'NFL data sync failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
