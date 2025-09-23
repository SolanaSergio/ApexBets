import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('Starting automatic MLB data sync...')
    
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration')
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Get today's games from MLB Stats API
    const today = new Date().toISOString().split('T')[0]
    const gamesUrl = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate=${today}&endDate=${today}`
    
    console.log('Fetching MLB games from:', gamesUrl)
    
    const gamesResponse = await fetch(gamesUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ProjectApex/1.0.0'
      }
    })
    
    if (!gamesResponse.ok) {
      throw new Error(`MLB API request failed: ${gamesResponse.status} ${gamesResponse.statusText}`)
    }
    
    const gamesData = await gamesResponse.json()
    const games = gamesData.dates?.[0]?.games || []
    
    console.log(`Found ${games.length} MLB games for today`)
    
    // Build a map of existing baseball teams to resolve foreign keys
    const { data: existingTeams, error: teamsFetchError } = await supabase
      .from('teams')
      .select('id, name')
      .eq('sport', 'baseball')

    if (teamsFetchError) {
      throw new Error(`Failed to fetch existing teams: ${teamsFetchError.message}`)
    }

    const teamNameToId = new Map<string, string>()
    ;(existingTeams || []).forEach((t: any) => {
      if (t?.name) teamNameToId.set(String(t.name).toLowerCase(), t.id)
    })

    let gamesSynced = 0
    let teamsSynced = 0
    
    // Sync games
    if (games.length > 0) {
      console.log(`Processing ${games.length} games...`)
      for (const game of games) {
        try {
          // Resolve team UUIDs by name from existing DB teams
          const homeName = game.teams?.home?.team?.name as string
          const awayName = game.teams?.away?.team?.name as string
          const homeTeamId = homeName ? teamNameToId.get(homeName.toLowerCase()) : undefined
          const awayTeamId = awayName ? teamNameToId.get(awayName.toLowerCase()) : undefined

          if (!homeTeamId || !awayTeamId) {
            console.warn(`Skipping game ${game.gamePk} due to missing team mapping:`, { homeName, awayName })
            continue
          }

          // Create UUID for the game row
          const gameUuid = crypto.randomUUID()
          
          console.log(`Processing game ${game.gamePk}: ${game.teams.away.team.name} vs ${game.teams.home.team.name}`)
          
          const { error } = await supabase
            .from('games')
            .upsert({
              sport: 'baseball',
              league: 'MLB',
              season: game.season.toString(),
              home_team_id: homeTeamId,
              away_team_id: awayTeamId,
              game_date: game.gameDate,
              status: (() => {
                const s = String(game.status?.abstractGameState || '').toLowerCase()
                if (s === 'preview') return 'scheduled'
                if (s === 'final') return 'completed'
                return s || 'scheduled'
              })(),
              home_score: game.teams.home.score || null,
              away_score: game.teams.away.score || null,
              venue: game.venue?.name || null,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'home_team_id,away_team_id,game_date',
              ignoreDuplicates: false
            })
          
          if (error) {
            console.error(`Error upserting game ${game.gamePk}:`, error)
          } else {
            gamesSynced++
            console.log(`Successfully synced game ${game.gamePk}`)
          }
        } catch (error) {
          console.error(`Error processing game ${game.gamePk}:`, error)
        }
      }
    } else {
      console.log('No games found to sync')
    }
    
    console.log(`Successfully synced ${gamesSynced} games and ${teamsSynced} teams`)
    
    return NextResponse.json({
      success: true,
      message: 'MLB data sync completed successfully',
      stats: {
        games: gamesSynced,
        teams: teamsSynced
      }
    })
    
  } catch (error) {
    console.error('MLB sync error:', error)
    return NextResponse.json({
      success: false,
      error: 'MLB sync failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'MLB Auto Sync API - Use POST to trigger sync',
    endpoints: {
      POST: '/api/sync/mlb-auto - Trigger MLB data sync'
    }
  })
}
